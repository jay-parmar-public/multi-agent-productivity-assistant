import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db/client.js";

export const achievementsRouter = new Hono();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const submitSchema = z.object({
  text: z.string().min(10, "Achievement text must be at least 10 characters"),
  team: z.string().min(1, "Team name is required"),
  source: z.string().default("api"),
});

const submitBatchSchema = z.object({
  achievements: z.array(submitSchema).min(1).max(50),
});

// ---------------------------------------------------------------------------
// POST /achievements/submit — Submit a single achievement
// ---------------------------------------------------------------------------
achievementsRouter.post("/submit", async (c) => {
  const body = await c.req.json();
  const parsed = submitSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const achievement = await prisma.achievement.create({
    data: {
      text: parsed.data.text,
      team: parsed.data.team,
      source: parsed.data.source,
    },
  });

  return c.json({ message: "Achievement submitted", achievement }, 201);
});

// ---------------------------------------------------------------------------
// POST /achievements/submit-batch — Submit multiple achievements
// ---------------------------------------------------------------------------
achievementsRouter.post("/submit-batch", async (c) => {
  const body = await c.req.json();
  const parsed = submitBatchSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const achievements = await prisma.achievement.createMany({
    data: parsed.data.achievements.map((a) => ({
      text: a.text,
      team: a.team,
      source: a.source,
    })),
  });

  return c.json(
    { message: `${achievements.count} achievements submitted`, count: achievements.count },
    201
  );
});

// ---------------------------------------------------------------------------
// GET /achievements — List all achievements with curation status
// ---------------------------------------------------------------------------
achievementsRouter.get("/", async (c) => {
  const achievements = await prisma.achievement.findMany({
    include: {
      curated: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return c.json({
    count: achievements.length,
    achievements: achievements.map((a) => ({
      id: a.id,
      text: a.text,
      team: a.team,
      source: a.source,
      submittedAt: a.submittedAt,
      curationStatus: a.curated ? "curated" : "pending",
      curation: a.curated
        ? {
            category: a.curated.category,
            impactScore: a.curated.impactScore,
            summary: a.curated.summary,
            isDuplicate: a.curated.isDuplicate,
            enrichment: a.curated.enrichment,
          }
        : null,
    })),
  });
});
