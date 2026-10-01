import { getRouteApi, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { SLink } from "@/components/store/slink";
import { useCart } from "./cart";
import { LANGS, LANG_LABEL, T, homePath, prefix, switchLangPath, type Lang } from "@/lib/store/i18n";
import type { Settings } from "@/lib/store/db.server";
import { saveLead } from "@/lib/store/store.functions";
import { track } from "@/lib/analytics";

function Wordmark({ lang, size = "md" }: { lang: Lang; size?: "md" | "lg" }) {
  return (
    <SLink to={homePath(lang)} className="flex items-center gap-3" aria-label="Alocmir home">
      <img src="/assets/brand/mark.png" alt="" role="presentation" width={36} height={36} className="size-9 rounded-full border border-gold/40" />
      <span className={`alc-display alc-gold-text ${size === "lg" ? "text-fs30" : "text-fs24"} font-semibold tracking-[0.06em]`}>ALOCMIR</span>
    </SLink>
  );
}

/** "Open now" or "Opens at" based on Dubai time and the hours setting ("11:00 - 02:00"). */
export function OpenBadge({ lang, hours }: { lang: Lang; hours: string }) {
  const [state, setState] = useState<null | { open: boolean; opens: string }>(null);
  useEffect(() => {
    const m = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!m) return;
    const now = new Date(Date.now() + 4 * 3600 * 1000); // Dubai is UTC+4
    const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
    const a = Number(m[1]) * 60 + Number(m[2]);
    const b = Number(m[3]) * 60 + Number(m[4]);
    const open = a <= b ? mins >= a && mins < b : mins >= a || mins < b;
    setState({ open, opens: `${m[1]}:${m[2]}` });
  }, [hours]);
  if (!state) return null;
  const t = T[lang];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-raised/80 px-3 py-1 text-fs13 font-semibold text-ink backdrop-blur">
      <span aria-hidden="true" className={`size-2 rounded-full ${state.open ? "bg-ok" : "bg-warn"}`} />
      {state.open ? t.openNow : `${t.closedNow} ${state.opens}`}
    </span>
  );
}

function CartLink({ lang }: { lang: Lang }) {
  const { count } = useCart();
  return (
    <SLink to={`${prefix(lang)}/cart`}
      className="relative flex h-10 items-center gap-2 rounded-full border border-gold/50 px-4 text-fs14 font-semibold text-ink transition hover:border-gold hover:bg-tint">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 7h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 7a3 3 0 1 1 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className="hidden sm:inline">{T[lang].cart}</span>
      <span className="alc-tabular min-w-5 rounded-full bg-gold px-1.5 text-center text-fs12 font-bold leading-5 text-ongold">{count}</span>
    </SLink>
  );
}

function LangSwitch({ lang }: { lang: Lang }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Language" className="flex items-center rounded-full border border-line p-0.5">
      {LANGS.map((l) => (
        <a key={l} href={switchLangPath(pathname, l)} hrefLang={l} aria-current={l === lang ? "true" : undefined}
          className={`rounded-full px-2.5 py-1 text-fs12 font-semibold transition ${l === lang ? "bg-gold text-ongold" : "text-muted hover:text-ink"}`}>
          {LANG_LABEL[l]}
        </a>
      ))}
    </nav>
  );
}

const rootApi = getRouteApi("__root__");

/** Header links: the categories that currently have products (from the root loader), up to six. */
function useNav(): [string, string][] {
  const root = rootApi.useLoaderData() as { categories?: { slug: string; name: string }[] } | undefined;
  return (root?.categories ?? []).slice(0, 6).map((c) => [`/catalog/${c.slug}`, c.name]);
}

export function AnnouncementBar({ lang, settings }: { lang: Lang; settings: Settings | null }) {
  const t = T[lang];
  if (!settings) return null;
  const msg = `${t.freeOver} AED ${settings.free_delivery_min}  ·  ${t.promoLabel} WELCOME10  ·  ${t.footerAge}`;
  return (
    <div className="bg-gold py-2 text-center text-fs13 font-semibold text-ongold">
      <p className="px-4">{msg}</p>
    </div>
  );
}

export function SiteHeader({ lang, overlay = false, settings = null }: { lang: Lang; overlay?: boolean; settings?: Settings | null }) {
  const t = T[lang];
  const nav = useNav();
  return (
    <header className={`${overlay ? "absolute inset-x-0 top-0 bg-gradient-to-b from-surface/90 to-transparent" : "sticky top-0 border-b border-line bg-surface/92 backdrop-blur-md"} z-40`}>
      {!overlay ? <AnnouncementBar lang={lang} settings={settings} /> : null}
      <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between gap-4 px-4 md:px-8">
        <Wordmark lang={lang} />
        <nav aria-label="Main" className="hidden items-center gap-7 text-fs14 font-medium uppercase tracking-[0.12em] text-muted lg:flex">
          {nav.map(([href, label]) => (
            <SLink key={href} to={`${prefix(lang)}${href}`} className="transition hover:text-gold">{label}</SLink>
          ))}
          <SLink to={`${prefix(lang)}/delivery`} className="transition hover:text-gold">{t.delivery}</SLink>
          <SLink to={`${prefix(lang)}/blog`} className="transition hover:text-gold">{t.blog}</SLink>
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch lang={lang} />
          <CartLink lang={lang} />
        </div>
      </div>
      <nav aria-label="Mobile" className="alc-noscroll flex gap-5 overflow-x-auto px-4 pb-3 text-fs13 font-medium uppercase tracking-[0.1em] text-muted lg:hidden">
        <SLink to={`${prefix(lang)}/catalog`} className="shrink-0 hover:text-gold">{t.catalog}</SLink>
        {nav.map(([href, label]) => <SLink key={href} to={`${prefix(lang)}${href}`} className="shrink-0 hover:text-gold">{label}</SLink>)}
        <SLink to={`${prefix(lang)}/blog`} className="shrink-0 hover:text-gold">{t.blog}</SLink>
      </nav>
    </header>
  );
}

export function waLink(number: string, text: string) {
  const digits = number.replace(/[^0-9]/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : "";
}

export function WhatsAppFloat({ lang, number }: { lang: Lang; number: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { lines, subtotal } = useCart();
  const t = T[lang];
  // With items in the cart, the message already lists them, so the order can be confirmed in one reply.
  const message = lines.length
    ? `${t.waMessage}\n${lines.map((l) => `• ${l.qty} × ${l.name}`).join("\n")}\n${t.subtotal}: AED ${subtotal}`
    : t.waMessage;
  const href = waLink(number, message);
  if (!href || pathname.startsWith("/admin")) return null;
  return (
    <a href={href} target="_blank" rel="noopener" data-wa="float" aria-label={t.orderWhatsApp}
      className="group fixed bottom-5 end-5 z-50 flex h-14 items-center gap-2 rounded-full bg-[#25d366] ps-4 pe-5 text-fs15 font-bold text-[#0b0b0c] shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5">
      <span aria-hidden="true" className="alc-wa-pulse absolute inset-0 rounded-full bg-[#25d366]" />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="relative">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
      </svg>
      <span className="relative hidden sm:inline">{t.orderWhatsApp}</span>
      <span className="relative sm:hidden">{t.waShort}</span>
    </a>
  );
}

export function FirstOrderPopup({ lang }: { lang: Lang }) {
  const t = T[lang];
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = window.localStorage.getItem("alocmir-popup") === "1"; } catch { /* ignore */ }
    if (seen || pathname.startsWith("/admin")) return;
    const timer = window.setTimeout(() => {
      let age = false;
      try { age = window.localStorage.getItem("alocmir-age-ok") === "1"; } catch { /* ignore */ }
      if (age) setOpen(true);
    }, 25000);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  function close() {
    try { window.localStorage.setItem("alocmir-popup", "1"); } catch { /* ignore */ }
    setOpen(false);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const phone = String(new FormData(e.currentTarget).get("phone") ?? "");
    try {
      const r = await saveLead({ data: { phone, lang, source: "popup" } });
      track("lead", { label: "popup" });
      setCode(r.code);
      try { window.localStorage.setItem("alocmir-popup", "1"); } catch { /* ignore */ }
    } finally {
      setBusy(false);
    }
  }
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="popup-title" className="fixed inset-0 z-[90] flex items-end justify-center bg-surface/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[18px] border border-gold/40 bg-raised">
        <img src="/assets/products/sparkling.jpg" alt="" role="presentation" className="h-40 w-full object-cover" />
        <button type="button" onClick={close} aria-label="Close" className="absolute end-3 top-3 flex size-9 items-center justify-center rounded-full bg-surface/80 text-ink">×</button>
        <div className="p-7">
          <h2 id="popup-title" className="text-fs30 leading-tight text-ink">{t.popupTitle}</h2>
          {code ? (
            <div className="mt-4">
              <p className="text-fs15 text-muted">{t.popupThanks}</p>
              <p className="alc-tabular mt-2 rounded-[10px] border border-dashed border-gold py-3 text-center text-fs24 font-bold tracking-[0.2em] text-gold">{code}</p>
              <button type="button" onClick={close} className="mt-5 h-11 w-full rounded-full bg-gold font-semibold text-ongold">{t.shop}</button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-3">
              <p className="text-fs15 leading-relaxed text-muted">{t.popupBody}</p>
              <label htmlFor="lead-phone" className="mt-5 block text-fs13 font-semibold text-ink">WhatsApp</label>
              <input id="lead-phone" name="phone" type="tel" inputMode="tel" required minLength={6} placeholder="+971 5x xxx xxxx"
                className="alc-tabular mt-1.5 h-12 w-full rounded-[10px] border border-line-strong bg-surface px-3.5 text-fs16 text-ink placeholder:text-muted" />
              <button type="submit" disabled={busy} className="mt-4 h-12 w-full rounded-full bg-gold text-fs16 font-semibold text-ongold transition hover:bg-gold-light disabled:opacity-60">{t.popupCta}</button>
              <button type="button" onClick={close} className="mt-2 h-10 w-full text-fs14 text-muted hover:text-ink">{t.popupNo}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function SiteFooter({ lang, settings, categories }: { lang: Lang; settings: Settings | null; categories?: { slug: string; name: string }[] }) {
  const t = T[lang];
  const wa = settings ? waLink(settings.whatsapp, t.waMessage) : "";
  return (
    <footer className="border-t border-line bg-surface">
      <div className="alc-hairline" />
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div className="max-w-[40ch] space-y-3">
          <Wordmark lang={lang} size="lg" />
          <p className="text-fs14 leading-relaxed text-muted">{t.tagline}</p>
          <p className="text-fs14 font-semibold text-ink">{t.footerAge}</p>
          <p className="text-fs14 text-muted">{t.footerResponsible}</p>
          {settings?.licence ? <p className="text-fs13 text-muted">{settings.licence}</p> : null}
        </div>
        <div>
          <h2 className="mb-4 text-fs13 font-semibold uppercase tracking-[0.14em] text-gold">{t.catalog}</h2>
          <ul className="space-y-2 text-fs14">
            {(categories ?? []).map((c) => (
              <li key={c.slug}><SLink to={`${prefix(lang)}/catalog/${c.slug}`} className="text-ink/85 hover:text-gold">{c.name}</SLink></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-fs13 font-semibold uppercase tracking-[0.14em] text-gold">{t.areasTitle}</h2>
          <FooterAreas lang={lang} />
        </div>
        <div className="space-y-2 text-fs14">
          <h2 className="mb-4 text-fs13 font-semibold uppercase tracking-[0.14em] text-gold">{t.delivery}</h2>
          {settings?.hours ? <p className="text-ink/85">{t.hours}: <span className="alc-tabular">{settings.hours}</span></p> : null}
          <p><SLink to={`${prefix(lang)}/delivery`} className="text-ink/85 hover:text-gold">{t.deliveryTitle}</SLink></p>
          <p><SLink to={`${prefix(lang)}/blog`} className="text-ink/85 hover:text-gold">{t.blog}</SLink></p>
          {wa ? <p><a href={wa} target="_blank" rel="noopener" data-wa="footer" className="text-ink underline decoration-gold/60 decoration-2 underline-offset-4 hover:decoration-gold">WhatsApp</a></p> : null}
          {settings?.phone ? <p><a href={`tel:${settings.phone}`} className="alc-tabular text-ink/85 hover:text-gold">{settings.phone}</a></p> : null}
        </div>
      </div>
      <div className="border-t border-line px-4 py-5 text-center text-fs12 text-muted">© {new Date().getFullYear()} Alocmir, Dubai</div>
    </footer>
  );
}

import { AREA_PAGES } from "@/lib/store/i18n";
function FooterAreas({ lang }: { lang: Lang }) {
  return (
    <ul className="grid grid-cols-1 gap-2 text-fs14">
      {AREA_PAGES.slice(0, 8).map((a) => (
        <li key={a.slug}><SLink to={`${prefix(lang)}/delivery/${a.slug}`} className="text-ink/85 hover:text-gold">{a.name[lang]}</SLink></li>
      ))}
    </ul>
  );
}

export function AgeGate({ lang }: { lang: Lang }) {
  const t = T[lang];
  const [state, setState] = useState<"unknown" | "ok" | "ask" | "blocked">("unknown");
  useEffect(() => {
    let ok = false;
    try { ok = window.localStorage.getItem("alocmir-age-ok") === "1"; } catch { /* ignore */ }
    if (ok || window.location.pathname.startsWith("/admin")) setState("ok");
    else setState("ask");
  }, []);
  if (state === "ok" || state === "unknown") return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="age-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/95 p-4 backdrop-blur-md">
      <div className="w-full max-w-[440px] rounded-[18px] border border-gold/40 bg-raised p-9 text-center">
        <img src="/assets/brand/mark.png" alt="" role="presentation" width={64} height={64} className="mx-auto mb-4 size-16 rounded-full border border-gold/40" />
        <p className="alc-display alc-gold-text text-fs24 tracking-[0.08em]">ALOCMIR</p>
        <div className="alc-hairline my-5" />
        {state === "blocked" ? (
          <p className="text-fs17 text-ink">{t.ageBlocked}</p>
        ) : (
          <>
            <h2 id="age-title" className="text-fs30 leading-tight text-ink">{t.ageTitle}</h2>
            <p className="mt-3 text-fs15 leading-relaxed text-muted">{t.ageBody}</p>
            <div className="mt-7 flex flex-col gap-3">
              <button type="button" autoFocus
                onClick={() => { try { window.localStorage.setItem("alocmir-age-ok", "1"); } catch { /* ignore */ } setState("ok"); }}
                className="h-12 rounded-full bg-gold text-fs16 font-semibold text-ongold transition hover:bg-gold-light active:scale-[0.98]">
                {t.ageYes}
              </button>
              <button type="button" onClick={() => setState("blocked")} className="h-10 text-fs14 text-muted hover:text-ink">{t.ageNo}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
