import { Hono } from "hono";

export const curateRouter = new Hono();

// ---------------------------------------------------------------------------
// POST /curate — Trigger AI curation pipeline
// Will be wired to Manager Agent → Curation Sub-Agent in Phase 4
// ---------------------------------------------------------------------------
curateRouter.post("/", async (c) => {
  // TODO: Phase 4 — Wire to Manager Agent
  return c.json({
    message: "Curation endpoint ready — agent integration pending (Phase 4)",
    status: "placeholder",
  });
});
