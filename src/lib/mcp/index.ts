import { defineMcp } from "@lovable.dev/mcp-js";
import brandOverviewTool from "./tools/get-brand-overview";
import projectStatusTool from "./tools/get-project-status";

export default defineMcp({
  name: "styvex-foundation",
  title: "Styvex Foundation",
  version: "0.1.0",
  instructions:
    "Public, read-only tools describing the STYVEX women's fashion and lifestyle app. Use `get_brand_overview` for brand positioning and `get_project_status` for the current build stage. No customer or database data is exposed.",
  tools: [brandOverviewTool, projectStatusTool],
});
