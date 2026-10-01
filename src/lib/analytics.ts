// Client-side tracking: sends events to our own /api/track endpoint and, when configured, to Google Analytics 4.
// Visitor and session IDs are random and kept in the browser; nothing identifies a person.
export type TrackType = "pageview" | "whatsapp_click" | "add_to_cart" | "lead" | "order";

export const GA_ID = (import.meta.env.VITE_GA_ID as string | undefined) || "";

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

function stored(storage: () => Storage, key: string, make: () => string) {
  try {
    const s = storage();
    let v = s.getItem(key);
    if (!v) { v = make(); s.setItem(key, v); }
    return v;
  } catch {
    return make();
  }
}

const SEARCH: [RegExp, string][] = [
  [/(^|\.)google\./, "Google"], [/(^|\.)bing\.com$/, "Bing"], [/(^|\.)yandex\./, "Yandex"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"], [/instagram\.com$/, "Instagram"], [/(facebook\.com|fb\.me)$/, "Facebook"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "X / Twitter"], [/(wa\.me|whatsapp\.com)$/, "WhatsApp"],
  [/(t\.me|telegram\.org)$/, "Telegram"], [/tiktok\.com$/, "TikTok"], [/chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai/, "AI assistants"],
];

/** Where this session came from: utm_source, else the referring site, else "Direct". Fixed for the session. */
function sessionSource() {
  return stored(() => sessionStorage, "alc-src", () => {
    const utm = new URLSearchParams(location.search).get("utm_source");
    if (utm) return utm.slice(0, 60);
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (!host || host === location.hostname) return "Direct";
      return SEARCH.find(([re]) => re.test(host))?.[1] ?? host;
    } catch {
      return "Direct";
    }
  });
}

let lastView = { path: "", at: 0 };

export function track(type: TrackType, opts: { label?: string; value?: number; items?: { id: string; name?: string; price?: number; qty?: number }[] } = {}) {
  if (typeof window === "undefined" || location.pathname.startsWith("/admin")) return;
  if (type === "pageview") {
    // React may run the page-view effect twice for one navigation; count a page once per 2 s.
    if (lastView.path === location.pathname && Date.now() - lastView.at < 2000) return;
    lastView = { path: location.pathname, at: Date.now() };
  }
  const body = JSON.stringify({
    type,
    visitor: stored(() => localStorage, "alc-vid", () => crypto.randomUUID()),
    session: stored(() => sessionStorage, "alc-sid", () => crypto.randomUUID()),
    path: location.pathname,
    source: sessionSource(),
    lang: document.documentElement.lang,
    label: opts.label,
    value: opts.value,
  });
  try {
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    }
  } catch { /* never break the page for analytics */ }

  const gtag = window.gtag;
  if (!gtag || type === "pageview") return;
  const items = opts.items?.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty }));
  if (type === "add_to_cart") gtag("event", "add_to_cart", { currency: "AED", value: opts.value, items });
  else if (type === "order") gtag("event", "purchase", { transaction_id: opts.label, currency: "AED", value: opts.value, items });
  else if (type === "lead") gtag("event", "generate_lead", { method: opts.label });
  else gtag("event", "whatsapp_click", { link_location: opts.label });
}
