import { PrismaClient } from "@prisma/client";
import { seedAchievements } from "../src/routes/seed-data.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data
  await prisma.curatedAchievement.deleteMany();
  await prisma.digest.deleteMany();
  await prisma.achievement.deleteMany();
  console.log("  ✅ Cleared existing data");

  // Insert achievements
  for (const achievement of seedAchievements) {
    await prisma.achievement.create({ data: achievement });
  }

  console.log(`  ✅ Inserted ${seedAchievements.length} achievements`);
  console.log("\n🌱 Seeding complete!\n");

  // Print summary
  const teams = [...new Set(seedAchievements.map((a) => a.team))];
  console.log(`  Teams: ${teams.join(", ")}`);
  console.log(`  Total achievements: ${seedAchievements.length}`);
  console.log(`  Note: Achievement #13 is a near-duplicate of #1 (for dedup testing)\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
