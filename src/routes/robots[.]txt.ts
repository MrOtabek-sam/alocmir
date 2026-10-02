import { createFileRoute } from "@tanstack/react-router";

import { SITE_URL } from "@/lib/store/i18n";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /app",
          "Disallow: /api/",
          "Disallow: /en/cart",
          "Disallow: /ru/cart",
          "",
          `Sitemap: ${SITE_URL}/sitemap.xml`,
        ].join("\n");
        return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
      },
    },
  },
});
