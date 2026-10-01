import { SLink } from "@/components/store/slink";
import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { StructuredData } from "@/components/StructuredData";
import { Breadcrumbs } from "@/components/store/catalog-page";
import { SiteFooter, SiteHeader } from "@/components/store/chrome";
import { AddToCart, ProductCard, StockNote } from "@/components/store/product-card";
import { SITE_URL, T, homePath, isLang, langUrl, money, prefix, type Lang } from "@/lib/store/i18n";
import { breadcrumb, ldJson, ORG_ID, pageHead } from "@/lib/store/seo";
import { getProduct } from "@/lib/store/store.functions";

const rootApi = getRouteApi("__root__");

function seoTitle(name: string, lang: Lang) {
  if (lang === "ru") return `${name}: купить в Дубае с доставкой | Alcomir`;
  return `${name}: Buy in Dubai, Delivered Cold | Alcomir`;
}
function seoDesc(name: string, price: string, lang: Lang) {
  if (lang === "ru") return `${name} за ${price} с доставкой по Дубаю. Привезём охлаждённым, оплата при получении. Только 21+.`;
  return `Buy ${name} in Dubai for ${price}. Delivered chilled to your door, pay cash or card on delivery. 21+ only.`;
}

export const Route = createFileRoute("/$lang/product/$slug")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  loader: ({ params }) => getProduct({ data: { lang: params.lang as Lang, slug: params.slug } }),
  head: ({ params, loaderData }) => {
    const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
    const p = loaderData?.product;
    if (!p) return {};
    return pageHead({
      lang, rest: `/product/${p.slug}`, type: "product", image: p.image,
      title: p.metaTitle || seoTitle(p.name, lang),
      description: p.metaDesc || seoDesc(p.name, money(p.price, lang), lang),
    });
  },
  component: ProductRoute,
});

function ProductRoute() {
  const { lang: l } = Route.useParams();
  const lang = l as Lang;
  const t = T[lang];
  const { product: p, category, related } = Route.useLoaderData();
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  const [qty, setQty] = useState(1);

  const crumbs = [
    { name: t.home, href: homePath(lang) },
    { name: t.catalog, href: `${prefix(lang)}/catalog` },
    ...(category ? [{ name: category.name, href: `${prefix(lang)}/catalog/${category.slug}` }] : []),
    { name: p.name, href: `${prefix(lang)}/product/${p.slug}` },
  ];
  const url = langUrl(lang, `/product/${p.slug}`);
  const schema = ldJson({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: p.name,
        description: p.description,
        image: [p.image.startsWith("http") ? p.image : SITE_URL + p.image],
        sku: p.slug,
        category: category?.name,
        ...(p.brand && p.brand !== "Sample" ? { brand: { "@type": "Brand", name: p.brand } } : {}),
        ...(p.origin ? { countryOfOrigin: p.origin } : {}),
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "AED",
          price: p.price.toFixed(2),
          availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@id": ORG_ID },
          eligibleRegion: { "@type": "City", name: "Dubai" },
        },
      },
      breadcrumb(crumbs.map((c) => ({ name: c.name, url: SITE_URL + (c.href === "/" ? "" : c.href) }))),
    ],
  });
  const facts = [
    p.volume ? [t.volume, `${p.volume} ml`] : null,
    p.abv ? [t.abv, `${p.abv}%`] : null,
    p.origin ? [t.origin, p.origin] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <StructuredData json={schema} />
      <SiteHeader lang={lang} settings={root.settings} />
      <main className="alc-glow-bg">
        <div className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 md:px-8 md:pt-12">
          <Breadcrumbs items={crumbs} />
          <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-14">
            <div className="overflow-hidden rounded-[16px] border border-line bg-surface">
              <img src={p.image} alt={`${p.name}${p.volume ? `, ${p.volume} ml` : ""}`} width={900} height={900} fetchPriority="high" className="aspect-square w-full object-cover" />
            </div>
            <div className="flex flex-col">
              {category ? <SLink to={`${prefix(lang)}/catalog/${category.slug}`} className="text-fs14 font-semibold text-link hover:text-gold">{category.name}</SLink> : null}
              <h1 className="mt-2 text-fs34 font-bold leading-[1.08] tracking-tight text-ink md:text-fs46">{p.name}</h1>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="alc-tabular text-fs30 font-bold text-ink">{money(p.price, lang)}</span>
                {p.oldPrice && p.oldPrice > p.price ? <span className="alc-tabular text-fs17 text-muted line-through">{money(p.oldPrice, lang)}</span> : null}
              </div>
              <div className="mt-2"><StockNote stock={p.stock} lang={lang} /></div>
              {p.description ? <p className="mt-6 max-w-[60ch] text-fs16 leading-relaxed text-muted">{p.description}</p> : null}
              {facts.length ? (
                <dl className="mt-6 grid grid-cols-3 divide-x divide-line rounded-[12px] border border-line">
                  {facts.map(([k, v]) => (
                    <div key={k} className="px-4 py-3">
                      <dt className="text-fs12 text-muted">{k}</dt>
                      <dd className="alc-tabular mt-1 text-fs15 font-semibold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <div className="mt-8 flex items-stretch gap-3">
                <div className="flex items-center rounded-[12px] border border-line-strong" role="group" aria-label={t.qty}>
                  <button type="button" aria-label="-1" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-14 w-11 text-fs20 text-ink">−</button>
                  <span className="alc-tabular w-8 text-center text-fs16 font-semibold text-ink" aria-live="polite">{qty}</span>
                  <button type="button" aria-label="+1" onClick={() => setQty((q) => Math.min(48, q + 1))} className="h-14 w-11 text-fs20 text-ink">+</button>
                </div>
                <div className="flex-1"><AddToCart product={p} lang={lang} qty={qty} wide /></div>
              </div>
              <ul className="mt-8 space-y-2 border-t border-line pt-6 text-fs14 text-muted">
                <li>{t.footerAge}</li>
                <li>{t.payment}: {t.cash}, {t.card}</li>
                {root.settings ? <li>{t.freeOver} <span className="alc-tabular text-ink">{money(root.settings.free_delivery_min, lang)}</span></li> : null}
              </ul>
            </div>
          </div>

          {related.length ? (
            <section aria-labelledby="related" className="mt-20">
              <h2 id="related" className="text-fs26 font-bold text-ink md:text-fs32">{t.related}</h2>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((r) => <ProductCard key={r.slug} product={r} lang={lang} />)}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <SiteFooter lang={lang} settings={root.settings} categories={root.categories} />
    </>
  );
}
