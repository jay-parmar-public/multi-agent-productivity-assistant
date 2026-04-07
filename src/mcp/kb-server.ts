import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { companyPriorities, strategicProjects } from "./kb-data.js";

// Initialize the MCP server
const server = new McpServer({
  name: "company-knowledge-base",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool: get_company_priorities
// ---------------------------------------------------------------------------
server.tool(
  "get_company_priorities",
  "Retrieve strategic company priorities for a specific quarter",
  { quarter: z.enum(["Q1", "Q2"]).describe("The quarter to fetch priorities for (e.g. Q1)") },
  async ({ quarter }) => {
    const priorities = companyPriorities[quarter as keyof typeof companyPriorities];
    return {
      content: [
        {
          type: "text",
          text: `Strategic Priorities for ${quarter}:\n${priorities.map((p) => `- ${p}`).join("\n")}`,
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: search_projects
// ---------------------------------------------------------------------------
server.tool(
  "search_projects",
  "Search the company knowledge base for context on a specific project",
  { query: z.string().describe("The name or keyword of the project to search for") },
  async ({ query }) => {
    const q = query.toLowerCase();
    const matching = strategicProjects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.strategic_alignment.toLowerCase().includes(q)
    );

    if (matching.length === 0) {
      return {
        content: [{ type: "text", text: `No strategic projects found matching: ${query}` }],
      };
    }

    const formatted = matching
      .map(
        (p) =>
          `Project: ${p.name}\nPriority: ${p.priority}\nBudget: ${p.budget_tier}\nAlignment: ${p.strategic_alignment}\nDesc: ${p.description}`
      )
      .join("\n\n---\n\n");

    return {
      content: [{ type: "text", text: formatted }],
    };
  }
);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Knowledge Base MCP Server running on stdio");
}

main().catch(console.error);
