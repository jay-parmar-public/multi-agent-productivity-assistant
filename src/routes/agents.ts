// @ts-nocheck
import { Hono } from "hono";
import { getManagerAgent } from "../agents/manager.js";
import { getDigestGeneratorAgent } from "../agents/digestGenerator.js";
import { InMemoryRunner } from "@google/adk";
import { prisma } from "../db/client.js";

const app = new Hono();

// ---------------------------------------------------------------------------
// Helper: Extract final text content from the last model event of a given agent
// ---------------------------------------------------------------------------
function extractAgentResult(events: any[], agentName: string): any {
  let finalResult = null;
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.author === agentName && event.content?.role === "model") {
      const textPart = event.content.parts?.find((p: any) => p.text);
      if (textPart) {
        try {
          finalResult = JSON.parse(textPart.text);
        } catch {
          finalResult = textPart.text;
        }
        break;
      }
    }
  }
  return finalResult;
}

// ---------------------------------------------------------------------------
// Helper: Extract ALL text content from function_call results in the event
// stream. Sub-agent results come back as function_response parts.
// ---------------------------------------------------------------------------
function extractFunctionCallResults(events: any[], functionName: string): any[] {
  const results: any[] = [];
  for (const event of events) {
    if (!event.content?.parts) continue;
    for (const part of event.content.parts) {
      if (part.functionResponse?.name === functionName) {
        const resp = part.functionResponse.response;
        if (resp) {
          try {
            const parsed = typeof resp === "string" ? JSON.parse(resp) : resp;
            results.push(parsed);
          } catch {
            results.push(resp);
          }
        }
      }
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Helper: Search all events for digest-like content
// ---------------------------------------------------------------------------
function extractDigestFromEvents(events: any[]): any {
  // 1. Check generate_digest function_response
  const digestResults = extractFunctionCallResults(events, "generate_digest");
  for (const result of digestResults) {
    if (result?.markdownContent) return result;
    if (typeof result === "string") {
      try {
        const parsed = JSON.parse(result);
        if (parsed?.markdownContent) return parsed;
      } catch {}
    }
  }

  // 2. Check agent model outputs
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.content?.role === "model") {
      for (const part of (event.content.parts || [])) {
        if (part.text) {
          try {
            const parsed = JSON.parse(part.text);
            if (parsed?.markdownContent) return parsed;
          } catch {}
        }
      }
    }
  }

  // 3. Check all function_response parts
  for (const event of events) {
    if (!event.content?.parts) continue;
    for (const part of event.content.parts) {
      if (part.functionResponse) {
        try {
          const resp = typeof part.functionResponse.response === "string"
            ? JSON.parse(part.functionResponse.response)
            : part.functionResponse.response;
          if (resp?.markdownContent) return resp;
        } catch {}
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Helper: Check if save_digest was called and succeeded in the event stream
// ---------------------------------------------------------------------------
function checkDigestSaved(events: any[]): { saved: boolean; digestId: string | null } {
  // Check function_response from save_digest
  const results = extractFunctionCallResults(events, "save_digest");
  for (const r of results) {
    if (r?.success && r?.digestId) {
      return { saved: true, digestId: r.digestId };
    }
  }
  return { saved: false, digestId: null };
}

// ---------------------------------------------------------------------------
// Helper: Persist a digest to the database (fallback)
// ---------------------------------------------------------------------------
async function persistDigest(digestResult: any): Promise<string | null> {
  const markdown =
    digestResult?.markdownContent ||
    digestResult?.content_md ||
    (typeof digestResult === "string" ? digestResult : null);

  if (!markdown) return null;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const digest = await prisma.digest.create({
    data: {
      weekStart,
      weekEnd,
      contentMd: markdown,
      stats: digestResult?.stats || null,
    },
  });

  return digest.id;
}

// ---------------------------------------------------------------------------
// POST /curate — Trigger AI curation pipeline
// Manager Agent → reads sheets → curate_achievement per item
// ---------------------------------------------------------------------------
app.post("/curate", async (c) => {
  try {
    const { managerAgent } = await getManagerAgent();
    const runner = new InMemoryRunner({ agent: managerAgent });

    const generator = runner.runEphemeral({
      userId: "api-user",
      newMessage: {
        role: "user",
        parts: [
          {
            text: "Read achievements from the Google Sheet (filter by pending status). Curate each one and save to the database. Do not generate a digest yet.",
          },
        ],
      },
    });

    const events: any[] = [];
    for await (const event of generator) {
      events.push(event);
    }

    const agentResult = extractAgentResult(events, "manager-agent");
    const curateResults = extractFunctionCallResults(events, "curate_achievement");
    console.log(`[curate] curate_achievement function results: ${curateResults.length}`);

    return c.json({
      success: true,
      message: `Curation complete. ${curateResults.length} achievements processed.`,
      processed: curateResults.length,
      agentOutput: agentResult,
    });
  } catch (error) {
    console.error("[curate] Error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /digest/generate — Generate the weekly digest
// 
// Runs the digest generator sub-agent DIRECTLY (bypasses the manager).
// If curated achievements exist in DB, feeds them to the agent.
// The agent will also persist the digest via its save_digest tool.
// ---------------------------------------------------------------------------
app.post("/digest/generate", async (c) => {
  try {
    // Read curated achievements from DB
    const curated = await prisma.curatedAchievement.findMany({
      where: { isDuplicate: false },
      include: { achievement: true },
      orderBy: { impactScore: "desc" },
    });

    console.log(`[digest/generate] Found ${curated.length} non-duplicate curated achievements in DB`);

    if (curated.length === 0) {
      return c.json({
        success: false,
        message: "No curated achievements found in the database. Run POST /curate first.",
      }, 400);
    }

    // Format curated data for the agent
    const curatedPayload = curated.map((c: any) => ({
      team: c.achievement.team,
      originalText: c.achievement.text,
      category: c.category,
      impactScore: c.impactScore,
      summary: c.summary,
      isDuplicate: c.isDuplicate,
      enrichment: c.enrichment,
    }));

    // Run the digest generator sub-agent directly — no manager overhead
    const digestAgent = getDigestGeneratorAgent();
    const runner = new InMemoryRunner({ agent: digestAgent });

    const generator = runner.runEphemeral({
      userId: "api-user",
      newMessage: {
        role: "user",
        parts: [
          {
            text: `Generate the weekly achievement digest from the following ${curatedPayload.length} curated achievements and save it to the database using the save_digest tool.\n\nCurated Achievements:\n${JSON.stringify(curatedPayload, null, 2)}`,
          },
        ],
      },
    });

    const events: any[] = [];
    for await (const event of generator) {
      events.push(event);
      if (event.author && event.content?.role) {
        console.log(`[digest/generate] Event: author=${event.author}, role=${event.content.role}`);
      }
    }

    // Extract the digest content from the agent's output
    const digestAgentResult = extractAgentResult(events, "digest-generator-agent");
    const digestContent = digestAgentResult || extractDigestFromEvents(events);

    // Check if the agent already saved to DB via save_digest tool
    const { saved: agentSaved, digestId: agentDigestId } = checkDigestSaved(events);

    console.log(`[digest/generate] Agent result found: ${!!digestContent}`);
    console.log(`[digest/generate] Agent saved to DB: ${agentSaved}, id: ${agentDigestId}`);

    // Fallback: persist if agent didn't save
    let digestId = agentDigestId;
    if (!agentSaved && digestContent) {
      console.log("[digest/generate] Agent did not save — running fallback persistence");
      digestId = await persistDigest(digestContent);
    }

    return c.json({
      success: true,
      message: digestId
        ? `Digest generated and saved (id: ${digestId}).`
        : "Digest generated but could not persist to database.",
      digestId,
      savedByAgent: agentSaved,
      curatedAchievementsUsed: curatedPayload.length,
      digest: digestContent,
    });
  } catch (error) {
    console.error("[digest/generate] Error:", error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ---------------------------------------------------------------------------
// GET /digest/latest — Retrieve the most recent digest
// ---------------------------------------------------------------------------
app.get("/digest/latest", async (c) => {
  const latestDigest = await prisma.digest.findFirst({
    orderBy: { generatedAt: "desc" },
  });

  if (!latestDigest) {
    return c.json({ message: "No digests generated yet" }, 404);
  }

  return c.json({
    digest: {
      id: latestDigest.id,
      weekStart: latestDigest.weekStart,
      weekEnd: latestDigest.weekEnd,
      content: latestDigest.contentMd,
      stats: latestDigest.stats,
      generatedAt: latestDigest.generatedAt,
    },
  });
});

export default app;
