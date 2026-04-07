import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { mockSheetRows } from "./sheets-data.js";

// In-memory status tracking (mock)
const rowStatus: Record<string, "pending" | "processed"> = {};
// Initialize all rows as pending
for (const row of mockSheetRows) {
  rowStatus[row.row_id] = "pending";
}

// Initialize the MCP server
const server = new McpServer({
  name: "google-sheets-mcp",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool: read_submissions
// Fetch rows from the mock Google Sheet, optionally filtered by status
// ---------------------------------------------------------------------------
server.tool(
  "read_submissions",
  "Fetch achievement submission rows from the Google Sheet. Optionally filter by processing status.",
  {
    status: z
      .enum(["pending", "processed", "all"])
      .optional()
      .describe("Filter rows by status. Defaults to all rows if omitted."),
  },
  async ({ status }) => {
    let filtered = mockSheetRows;
    if (status && status !== "all") {
      filtered = mockSheetRows.filter(
        (row) => rowStatus[row.row_id] === status,
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(filtered, null, 2),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: mark_processed
// Mark specific rows as processed so they are not re-ingested
// ---------------------------------------------------------------------------
server.tool(
  "mark_processed",
  "Mark the given row IDs as processed so they are excluded from future pending reads.",
  {
    row_ids: z
      .array(z.string())
      .describe("Array of row_id values to mark as processed"),
  },
  async ({ row_ids }) => {
    const updated: string[] = [];
    const notFound: string[] = [];

    for (const id of row_ids) {
      if (rowStatus[id] !== undefined) {
        rowStatus[id] = "processed";
        updated.push(id);
      } else {
        notFound.push(id);
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            updated,
            ...(notFound.length > 0 ? { not_found: notFound } : {}),
          }),
        },
      ],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: get_sheet_stats
// Return summary statistics about the sheet
// ---------------------------------------------------------------------------
server.tool(
  "get_sheet_stats",
  "Get summary statistics for the achievement submissions sheet: total rows, pending count, and processed count.",
  {},
  async () => {
    const total = mockSheetRows.length;
    const pending = Object.values(rowStatus).filter(
      (s) => s === "pending",
    ).length;
    const processed = Object.values(rowStatus).filter(
      (s) => s === "processed",
    ).length;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ total, pending, processed }),
        },
      ],
    };
  },
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
