import { useEffect, useState } from "react";

import { adminAnalytics } from "@/lib/store/admin.functions";

type Data = Awaited<ReturnType<typeof adminAnalytics>>;
const PERIODS = [7, 30, 90] as const;
const nf = new Intl.NumberFormat("en-US");
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "—");
const shortDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[12px] border border-line bg-raised p-4">
      <p className="text-fs12 text-muted">{label}</p>
      <p className="alc-tabular mt-1 text-fs24 font-bold text-ink">{value}</p>
      {sub ? <p className="mt-0.5 text-fs12 text-muted">{sub}</p> : null}
    </div>
  );
}

/** Single-series daily bar chart: one gold series, hover tooltip per bar, table view for accessibility. */
function DailyBars({ title, rows, value, format, detail }: {
  title: string; rows: Data["days"]; value: (r: Data["days"][number]) => number;
  format: (n: number) => string; detail: (r: Data["days"][number]) => string;
}) {
  const max = Math.max(1, ...rows.map(value));
  const total = rows.reduce((s, r) => s + value(r), 0);
  const ticks = [rows[0], rows[Math.floor(rows.length / 2)], rows[rows.length - 1]];
  const caption = (
    <figcaption className="flex items-baseline justify-between gap-3">
      <span className="text-fs15 font-semibold text-ink">{title}</span>
      <span className="alc-tabular text-fs13 text-muted">Total {format(total)}</span>
    </figcaption>
  );
  if (!total) {
    return (
      <figure className="rounded-[12px] border border-line bg-raised p-5">
        {caption}
        <p className="flex h-40 items-center justify-center text-fs14 text-muted">Nothing in this period yet.</p>
      </figure>
    );
  }
  return (
    <figure className="rounded-[12px] border border-line bg-raised p-5">
      {caption}
      <div className="relative mt-4">
        <span className="alc-tabular absolute -top-1 left-0 text-fs12 text-muted">{format(max)}</span>
        <div className="flex h-40 items-end gap-[2px] border-b border-line-strong pt-5" role="img" aria-label={`${title}, ${rows.length} days, total ${format(total)}`}>
          {rows.map((r) => {
            const v = value(r);
            return (
              <div key={r.d} className="group relative flex h-full flex-1 items-end justify-center">
                <div className="w-full max-w-[22px] rounded-t-[4px] bg-gold transition-opacity group-hover:opacity-80"
                  style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }} />
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-max -translate-x-1/2 rounded-[8px] border border-line-strong bg-surface px-3 py-2 text-fs12 text-ink shadow-lg group-hover:block">
                  <p className="font-semibold">{shortDate(r.d)}</p>
                  <p className="alc-tabular text-muted">{detail(r)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-fs12 text-muted">
          {ticks.map((r, i) => <span key={i}>{shortDate(r.d)}</span>)}
        </div>
      </div>
      <details className="mt-3 text-fs13 text-muted">
        <summary className="cursor-pointer">Show as table</summary>
        <table className="mt-2 w-full">
          <tbody>{[...rows].reverse().map((r) => <tr key={r.d} className="border-t border-line"><td className="py-1">{r.d}</td><td className="alc-tabular py-1 text-end text-ink">{detail(r)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

/** Ranked list with an inline magnitude bar, used for every breakdown table. */
function Ranked({ title, rows, unit, extra }: { title: string; rows: { k: string | null; n: number }[]; unit: string; extra?: (k: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section className="rounded-[12px] border border-line bg-raised p-5">
      <h3 className="flex justify-between text-fs15 font-semibold text-ink"><span>{title}</span><span className="text-fs12 font-normal text-muted">{unit}</span></h3>
      {rows.length ? (
        <ul className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <li key={r.k ?? "none"}>
              <div className="flex justify-between gap-3 text-fs13">
                <span className="truncate text-ink">{r.k || "—"}</span>
                <span className="alc-tabular shrink-0 text-muted">{nf.format(r.n)}{extra && r.k ? extra(r.k) : ""}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-line"><div className="h-full rounded-full bg-gold/70" style={{ width: `${(r.n / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      ) : <p className="mt-3 text-fs13 text-muted">No data yet.</p>}
    </section>
  );
}

const WA_PLACES: Record<string, string> = { float: "Floating button", home: "Home page", area: "Area pages", blog: "Blog posts", footer: "Footer", link: "Other links" };

export function Analytics() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    setError(false);
    adminAnalytics({ data: { days } }).then((d) => { if (live) setData(d); }).catch(() => { if (live) setError(true); });
    return () => { live = false; };
  }, [days]);

  if (error) return <p className="text-bad">Could not load analytics. Run `npm run db:migrate` to create the analytics table.</p>;
  if (!data) return <p className="text-muted">Loading analytics...</p>;
  const { totals: t, funnel: f } = data;
  const steps = [
    ["Visited the site", f.visitors], ["Viewed a product", f.product], ["Added to cart", f.cart],
    ["Opened the cart", f.checkout], ["Placed an order", f.ordered],
  ] as const;
  const orderBySource = new Map(data.sources.map((s) => [s.k ?? "", s.orders]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-fs14 text-muted">Visitors are counted without cookies or personal data. Times are Dubai time.</p>
        <div role="group" aria-label="Period" className="flex rounded-full border border-line p-0.5">
          {PERIODS.map((p) => (
            <button key={p} type="button" aria-pressed={days === p} onClick={() => { setData(null); setDays(p); }}
              className={`rounded-full px-3.5 py-1.5 text-fs13 font-semibold ${days === p ? "bg-gold text-ongold" : "text-muted hover:text-ink"}`}>{p} days</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Visitors" value={nf.format(t.visitors)} sub={`${nf.format(t.sessions)} visits · ${nf.format(t.views)} page views`} />
        <Tile label="Orders on the site" value={nf.format(t.orders)} sub={`Conversion ${pct(t.orders, t.visitors)}`} />
        <Tile label="Revenue (AED)" value={nf.format(t.revenue)} sub={`Average order AED ${nf.format(t.aov)}`} />
        <Tile label="WhatsApp clicks" value={nf.format(t.whatsapp)} sub={`${nf.format(t.whatsappVisitors)} people · ${pct(t.whatsappVisitors, t.visitors)} of visitors`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailyBars title="Visitors per day" rows={data.days} value={(r) => r.visitors} format={nf.format}
          detail={(r) => `${nf.format(r.visitors)} visitors · ${nf.format(r.views)} views`} />
        <DailyBars title="Revenue per day (AED)" rows={data.days} value={(r) => r.revenue} format={nf.format}
          detail={(r) => `AED ${nf.format(r.revenue)} · ${r.orders} orders`} />
      </div>

      <section className="rounded-[12px] border border-line bg-raised p-5">
        <h3 className="text-fs15 font-semibold text-ink">From visit to order</h3>
        <p className="mt-1 text-fs13 text-muted">How many visitors reach each step. {nf.format(f.wa)} visitors also contacted you on WhatsApp, and their orders don't appear here.</p>
        <ol className="mt-4 space-y-3">
          {steps.map(([label, n], i) => (
            <li key={label} className="grid grid-cols-[150px_1fr_110px] items-center gap-3 text-fs13 md:grid-cols-[180px_1fr_130px]">
              <span className="text-ink">{label}</span>
              <div className="h-6 rounded-[4px] bg-line"><div className="h-full rounded-[4px] bg-gold" style={{ width: `${f.visitors ? Math.max((n / f.visitors) * 100, n ? 1 : 0) : 0}%` }} /></div>
              <span className="alc-tabular text-end text-muted">{nf.format(n)} · {i === 0 ? "100%" : pct(n, f.visitors)}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Ranked title="Traffic sources" unit="visits · orders" rows={data.sources} extra={(k) => ` · ${orderBySource.get(k) ?? 0}`} />
        <Ranked title="Top pages" unit="views" rows={data.pages} />
        <Ranked title="WhatsApp clicks by place" unit="clicks" rows={data.waPlaces.map((r) => ({ ...r, k: WA_PLACES[r.k ?? "link"] ?? r.k }))} />
        <Ranked title="Devices" unit="visitors" rows={data.devices} />
        <Ranked title="Countries" unit="visitors" rows={data.countries} />
        <Ranked title="Language" unit="visitors" rows={data.langs.map((r) => ({ ...r, k: r.k === "ru" ? "Russian" : r.k === "en" ? "English" : r.k }))} />
        <Ranked title="Best-selling products" unit="revenue AED" rows={data.products.map((p) => ({ k: `${p.name} (${p.qty})`, n: Math.round(p.revenue) }))} />
        <Ranked title="Orders by area" unit="orders" rows={data.areas} />
        <Ranked title="Payment and promo codes" unit="orders" rows={[...data.payments.map((p) => ({ ...p, k: `Pay by ${p.k}` })), ...data.promos.map((p) => ({ ...p, k: `Code ${p.k}` }))]} />
      </div>
      <p className="text-fs12 text-muted">New leads from the 10% popup in this period: {nf.format(t.leads)}.</p>
    </div>
  );
}
