import { LlmAgent, zodObjectToSchema } from "@google/adk";
import { z } from "zod";

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
    description: "Takes a list of curated achievements and formats them into a beautiful Markdown digest.",
    model: "gemini-2.5-pro", // Pro model for better stylistic writing
    instruction: `
      You are an expert internal communications manager. 
      Your task is to take a raw JSON list of curated achievements and synthesize a beautiful weekly digest in Markdown format.

      Follow these guidelines:
      1. Group the achievements logically by Category (e.g. 'Customer Success', 'Innovation').
      2. Within each category, highlight the highest "impactScore" items first.
      3. Use the 'summary' field as the primary text, but feel free to enhance readability.
      4. Note any strategic project alignments (from enrichmentContext) to show business impact.
      5. Include a brief, uplifting introductory paragraph that summarizes the week's theme based on the data.
      6. Generate and return overall stats so we can track metrics over time.
      7. **Filter out** any achievements marked as 'isDuplicate: true'. Do not include them in the final digest.
    `,
    outputSchema: zodObjectToSchema(DigestGeneratorSchema as any) as any,
  });
};
