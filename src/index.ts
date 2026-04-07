import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prisma } from "./db/client.js";
import { achievementsRouter } from "./routes/achievements.js";
import { adminRouter } from "./routes/admin.js";
import agentRouter from "./routes/agents.js";

const app = new Hono();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use("*", logger());
app.use("*", cors());

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", async (c) => {
  let dbStatus = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch {
    dbStatus = "error";
  }

  return c.json({
    status: "ok",
    service: "achievement-digest",
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.route("/achievements", achievementsRouter);
app.route("/admin", adminRouter);
// Agents handle /curate and /digest/generate
app.route("/", agentRouter);

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------
app.notFound((c) => {
  return c.json({ error: "Not Found", path: c.req.path }, 404);
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const port = parseInt(process.env.PORT || "8080", 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`
╔══════════════════════════════════════════════╗
║   🚀 Achievement Digest API                 ║
║   Running on http://localhost:${info.port}          ║
╚══════════════════════════════════════════════╝
  `);
});
