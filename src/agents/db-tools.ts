// @ts-nocheck
import { FunctionTool } from "@google/adk";
import { prisma } from "../db/client.js";

// ---------------------------------------------------------------------------
// Tool: save_curated_achievement
// Used by the Curation Sub-Agent to persist curated results to AlloyDB
// ---------------------------------------------------------------------------
export const saveCuratedAchievementTool = new FunctionTool({
  name: "save_curated_achievement",
  description:
    "Persist a curated achievement to the database. Links the curated record to an existing raw achievement by team name. Returns the saved record ID or an error.",
  parameters: {
    type: "object",
    properties: {
      team: {
        type: "string",
        description: "The team that submitted the achievement",
      },
      rawText: {
        type: "string",
        description: "The original raw achievement text (used for matching)",
      },
      category: {
        type: "string",
        enum: [
          "Innovation",
          "Customer Success",
          "Team Milestone",
          "Process Improvement",
          "Individual Recognition",
          "Other",
        ],
        description: "The category assigned to this achievement",
      },
      impactScore: {
        type: "number",
        description: "Impact score from 0 to 100",
      },
      summary: {
        type: "string",
        description: "AI-generated concise executive-ready summary",
      },
      isDuplicate: {
        type: "boolean",
        description: "Whether this achievement is a duplicate",
      },
      enrichmentContext: {
        type: "object",
        description:
          "Optional enrichment context from the knowledge base (project info, strategic alignment, etc.)",
        properties: {
          relatedProject: { type: "string" },
          strategicPriority: { type: "string" },
          projectPriority: { type: "string" },
          budgetTier: { type: "string" },
          department: { type: "string" },
        },
        additionalProperties: true,
      },
    },
    required: ["team", "rawText", "category", "impactScore", "summary", "isDuplicate"],
  },
  execute: async (args: any) => {
    try {
      // Try to find a matching uncurated achievement by team name
      // Use text similarity as secondary match
      let matchingAchievement = await prisma.achievement.findFirst({
        where: {
          team: args.team,
          text: { contains: args.rawText.substring(0, 50) },
          curated: null,
        },
        orderBy: { submittedAt: "asc" },
      });

      // Fallback: match by team only
      if (!matchingAchievement) {
        matchingAchievement = await prisma.achievement.findFirst({
          where: {
            team: args.team,
            curated: null,
          },
          orderBy: { submittedAt: "asc" },
        });
      }

      // If no matching achievement exists, create one from the raw data
      if (!matchingAchievement) {
        matchingAchievement = await prisma.achievement.create({
          data: {
            text: args.rawText,
            team: args.team,
            source: "google_sheets",
          },
        });
      }

      const curated = await prisma.curatedAchievement.create({
        data: {
          achievementId: matchingAchievement.id,
          category: args.category,
          impactScore: Math.min(100, Math.max(0, Math.round(args.impactScore))),
          summary: args.summary,
          isDuplicate: args.isDuplicate ?? false,
          enrichment: args.enrichmentContext || null,
        },
      });

      return JSON.stringify({
        success: true,
        curatedId: curated.id,
        achievementId: matchingAchievement.id,
        message: `Curated achievement saved for team ${args.team}`,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || String(error),
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Tool: read_curated_achievements
// Used by the Digest Generator Sub-Agent to read from the DB
// ---------------------------------------------------------------------------
export const readCuratedAchievementsTool = new FunctionTool({
  name: "read_curated_achievements",
  description:
    "Read all curated achievements from the database. Returns an array of curated achievement records with their original text, team, category, impact score, summary, and enrichment data. Used to generate the weekly digest.",
  parameters: {
    type: "object",
    properties: {
      includeDuplicates: {
        type: "boolean",
        description:
          "Whether to include achievements flagged as duplicates. Defaults to false.",
      },
    },
  },
  execute: async (args: any) => {
    try {
      const where: any = {};
      if (!args?.includeDuplicates) {
        where.isDuplicate = false;
      }

      const curated = await prisma.curatedAchievement.findMany({
        where,
        include: {
          achievement: true,
        },
        orderBy: { impactScore: "desc" },
      });

      const results = curated.map((c: any) => ({
        curatedId: c.id,
        achievementId: c.achievementId,
        team: c.achievement.team,
        originalText: c.achievement.text,
        category: c.category,
        impactScore: c.impactScore,
        summary: c.summary,
        isDuplicate: c.isDuplicate,
        enrichment: c.enrichment,
        curatedAt: c.curatedAt,
      }));

      return JSON.stringify({
        success: true,
        count: results.length,
        achievements: results,
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || String(error),
      });
    }
  },
});

// ---------------------------------------------------------------------------
// Tool: save_digest
// Used by the Digest Generator Sub-Agent to persist the digest to AlloyDB
// ---------------------------------------------------------------------------
export const saveDigestTool = new FunctionTool({
  name: "save_digest",
  description:
    "Save a generated weekly digest to the database. Provide the markdown content and optional stats. Returns the saved digest ID.",
  parameters: {
    type: "object",
    properties: {
      markdownContent: {
        type: "string",
        description: "The full generated digest in Markdown format",
      },
      stats: {
        type: "object",
        description: "Summary statistics for the digest",
        properties: {
          totalAchievements: { type: "number" },
          averageImpactScore: { type: "number" },
          topCategory: { type: "string" },
          categoriesBreakdown: {
            type: "object",
            additionalProperties: { type: "number" },
          },
        },
      },
    },
    required: ["markdownContent"],
  },
  execute: async (args: any) => {
    try {
      const now = new Date();

      // Calculate week boundaries: last Monday → this Sunday
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
          contentMd: args.markdownContent,
          stats: args.stats || null,
        },
      });

      return JSON.stringify({
        success: true,
        digestId: digest.id,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        message: "Digest saved to database successfully",
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || String(error),
      });
    }
  },
});
