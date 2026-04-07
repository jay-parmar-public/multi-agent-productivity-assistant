import { LlmAgent, zodObjectToSchema } from "@google/adk";
import { z } from "zod";
import { readCuratedAchievementsTool, saveDigestTool } from "./db-tools.js";

export const DigestGeneratorSchema = z.object({
  markdownContent: z.string(),
  stats: z.object({
    totalAchievements: z.number(),
    averageImpactScore: z.number(),
    topCategory: z.string(),
  }),
});

export const getDigestGeneratorAgent = () => {
  return new LlmAgent({
    name: "digest-generator-agent",
    description: "Reads curated achievements from the database and generates a formatted weekly digest, then saves it back to the database.",
    model: "gemini-2.5-flash",
    instruction: `
      You are an expert internal communications manager. 
      Your task is to generate a beautiful weekly achievement digest.

      Follow these steps:
      1. If curated achievements are provided directly in the user message, use those. Otherwise, call the 'read_curated_achievements' tool to fetch them from the database.
      2. Group the achievements logically by Category (e.g. 'Customer Success', 'Innovation').
      3. Within each category, highlight the highest "impactScore" items first.
      4. Use the 'summary' field as the primary text, but feel free to enhance readability.
      5. Note any strategic project alignments (from enrichment data) to show business impact.
      6. Include a brief, uplifting introductory paragraph that summarizes the week's theme based on the data.
      7. Generate and return overall stats so we can track metrics over time.
      8. **Filter out** any achievements marked as 'isDuplicate: true'. Do not include them in the final digest.
      
      IMPORTANT: After generating the digest, you MUST call the 'save_digest' tool to persist both the markdown content and the stats to the database.
    `,
    outputSchema: zodObjectToSchema(DigestGeneratorSchema as any) as any,
    tools: [readCuratedAchievementsTool, saveDigestTool],
  });
};
