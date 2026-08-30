import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_brand_overview",
  title: "Get brand overview",
  description:
    "Return the public overview of the STYVEX brand: positioning, market, and current build stage.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const overview = {
      name: "STYVEX",
      market: "United States",
      category: "Women's fashion and lifestyle ecommerce",
      stage: "Foundation — pre-launch holding page only",
      publicSurface: ["Coming soon landing page"],
      notYetBuilt: [
        "Storefront and product pages",
        "Catalog data",
        "Customer accounts",
        "Payments and checkout",
      ],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(overview, null, 2) }],
      structuredContent: overview,
    };
  },
});
