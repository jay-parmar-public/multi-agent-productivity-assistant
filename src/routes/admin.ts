import { Hono } from "hono";
import { prisma } from "../db/client.js";
import { seedAchievements } from "./seed-data.js";

export const adminRouter = new Hono();

// ---------------------------------------------------------------------------
// POST /admin/seed — Seed the database with mock achievements
// ---------------------------------------------------------------------------
adminRouter.post("/seed", async (c) => {
  try {
    // Clear existing data
    await prisma.curatedAchievement.deleteMany();
    await prisma.digest.deleteMany();
    await prisma.achievement.deleteMany();

    // Insert seed achievements
    for (const achievement of seedAchievements) {
      await prisma.achievement.create({ data: achievement });
    }

    return c.json({
      message: `Database seeded with ${seedAchievements.length} achievements`,
      count: seedAchievements.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ error: "Seed failed", details: message }, 500);
  }
});

// ---------------------------------------------------------------------------
// POST /admin/reset — Clear all data
// ---------------------------------------------------------------------------
adminRouter.post("/reset", async (c) => {
  await prisma.curatedAchievement.deleteMany();
  await prisma.digest.deleteMany();
  await prisma.achievement.deleteMany();

  return c.json({ message: "All data cleared" });
});
