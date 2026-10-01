import { SLink } from "@/components/store/slink";
import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";

import { StructuredData } from "@/components/StructuredData";
import { Breadcrumbs } from "@/components/store/catalog-page";
import { SiteFooter, SiteHeader } from "@/components/store/chrome";
import { AREAS, FAQ, SITE_URL, T, homePath, isLang, langUrl, money, prefix, type Lang } from "@/lib/store/i18n";
import { breadcrumb, ldJson, pageHead } from "@/lib/store/seo";

const rootApi = getRouteApi("__root__");

const DESC: Record<Lang, string> = {
  en: "How alcohol delivery in Dubai works: areas, hours, fees, ID rules for tourists and residents, and payment on delivery.",
  ru: "Как работает доставка алкоголя в Дубае: районы, часы, стоимость, правила для туристов и резидентов, оплата при получении.",
};

export const Route = createFileRoute("/$lang/delivery/")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  head: ({ params }) => {
    const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
    return pageHead({ lang, rest: "/delivery", title: lang === "en" ? "Alcohol Delivery in Dubai: Areas, Hours, Fees | Alocmir" : `${T[lang].deliveryTitle} | Alocmir`, description: DESC[lang] });
  },
  component: DeliveryRoute,
});

function DeliveryRoute() {
  const { lang: l } = Route.useParams();
  const lang = l as Lang;
  const t = T[lang];
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  const s = root.settings;
  const faq = FAQ[lang];
  const crumbs = [{ name: t.home, href: homePath(lang) }, { name: t.delivery, href: `${prefix(lang)}/delivery` }];
  const schema = ldJson({
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb(crumbs.map((c) => ({ name: c.name, url: SITE_URL + (c.href === "/" ? "" : c.href) }))),
      { "@type": "FAQPage", "@id": `${langUrl(lang, "/delivery")}#faq`, mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  });
  return (
    <>
      <StructuredData json={schema} />
      <SiteHeader lang={lang} settings={root.settings} />
      <main className="alc-glow-bg">
        <div className="mx-auto max-w-[900px] px-4 pb-20 pt-8 md:px-8 md:pt-12">
          <Breadcrumbs items={crumbs} />
          <h1 className="alc-rise mt-5 text-fs36 font-bold leading-[1.05] tracking-tight text-ink md:text-fs52">{t.deliveryTitle}</h1>
          <p className="mt-5 max-w-[65ch] text-fs17 leading-relaxed text-muted">{t.deliveryIntro}</p>

          {s ? (
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] border border-line bg-line md:grid-cols-4">
              {[
                [t.hours, s.hours],
                [t.deliveryFee, money(s.delivery_fee, lang)],
                [t.freeOver, money(s.free_delivery_min, lang)],
                [t.minOrder, money(s.min_order, lang)],
              ].map(([k, v]) => (
                <div key={k} className="bg-raised p-5">
                  <dt className="text-fs13 text-muted">{k}</dt>
                  <dd className="alc-tabular mt-1.5 text-fs19 font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <section aria-labelledby="steps" className="mt-14">
            <h2 id="steps" className="text-fs26 font-bold text-ink md:text-fs32">{t.howTitle}</h2>
            <ol className="mt-6 space-y-4">
              {t.howSteps.map(([h, b], i) => (
                <li key={h} className="flex gap-4">
                  <span className="alc-tabular flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-tint text-fs14 font-bold text-gold">{i + 1}</span>
                  <p className="text-fs16 leading-relaxed text-muted"><strong className="font-semibold text-ink">{h}.</strong> {b}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="areas" className="mt-14">
            <h2 id="areas" className="text-fs26 font-bold text-ink md:text-fs32">{t.areasTitle}</h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {AREAS.filter((a) => a !== "Other").map((a) => (
                <li key={a} className="rounded-full border border-line px-3.5 py-1.5 text-fs14 text-ink">{a}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="dfaq" className="mt-14">
            <h2 id="dfaq" className="text-fs26 font-bold text-ink md:text-fs32">{t.faqTitle}</h2>
            <div className="mt-6 space-y-6">
              {faq.map((f) => (
                <div key={f.q}>
                  <h3 className="text-fs18 font-semibold text-ink">{f.q}</h3>
                  <p className="mt-2 max-w-[65ch] text-fs16 leading-relaxed text-muted">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          <SLink to={`${prefix(lang)}/catalog`} className="mt-14 inline-flex h-12 items-center rounded-full border-2 border-gold px-6 text-fs16 font-semibold text-gold transition hover:bg-gold hover:text-ongold">
            {t.shop}
          </SLink>
        </div>
      </main>
      <SiteFooter lang={lang} settings={s} categories={root.categories} />
    </>
  );
}
