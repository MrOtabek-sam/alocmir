// Sends store notifications (new orders, new leads) to Telegram chats.
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (comma-separated for several people/groups).
import { SITE_URL } from "./i18n";

const API = "https://api.telegram.org";

function esc(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

function waLink(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

/** Never throws: a failed notification must not fail the order. */
export async function notifyTelegram(html: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = (process.env.TELEGRAM_CHAT_ID ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return;
  await Promise.all(chats.map(async (chat_id) => {
    try {
      const r = await fetch(`${API}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) console.error("Telegram notify failed", r.status, await r.text());
    } catch (err) {
      console.error("Telegram notify failed", err);
    }
  }));
}

export type OrderNotice = {
  code: string; name: string; phone: string; area: string; address: string; notes: string;
  payment: "cash" | "card"; lang: string;
  lines: { name: string; qty: number; line: number }[];
  subtotal: number; discount: number; promo: string | null; fee: number; total: number;
};

export function orderMessage(o: OrderNotice) {
  const wa = waLink(o.phone);
  const items = o.lines.map((l) => `• ${l.qty} × ${esc(l.name)} — AED ${l.line}`).join("\n");
  return [
    `🛒 <b>New order ${esc(o.code)}</b>`,
    "",
    `👤 ${esc(o.name)}`,
    `📞 <a href="tel:${esc(o.phone.replace(/[^0-9+]/g, ""))}">${esc(o.phone)}</a>${wa ? ` · <a href="${wa}">WhatsApp</a>` : ""}`,
    `📍 ${esc(o.area)}, ${esc(o.address)}`,
    o.notes ? `📝 ${esc(o.notes)}` : "",
    "",
    items,
    "",
    `Subtotal: AED ${o.subtotal}`,
    o.discount ? `Discount${o.promo ? ` (${esc(o.promo)})` : ""}: −AED ${o.discount}` : "",
    `Delivery: ${o.fee ? `AED ${o.fee}` : "free"}`,
    `<b>Total: AED ${o.total}</b> · ${o.payment === "cash" ? "💵 Cash" : "💳 Card"} on delivery`,
    `Language: ${o.lang.toUpperCase()}`,
    "",
    `<a href="${SITE_URL}/admin">Open admin</a>`,
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
}

export function leadMessage(phone: string, source: string, lang: string) {
  const wa = waLink(phone);
  return [
    `📲 <b>New lead</b> (${esc(source)}, ${lang.toUpperCase()})`,
    `${esc(phone)}${wa ? ` · <a href="${wa}">WhatsApp</a>` : ""}`,
    "Got the WELCOME10 code.",
  ].join("\n");
}
