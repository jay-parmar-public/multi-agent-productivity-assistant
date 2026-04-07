import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mockSheetRows } from "./sheets-data.js";

// Initialize the MCP server
const server = new McpServer({
  name: "google-sheets-mcp",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool: read_sheet
// ---------------------------------------------------------------------------
server.tool(
  "read_sheet",
  "Fetch rows from a specified Google Sheet containing achievements. Use this to ingest raw, unprocessed achievements.",
  { spreadsheet_id: z.string().describe("The ID of the Google Sheet to read (use 'demo_sheet_id' for mock)") },
  async ({ spreadsheet_id }) => {
    // In a real app, this would use the Google Sheets API.
    // For the hackathon prototype, we return the mock data if the ID matches.
    if (spreadsheet_id !== "demo_sheet_id") {
      return {
        content: [{ type: "text", text: "Error: Could not find the specified spreadsheet." }],
        isError: true
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(mockSheetRows, null, 2),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Google Sheets MCP Server running on stdio");
}

main().catch(console.error);
