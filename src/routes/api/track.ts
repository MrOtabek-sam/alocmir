import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { db } from "@/lib/store/db.server";

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|axios/i;
const schema = z.object({
  type: z.enum(["pageview", "whatsapp_click", "add_to_cart", "lead", "order"]),
  visitor: z.string().min(8).max(64),
  session: z.string().min(8).max(64),
  path: z.string().max(300),
  source: z.string().max(80),
  lang: z.string().max(8).optional(),
  label: z.string().max(120).optional(),
  value: z.number().min(0).max(1_000_000).optional(),
});

function device(ua: string) {
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Mobile";
  return "Desktop";
}

export const Route = createFileRoute("/api/track")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ua = request.headers.get("user-agent") ?? "";
        const origin = request.headers.get("origin");
        // Only accept events sent by our own pages, and ignore bots.
        if (BOT.test(ua) || (origin && new URL(origin).host !== new URL(request.url).host)) return new Response(null, { status: 204 });
        let data: z.infer<typeof schema>;
        try {
          data = schema.parse(await request.json());
        } catch {
          return new Response(null, { status: 400 });
        }
        if (data.path.startsWith("/admin")) return new Response(null, { status: 204 });
        try {
          await db().prepare(`INSERT INTO events (type, visitor, session, path, source, lang, device, country, label, value)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(data.type, data.visitor, data.session, data.path, data.source, data.lang ?? null, device(ua),
              request.headers.get("x-vercel-ip-country"), data.label ?? null, data.value ?? null).run();
        } catch {
          /* analytics table missing (migration not run): never fail the visitor's page */
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
