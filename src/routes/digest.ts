import { Hono } from "hono";
import { prisma } from "../db/client.js";

export const digestRouter = new Hono();

// ---------------------------------------------------------------------------
// POST /digest/generate — Generate the weekly digest
// Will be wired to Manager Agent → Digest Generator Sub-Agent in Phase 4
// ---------------------------------------------------------------------------
digestRouter.post("/generate", async (c) => {
  // TODO: Phase 4 — Wire to Manager Agent
  return c.json({
    message: "Digest generation endpoint ready — agent integration pending (Phase 4)",
    status: "placeholder",
  });
});

// ---------------------------------------------------------------------------
// GET /digest/latest — Retrieve the most recent digest
// ---------------------------------------------------------------------------
digestRouter.get("/latest", async (c) => {
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
