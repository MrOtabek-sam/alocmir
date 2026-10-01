import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";

import { StructuredData } from "@/components/StructuredData";
import { Breadcrumbs } from "@/components/store/catalog-page";
import { OpenBadge, SiteFooter, SiteHeader, waLink } from "@/components/store/chrome";
import { ProductCard } from "@/components/store/product-card";
import { SLink } from "@/components/store/slink";
import { AREA_PAGES, FAQ, SITE_URL, T, fill, homePath, isLang, langUrl, money, prefix, type Lang } from "@/lib/store/i18n";
import { ORG_ID, breadcrumb, ldJson, pageHead } from "@/lib/store/seo";
import { getHomeData } from "@/lib/store/store.functions";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/$lang/delivery/$area")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang) || !AREA_PAGES.some((a) => a.slug === params.area)) throw notFound();
  },
  loader: ({ params }) => getHomeData({ data: { lang: params.lang as Lang } }),
  head: ({ params, loaderData }) => {
    const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
    const area = AREA_PAGES.find((a) => a.slug === params.area);
    if (!area) return {};
    const name = area.name[lang];
    const eta = loaderData?.settings.delivery_eta ?? "45-60";
    const title = lang === "en" ? `Alcohol Delivery ${name} | Alcomir, ${eta} min` : `${fill(T[lang].areaH1, { area: name })} | Alcomir`;
    return pageHead({ lang, rest: `/delivery/${area.slug}`, title, description: fill(T[lang].areaIntro, { area: name, eta }) });
  },
  component: AreaRoute,
});

function AreaRoute() {
  const { lang: l, area: slug } = Route.useParams();
  const lang = l as Lang;
  const t = T[lang];
  const data = Route.useLoaderData();
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  const area = AREA_PAGES.find((a) => a.slug === slug)!;
  const name = area.name[lang];
  const s = data.settings;
  const h1 = fill(t.areaH1, { area: name });
  const intro = fill(t.areaIntro, { area: name, eta: s.delivery_eta });
  const crumbs = [
    { name: t.home, href: homePath(lang) },
    { name: t.delivery, href: `${prefix(lang)}/delivery` },
    { name, href: `${prefix(lang)}/delivery/${area.slug}` },
  ];
  const wa = waLink(s.whatsapp, `${t.waMessage} (${name})`);
  const schema = ldJson({
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb(crumbs.map((c) => ({ name: c.name, url: SITE_URL + (c.href === "/" ? "" : c.href) }))),
      {
        "@type": "Service",
        name: h1,
        serviceType: "Alcohol delivery",
        provider: { "@id": ORG_ID },
        areaServed: { "@type": "Place", name: `${area.name.en}, Dubai` },
        url: langUrl(lang, `/delivery/${area.slug}`),
        description: intro,
      },
    ],
  });
  return (
    <>
      <StructuredData json={schema} />
      <SiteHeader lang={lang} settings={s} />
      <main className="alc-glow-bg">
        <div className="mx-auto max-w-[1280px] px-4 pb-20 pt-8 md:px-8 md:pt-12">
          <Breadcrumbs items={crumbs} />
          <div className="mt-8 max-w-[760px]">
            <OpenBadge lang={lang} hours={s.hours} />
            <h1 className="alc-rise mt-5 text-fs40 leading-[1.05] text-ink md:text-fs56">{h1}</h1>
            <p className="mt-5 text-fs17 leading-relaxed text-muted">{intro}</p>
            <dl className="mt-8 grid grid-cols-3 divide-x divide-line rounded-[14px] border border-line bg-raised">
              {[[t.delivery, `${s.delivery_eta} ${t.etaMin}`], [t.deliveryFee, money(s.delivery_fee, lang)], [t.freeOver, money(s.free_delivery_min, lang)]].map(([k, v], i) => (
                <div key={i} className="p-4"><dt className="text-fs12 text-muted">{k}</dt><dd className="alc-tabular mt-1 text-fs17 font-semibold text-gold">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <SLink to={`${prefix(lang)}/catalog`} className="inline-flex h-12 items-center rounded-full bg-gold px-7 text-fs16 font-semibold text-ongold hover:bg-gold-light">{t.shop}</SLink>
              {wa ? <a href={wa} target="_blank" rel="noopener" data-wa="area" className="inline-flex h-12 items-center rounded-full border border-ink/30 px-6 text-fs16 font-semibold text-ink hover:border-gold hover:text-gold">{t.orderWhatsApp}</a> : null}
            </div>
          </div>

          <section aria-labelledby="area-best" className="mt-20">
            <h2 id="area-best" className="text-fs32 text-ink md:text-fs40">{t.bestSellers}: {name}</h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...data.packs.slice(0, 1), ...data.featured.slice(0, 7)].map((p) => <ProductCard key={p.slug} product={p} lang={lang} />)}
            </div>
          </section>

          <section aria-labelledby="area-faq" className="mt-20 max-w-[860px]">
            <h2 id="area-faq" className="text-fs32 text-ink">{t.faqTitle}</h2>
            <div className="mt-6 space-y-6">
              {FAQ[lang].map((f) => (
                <div key={f.q}><h3 className="text-fs18 font-semibold text-ink">{f.q}</h3><p className="mt-2 text-fs15 leading-relaxed text-muted">{f.a}</p></div>
              ))}
            </div>
          </section>

          <nav aria-label={t.areasTitle} className="mt-20">
            <h2 className="text-fs24 text-ink">{t.areasTitle}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {AREA_PAGES.filter((a) => a.slug !== area.slug).map((a) => (
                <li key={a.slug}><SLink to={`${prefix(lang)}/delivery/${a.slug}`} className="block rounded-full border border-line px-4 py-2 text-fs14 text-ink hover:border-gold hover:text-gold">{a.name[lang]}</SLink></li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <SiteFooter lang={lang} settings={s} categories={root.categories} />
    </>
  );
}
