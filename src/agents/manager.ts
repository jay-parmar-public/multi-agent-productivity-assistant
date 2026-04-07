// @ts-nocheck
import { LlmAgent, MCPToolset, InMemoryRunner, zodObjectToSchema, FunctionTool } from "@google/adk";
import { getCurationAgent } from "./curation.js";
import { getDigestGeneratorAgent } from "./digestGenerator.js";
import path from "path";
import { z } from "zod";

// Help resolve paths whether running via tsx or compiled js
const isLocal = process.env.NODE_ENV !== "production";
const runnerBin = isLocal ? "npx" : "node";

const kbServerPath = path.resolve(process.cwd(), isLocal ? "src/mcp/kb-server.ts" : "dist/mcp/kb-server.js");
const sheetsServerPath = path.resolve(process.cwd(), isLocal ? "src/mcp/sheets-server.ts" : "dist/mcp/sheets-server.js");

export const ManagerOutputSchema = z.object({
  status: z.string(),
  stats: z.any().optional(),
  digestId: z.string().optional(),
  persisted: z.number().optional(),
  error: z.string().optional(),
});

export const getManagerAgent = async () => {
  // 1. Initialize MCP Toolsets
  const kbToolset = new MCPToolset({
    type: 'StdioConnectionParams',
    serverParams: {
      command: runnerBin,
      args: isLocal ? ["tsx", kbServerPath] : [kbServerPath],
    }
  });

  const sheetsToolset = new MCPToolset({
    type: 'StdioConnectionParams',
    serverParams: {
      command: runnerBin,
      args: isLocal ? ["tsx", sheetsServerPath] : [sheetsServerPath],
    }
  });

  // Get tools from the MCP endpoints
  const kbTools = await kbToolset.getTools();
  const sheetsTools = await sheetsToolset.getTools();

  // 2. Initialize Sub-Agents (now with DB tools built in)
  const curationAgent = getCurationAgent(kbTools);
  const digestAgent = getDigestGeneratorAgent();

  // Create sub-agent invoker: curate_achievement
  const curateFunction = new FunctionTool({
    name: "curate_achievement",
    description: "Sends a single raw achievement to the curation sub-agent for classification, scoring, enrichment, and database persistence.",
    parameters: {
      type: "object",
      properties: {
        rawText: { type: "string", description: "The raw achievement text" },
        team: { type: "string", description: "The team that submitted the achievement" },
      },
      required: ["rawText", "team"],
    },
    execute: async (args: any) => {
      const runner = new InMemoryRunner({ agent: curationAgent });
      const generator = runner.runEphemeral({ 
        userId: "manager",
        newMessage: { role: "user", parts: [{ text: `Curate this achievement and save it to the database. Team: ${args.team}. Text: ${args.rawText}` }] }
      });
      let finalResult = null;
      for await (const event of generator) {
        if (event.author === "curation-agent" && event.content?.role === "model") {
          const textPart = event.content.parts?.find((p: any) => p.text);
          if (textPart) {
            try {
              finalResult = JSON.parse(textPart.text);
            } catch (e) {
              finalResult = textPart.text;
            }
          }
        }
      }
      return JSON.stringify(finalResult);
    },
  });

  // Create sub-agent invoker: generate_digest
  const digestFunction = new FunctionTool({
    name: "generate_digest",
    description: "Triggers the digest generator sub-agent which reads curated achievements from the database, generates a markdown digest, and saves the digest back to the database.",
    parameters: {
      type: "object",
      properties: {
        curatedAchievements: { 
          type: "array", 
          items: { type: "object", additionalProperties: true },
          description: "Optional: pass curated achievements directly. If omitted, the digest agent reads from the database."
        },
      },
    },
    execute: async (args: any) => {
      const runner = new InMemoryRunner({ agent: digestAgent });
      const prompt = args?.curatedAchievements?.length
        ? `Generate the weekly digest from these curated achievements and save it to the database: ${JSON.stringify(args.curatedAchievements)}`
        : `Read curated achievements from the database, generate the weekly digest, and save it to the database.`;

      const generator = runner.runEphemeral({ 
        userId: "manager",
        newMessage: { role: "user", parts: [{ text: prompt }] }
      });
      let finalResult = null;
      for await (const event of generator) {
        if (event.author === "digest-generator-agent" && event.content?.role === "model") {
          const textPart = event.content.parts?.find((p: any) => p.text);
          if (textPart) {
            try {
              finalResult = JSON.parse(textPart.text);
            } catch (e) {
              finalResult = textPart.text;
            }
          }
        }
      }
      return JSON.stringify(finalResult);
    },
  });

  // 3. Initialize Manager Agent
  const managerAgent = new LlmAgent({
    name: "manager-agent",
    description: "Orchestrates the weekly achievement digest pipeline: Ingest -> Curate -> Publish.",
    model: "gemini-2.5-flash",
    tools: [...sheetsTools, curateFunction, digestFunction],
    instruction: `
      You are the Orchestrator for the Weekly Achievement Digest pipeline.
      
      When initiated, your task is to:
      1. Use your 'read_submissions' tool to read the raw achievement submissions from the Google Sheet. Filter by status "pending" to only get unprocessed rows.
      2. For each raw achievement found, pass it to the 'curate_achievement' tool with the team name and raw text. The curation agent will classify, score, enrich, AND save each achievement to the database automatically.
      3. After all achievements are curated, use the 'mark_processed' tool with the row_ids of all processed submissions to prevent re-ingestion.
      4. Optionally use 'get_sheet_stats' to report the current sheet status.
      5. If a digest is requested, call the 'generate_digest' tool. The digest agent will read curated achievements from the database, generate the markdown, and save the digest to the database automatically.
      6. Return the final output object indicating success and providing the generated stats.
      
      You must strictly manage the sub-agents and ensure data flows correctly between them.
      All data is persisted to the database by the sub-agents — you do not need to handle persistence yourself.
    `,
    outputSchema: zodObjectToSchema(ManagerOutputSchema as any) as any,
  });

  return { managerAgent, kbToolset, sheetsToolset };
};
