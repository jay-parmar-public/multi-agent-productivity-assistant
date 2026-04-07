// @ts-nocheck
import { LlmAgent, MCPToolset, InMemoryRunner, zodObjectToSchema, FunctionTool } from "@google/adk";
import { getCurationAgent } from "./curation.js";
import { getDigestGeneratorAgent } from "./digestGenerator.js";
import path from "path";
import { z } from "zod";

// Help resolve paths whether running via tsx or compiled js
const isLocal = process.env.NODE_ENV !== "production";
const runnerBin = isLocal ? "npx" : "node";

const kbServerPath = path.resolve(process.cwd(), isLocal ? "src/mcp/kb-server.ts" : "dist/mcp/kb-server.js");
const sheetsServerPath = path.resolve(process.cwd(), isLocal ? "src/mcp/sheets-server.ts" : "dist/mcp/sheets-server.js");

export const ManagerOutputSchema = z.object({
  status: z.string(),
  stats: z.any().optional(),
  digestId: z.string().optional(),
  error: z.string().optional(),
});

export const getManagerAgent = async () => {
  // 1. Initialize MCP Toolsets
  const kbToolset = new MCPToolset({
    type: 'StdioConnectionParams',
    serverParams: {
      command: runnerBin,
      args: isLocal ? ["tsx", kbServerPath] : [kbServerPath],
    }
  });

  const sheetsToolset = new MCPToolset({
    type: 'StdioConnectionParams',
    serverParams: {
      command: runnerBin,
      args: isLocal ? ["tsx", sheetsServerPath] : [sheetsServerPath],
    }
  });

  // Get tools from the endpoints
  const kbTools = await kbToolset.getTools();
  const sheetsTools = await sheetsToolset.getTools();

  // 2. Initialize Sub-Agents
  const curationAgent = getCurationAgent(kbTools);
  const digestAgent = getDigestGeneratorAgent();

  // Create sub-agent invokers
  const curateFunction = new FunctionTool({
    name: "curate_achievement",
    description: "Sends a single raw achievement to the curation sub-agent.",
    parameters: {
      type: "object",
      properties: {
        rawText: { type: "string" },
        team: { type: "string" },
      },
      required: ["rawText", "team"],
    },
    execute: async (args: any) => {
      const runner = new InMemoryRunner();
      const response = await runner.runEphemeral({ 
        agent: curationAgent,
        input: `Curate this achievement. Team: ${args.team}. Text: ${args.rawText}`
      });
      return JSON.stringify(response);
    },
  });

  const digestFunction = new FunctionTool({
    name: "generate_digest",
    description: "Sends the aggregated collection of curated achievements to be formatted into a markdown digest.",
    parameters: {
      type: "object",
      properties: {
        curatedAchievements: { 
          type: "array", 
          items: { type: "object", additionalProperties: true }
        },
      },
      required: ["curatedAchievements"],
    },
    execute: async (args: any) => {
      const runner = new InMemoryRunner();
      const response = await runner.runEphemeral({ 
        agent: digestAgent,
        input: `Generate the digest from these achievements: ${JSON.stringify(args.curatedAchievements)}`
      });
      return JSON.stringify(response);
    },
  });

  // 3. Initialize Manager Agent
  const managerAgent = new LlmAgent({
    name: "manager-agent",
    description: "Orchestrates the weekly achievement digest pipeline: Ingest -> Curate -> Publish.",
    model: "gemini-2.5-pro",
    tools: [...sheetsTools, curateFunction, digestFunction],
    instruction: `
      You are the Orchestrator for the Weekly Achievement Digest pipeline.
      
      When initiated, your task is to:
      1. Use your read_sheet tool to read the raw achievements from the mock Google Form. (Use sheet ID 'demo_sheet_id').
      2. For each raw achievement found, pass it to the 'curate_achievement' tool to categorize, score, and enrich it.
      3. Collect all the curated responses.
      4. Pass the entire curated collection to the 'generate_digest' tool.
      5. Return the final output object indicating success and providing the generated stats.
      
      You must strictly manage the sub-agents and ensure data flows correctly between them.
    `,
    outputSchema: zodObjectToSchema(ManagerOutputSchema as any) as any,
  });

  return { managerAgent, kbToolset, sheetsToolset };
};
