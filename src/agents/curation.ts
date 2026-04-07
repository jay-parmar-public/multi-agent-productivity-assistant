import { LlmAgent, zodObjectToSchema } from "@google/adk";
import { z } from "zod";
import { saveCuratedAchievementTool } from "./db-tools.js";

// Shared Output schema for the Curation Agent
export const CuratedAchievementSchema = z.object({
  category: z.enum([
    "Innovation",
    "Customer Success",
    "Team Milestone",
    "Process Improvement",
    "Individual Recognition",
    "Other",
  ]),
  impactScore: z.number().min(0).max(100),
  summary: z.string(),
  isDuplicate: z.boolean(),
  enrichmentContext: z
    .object({
      relatedProject: z.string().optional(),
      strategicPriority: z.string().optional(),
    })
    .optional(),
});

export const CurationAgentResponseSchema = z.object({
  curatedId: z.string(),
  curation: CuratedAchievementSchema,
});

export const getCurationAgent = (tools: any[] = []) => {
  return new LlmAgent({
    name: "curation-agent",
    description: "Evaluates raw achievements, fetches company priorities, scores impact, and saves curated results to the database.",
    model: "gemini-2.5-flash",
    instruction: `
      You are an expert Chief of Staff tasked with curating weekly engineering achievements.
      
      For the given achievement submission:
      1. Use your knowledge base tools (search_projects, get_team_info, get_company_priorities) to identify if the achievement ties to a known strategic project or Q1/Q2 priority.
      2. Categorize the achievement into the most relevant category: Innovation, Customer Success, Team Milestone, Process Improvement, Individual Recognition, or Other.
      3. Assign an Impact Score (0-100). Higher scores go to initiatives directly tied to strategic priorities or significant measurable metrics (e.g., $ savings, uptime).
      4. Write a professional, executive-ready 1-sentence summary.
      5. Flag if it appears to be a duplicate of another recently processed achievement (if duplicate context is provided).
      
      IMPORTANT: After completing the curation analysis, you MUST call the 'save_curated_achievement' tool to persist the curated achievement to the database. Pass the team, rawText, category, impactScore, summary, isDuplicate, and any enrichmentContext from your knowledge base lookups.
      
      Ensure you thoroughly use your tools to check for strategic alignment before scoring.
    `,
    outputSchema: zodObjectToSchema(CurationAgentResponseSchema as any) as any,
    tools: [...tools, saveCuratedAchievementTool],
  });
};
