import { SLink } from "@/components/store/slink";
import { useMemo, useState } from "react";

import { StructuredData } from "@/components/StructuredData";
import { SITE_URL, T, homePath, langUrl, prefix, type Lang } from "@/lib/store/i18n";
import { breadcrumb, ldJson } from "@/lib/store/seo";
import type { Category, Product, Settings } from "@/lib/store/db.server";
import { ProductCard } from "./product-card";
import { SiteFooter, SiteHeader } from "./chrome";

export function categoryH1(name: string, lang: Lang): string {
  if (lang === "ru") return `${name} с доставкой в Дубае`;
  return `${name} delivery in Dubai`;
}

export function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-fs13 text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((it, i) => (
          <li key={it.href} className="flex items-center gap-2">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {i < items.length - 1 ? <SLink to={it.href} className="hover:text-ink">{it.name}</SLink> : <span aria-current="page" className="text-ink">{it.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

type Sort = "popular" | "low" | "high";

export function CatalogPage({ lang, categories, category, products, settings, chromeCats }: {
  lang: Lang; categories: Category[]; category: Category | null; products: Product[];
  settings: Settings | null; chromeCats: { slug: string; name: string }[];
}) {
  const t = T[lang];
  const [sort, setSort] = useState<Sort>("popular");
  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, sort]);

  const h1 = category ? categoryH1(category.name, lang) : t.catalogTitle;
  const intro = category ? category.intro : t.catalogIntro;
  const rest = category ? `/catalog/${category.slug}` : "/catalog";
  const crumbs = [
    { name: t.home, href: homePath(lang) },
    { name: t.catalog, href: `${prefix(lang)}/catalog` },
    ...(category ? [{ name: category.name, href: `${prefix(lang)}/catalog/${category.slug}` }] : []),
  ];
  const schema = ldJson({
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb(crumbs.map((c) => ({ name: c.name, url: SITE_URL + (c.href === "/" ? "" : c.href) }))),
      {
        "@type": "CollectionPage",
        name: h1,
        description: intro,
        url: langUrl(lang, rest),
        inLanguage: lang,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
          itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: langUrl(lang, `/product/${p.slug}`), name: p.name })),
        },
      },
    ],
  });

  return (
    <>
      <StructuredData json={schema} />
      <SiteHeader lang={lang} settings={settings} />
      <main className="alc-glow-bg min-h-dvh">
        <div className="mx-auto max-w-[1240px] px-4 pb-20 pt-8 md:px-8 md:pt-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="alc-rise mt-5 max-w-[20ch] text-fs36 font-bold leading-[1.05] tracking-tight text-ink md:text-fs56">{h1}</h1>
          <p className="mt-4 max-w-[65ch] text-fs16 leading-relaxed text-muted">{intro}</p>

          <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <nav aria-label={t.catalog} className="alc-noscroll -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
              <SLink to={`${prefix(lang)}/catalog`}
                className={`shrink-0 rounded-full border px-4 py-2 text-fs14 font-semibold transition ${!category ? "border-gold bg-tint text-ink" : "border-line text-muted hover:text-ink"}`}>
                {t.allDrinks}
              </SLink>
              {categories.filter((c) => c.count > 0 || c.slug === category?.slug).map((c) => (
                <SLink key={c.slug} to={`${prefix(lang)}/catalog/${c.slug}`}
                  className={`shrink-0 rounded-full border px-4 py-2 text-fs14 font-semibold transition ${category?.slug === c.slug ? "border-gold bg-tint text-ink" : "border-line text-muted hover:text-ink"}`}>
                  {c.name}
                </SLink>
              ))}
            </nav>
            <label className="flex items-center gap-2 text-fs14 text-muted">
              <span className="sr-only">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}
                className="h-10 rounded-[10px] border border-line-strong bg-raised px-3 text-fs14 text-ink">
                <option value="popular">{t.sortPopular}</option>
                <option value="low">{t.sortLow}</option>
                <option value="high">{t.sortHigh}</option>
              </select>
            </label>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((p, i) => <ProductCard key={p.slug} product={p} lang={lang} eager={i < 4} />)}
          </div>
          {!sorted.length ? (
            <p className="mt-4 text-fs16 text-muted">
              {t.outOfStock}. <SLink to={`${prefix(lang)}/catalog`} className="font-semibold text-gold underline underline-offset-4">{t.viewAll}</SLink>
            </p>
          ) : null}
          {!sorted.length ? <p className="mt-10 text-muted">{t.outOfStock}</p> : null}
        </div>
      </main>
      <SiteFooter lang={lang} settings={settings} categories={chromeCats} />
    </>
  );
}
