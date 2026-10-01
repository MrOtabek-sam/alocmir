import { SLink } from "@/components/store/slink";
import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { useCart } from "@/components/store/cart";
import { SiteFooter, SiteHeader } from "@/components/store/chrome";
import { AREAS, T, fill, isLang, money, prefix, type Lang } from "@/lib/store/i18n";
import { pageHead } from "@/lib/store/seo";
import { checkPromo, getUpsell, placeOrder } from "@/lib/store/store.functions";
import { track } from "@/lib/analytics";
import type { Product } from "@/lib/store/db.server";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/$lang/cart")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  head: ({ params }) => {
    const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
    return pageHead({ lang, rest: "/cart", title: `${T[lang].cart} | Alcomir`, description: T[lang].catalogIntro, noindex: true });
  },
  component: CartRoute,
});

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-fs14 font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}
const inputCls = "h-12 rounded-[10px] border border-line-strong bg-surface px-3.5 text-fs16 text-ink placeholder:text-muted";

function CartRoute() {
  const { lang: l } = Route.useParams();
  const lang = l as Lang;
  const t = T[lang];
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  const s = root.settings;
  const cart = useCart();
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  const [promo, setPromo] = useState<{ code: string; amount: number } | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [upsell, setUpsell] = useState<Product[]>([]);
  useEffect(() => {
    getUpsell({ data: { lang } }).then(setUpsell).catch(() => setUpsell([]));
  }, [lang]);
  useEffect(() => {
    // Re-validate the promo when the cart changes.
    if (!promo) return;
    checkPromo({ data: { code: promo.code, subtotal: cart.subtotal } }).then((r) => setPromo(r.ok ? { code: r.code, amount: r.amount } : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.subtotal]);
  async function applyPromo() {
    const r = await checkPromo({ data: { code: promoInput, subtotal: cart.subtotal } });
    if (r.ok) { setPromo({ code: r.code, amount: r.amount }); setPromoMsg(t.promoApplied); }
    else { setPromo(null); setPromoMsg(t.promoInvalid); }
  }
  const fee = s ? (cart.subtotal >= s.free_delivery_min ? 0 : s.delivery_fee) : 0;
  const discount = promo?.amount ?? 0;
  const total = Math.max(0, cart.subtotal - discount) + (cart.lines.length ? fee : 0);
  const freeLeft = s ? Math.max(0, s.free_delivery_min - cart.subtotal) : 0;
  const freePct = s && s.free_delivery_min > 0 ? Math.min(100, (cart.subtotal / s.free_delivery_min) * 100) : 100;
  const inCart = new Set(cart.lines.map((l) => l.slug));
  const belowMin = !!s && cart.subtotal < s.min_order;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setStatus("sending");
    setError("");
    try {
      const res = await placeOrder({
        data: {
          lang,
          name: String(f.get("name") ?? ""),
          phone: String(f.get("phone") ?? ""),
          area: String(f.get("area") ?? ""),
          address: String(f.get("address") ?? ""),
          notes: String(f.get("notes") ?? ""),
          payment: f.get("payment") === "card" ? "card" : "cash",
          ageOk: true,
          items: cart.lines.map((x) => ({ slug: x.slug, qty: x.qty })),
          promo: promo?.code ?? "",
        },
      });
      if (res.ok) {
        track("order", { label: res.code, value: res.total, items: cart.lines.map((x) => ({ id: x.slug, name: x.name, price: x.price, qty: x.qty })) });
        setCode(res.code);
        setStatus("done");
        cart.clear();
      } else {
        setStatus("error");
        setError(res.error === "min_order" && s ? `${t.minOrder}: ${money(s.min_order, lang)}` : t.errorGeneric);
      }
    } catch {
      setStatus("error");
      setError(t.errorGeneric);
    }
  }

  return (
    <>
      <SiteHeader lang={lang} settings={root.settings} />
      <main className="alc-glow-bg min-h-dvh">
        <div className="mx-auto max-w-[1100px] px-4 pb-20 pt-10 md:px-8">
          <h1 className="text-fs36 font-bold tracking-tight text-ink md:text-fs48">{status === "done" ? t.orderPlaced : t.cart}</h1>

          {status === "done" ? (
            <div className="mt-8 max-w-[560px] rounded-[16px] border border-line bg-raised p-8">
              <p className="text-fs16 leading-relaxed text-muted">{t.orderPlacedBody}</p>
              <p className="alc-tabular mt-3 text-fs32 font-bold text-gold">{code}</p>
              <SLink to={`${prefix(lang)}/catalog`} className="mt-6 inline-block font-semibold text-link underline decoration-tint decoration-2 underline-offset-4">{t.continueShopping}</SLink>
            </div>
          ) : !cart.lines.length ? (
            <div className="mt-8">
              <p className="text-fs16 text-muted">{t.cartEmpty}</p>
              <SLink to={`${prefix(lang)}/catalog`} className="mt-4 inline-block font-semibold text-link underline decoration-tint decoration-2 underline-offset-4">{t.continueShopping}</SLink>
            </div>
          ) : (
            <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
              <section aria-label={t.cart}>
                {s ? (
                  <div className="mb-6 rounded-[14px] border border-line bg-raised p-4">
                    <p className="text-fs14 font-semibold text-ink">{freeLeft > 0 ? fill(t.freeLeft, { amount: money(freeLeft, lang) }) : t.freeUnlocked}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(freePct)}>
                      <div className="h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${freePct}%` }} />
                    </div>
                  </div>
                ) : null}
                <ul className="divide-y divide-line border-y border-line">
                  {cart.lines.map((x) => (
                    <li key={x.slug} className="flex gap-4 py-4">
                      <img src={x.image} alt={x.name} width={88} height={88} className="size-[88px] rounded-[12px] border border-line object-cover" />
                      <div className="flex flex-1 flex-col">
                        <SLink to={`${prefix(lang)}/product/${x.slug}`} className="text-fs16 font-semibold text-ink hover:text-gold">{x.name}</SLink>
                        <span className="alc-tabular text-fs14 text-muted">{money(x.price, lang)}</span>
                        <div className="mt-auto flex items-center gap-3">
                          <div className="flex items-center rounded-full border border-line-strong">
                            <button type="button" aria-label="-1" onClick={() => cart.setQty(x.slug, x.qty - 1)} className="h-9 w-9 text-ink">−</button>
                            <span className="alc-tabular w-6 text-center text-fs14 text-ink">{x.qty}</span>
                            <button type="button" aria-label="+1" onClick={() => cart.setQty(x.slug, x.qty + 1)} className="h-9 w-9 text-ink">+</button>
                          </div>
                          <button type="button" onClick={() => cart.remove(x.slug)} className="text-fs13 text-muted underline hover:text-bad">{t.remove}</button>
                        </div>
                      </div>
                      <span className="alc-tabular text-fs16 font-semibold text-ink">{money(x.price * x.qty, lang)}</span>
                    </li>
                  ))}
                </ul>
                {upsell.filter((u) => !inCart.has(u.slug)).length ? (
                  <div className="mt-6">
                    <h2 className="text-fs22 text-ink">{t.upsellTitle}</h2>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                      {upsell.filter((u) => !inCart.has(u.slug)).slice(0, 3).map((u) => (
                        <li key={u.slug} className="flex flex-col rounded-[12px] border border-line bg-raised p-3">
                          <span className="text-fs14 font-semibold text-ink">{u.name}</span>
                          <span className="alc-tabular mt-1 text-fs13 text-muted">{money(u.price, lang)}</span>
                          <button type="button" onClick={() => cart.add({ slug: u.slug, name: u.name, price: u.price, image: u.image })}
                            className="mt-3 h-9 rounded-full border border-gold/60 text-fs13 font-semibold text-gold transition hover:bg-gold hover:text-ongold">+ {t.addToCart}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="mt-6 flex gap-2">
                  <label htmlFor="promo" className="sr-only">{t.promoLabel}</label>
                  <input id="promo" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder={t.promoLabel}
                    className="h-11 flex-1 rounded-[10px] border border-line-strong bg-surface px-3.5 text-fs15 uppercase tracking-[0.1em] text-ink placeholder:normal-case placeholder:tracking-normal placeholder:text-muted" />
                  <button type="button" onClick={applyPromo} className="h-11 rounded-[10px] border border-gold px-5 text-fs14 font-semibold text-gold hover:bg-gold hover:text-ongold">{t.promoApply}</button>
                </div>
                {promoMsg ? <p role="status" className={`mt-2 text-fs13 ${promo ? "text-ok" : "text-bad"}`}>{promoMsg}</p> : null}
                <dl className="mt-6 space-y-2 text-fs15">
                  <div className="flex justify-between"><dt className="text-muted">{t.subtotal}</dt><dd className="alc-tabular text-ink">{money(cart.subtotal, lang)}</dd></div>
                  {discount > 0 ? <div className="flex justify-between"><dt className="text-muted">{t.discount} ({promo?.code})</dt><dd className="alc-tabular text-ok">-{money(discount, lang)}</dd></div> : null}
                  <div className="flex justify-between"><dt className="text-muted">{t.deliveryFee}</dt><dd className="alc-tabular text-ink">{fee === 0 ? t.free : money(fee, lang)}</dd></div>
                  <div className="flex justify-between border-t border-line pt-3 text-fs18 font-bold"><dt className="text-ink">{t.total}</dt><dd className="alc-tabular text-ink">{money(total, lang)}</dd></div>
                </dl>
                {s && fee > 0 ? <p className="mt-3 text-fs13 text-muted">{t.freeOver} {money(s.free_delivery_min, lang)}</p> : null}
              </section>

              <form onSubmit={submit} className="flex flex-col gap-4 rounded-[16px] border border-line bg-raised p-6 md:p-8" aria-describedby={error ? "order-error" : undefined}>
                <h2 className="text-fs22 font-bold text-ink">{t.checkout}</h2>
                <Field id="name" label={t.name}><input id="name" name="name" required minLength={2} autoComplete="name" className={inputCls} /></Field>
                <Field id="phone" label={t.phone}><input id="phone" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+971 5x xxx xxxx" className={`${inputCls} alc-tabular`} /></Field>
                <Field id="area" label={t.area}>
                  <select id="area" name="area" required defaultValue="" className={inputCls}>
                    <option value="" disabled>{t.area}</option>
                    {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </Field>
                <Field id="address" label={t.address}><input id="address" name="address" required minLength={3} autoComplete="street-address" className={inputCls} /></Field>
                <Field id="notes" label={t.notes}><textarea id="notes" name="notes" rows={2} className={`${inputCls} h-auto py-3`} /></Field>
                <fieldset className="flex flex-col gap-2">
                  <legend className="mb-1.5 text-fs14 font-semibold text-ink">{t.payment}</legend>
                  <div className="flex gap-3">
                    {(["cash", "card"] as const).map((v) => (
                      <label key={v} className="flex flex-1 cursor-pointer items-center gap-2 rounded-[10px] border border-line-strong px-4 py-3 text-fs15 text-ink has-[:checked]:border-gold has-[:checked]:bg-tint">
                        <input type="radio" name="payment" value={v} defaultChecked={v === "cash"} className="accent-gold" />
                        {v === "cash" ? t.cash : t.card}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="flex items-start gap-3 text-fs14 leading-relaxed text-ink">
                  <input type="checkbox" required name="age" className="mt-1 size-4 accent-gold" />
                  {t.confirmAge}
                </label>
                {error ? <p id="order-error" role="alert" className="text-fs14 font-semibold text-bad">{error}</p> : null}
                {belowMin && s ? <p className="text-fs14 text-warn">{t.minOrder}: {money(s.min_order, lang)}</p> : null}
                <button type="submit" disabled={status === "sending" || belowMin}
                  className="group relative mt-2 h-14 overflow-hidden rounded-[12px] bg-deep text-fs16 font-semibold text-ink transition active:translate-y-[1px] disabled:opacity-60">
                  <span className="relative z-10">{status === "sending" ? t.sending : `${t.placeOrder} · ${money(total, lang)}`}</span>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-25 bg-gold transition-transform duration-500 group-hover:scale-x-100" />
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      <SiteFooter lang={lang} settings={root.settings} categories={root.categories} />
    </>
  );
}
