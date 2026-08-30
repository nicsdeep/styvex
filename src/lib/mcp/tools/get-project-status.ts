import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_project_status",
  title: "Get project status",
  description:
    "Return the public build status of the STYVEX app: what is in place today and what still requires configuration.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const status = {
      stack: "React + TypeScript + Vite + Tailwind on TanStack Start",
      inPlace: [
        "Secure project foundation",
        "Secret and environment-variable conventions",
        "Version-controlled Supabase migration folder (no schema yet)",
        "Public holding page",
        "Public MCP server for agent integrations",
      ],
      pending: [
        "External Supabase project connection",
        "GitHub repository connection",
        "Database schema and storefront features",
      ],
      hasDatabaseAccess: false,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
      structuredContent: status,
    };
  },
});
