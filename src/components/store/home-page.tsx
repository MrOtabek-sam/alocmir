import { StructuredData } from "@/components/StructuredData";
import { SLink } from "@/components/store/slink";
import { AREA_PAGES, FAQ, T, fill, langUrl, money, prefix, type Lang } from "@/lib/store/i18n";
import { ldJson, orgGraph } from "@/lib/store/seo";
import type { Category, Product, Settings } from "@/lib/store/db.server";
import { ProductCard } from "./product-card";
import { ScrollStory } from "./scroll-story";
import { PostCard } from "./post-card";
import type { Post } from "@/lib/store/blog.server";
import { AnnouncementBar, OpenBadge, SiteFooter, SiteHeader, waLink } from "./chrome";

export type HomeData = { categories: Category[]; featured: Product[]; packs: Product[]; settings: Settings; posts: Post[] };

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionHead({ id, title, sub }: { id: string; title: string; sub?: string }) {
  return (
    <div className="max-w-[720px]">
      <span aria-hidden="true" className="mb-4 block h-px w-14 bg-gold" />
      <h2 id={id} className="text-fs36 leading-[1.08] text-ink md:text-fs48">{title}</h2>
      {sub ? <p className="mt-4 text-fs16 leading-relaxed text-muted">{sub}</p> : null}
    </div>
  );
}

export function HomePage({ lang, data, chromeCats }: { lang: Lang; data: HomeData; chromeCats: { slug: string; name: string }[] }) {
  const t = T[lang];
  const s = data.settings;
  const faq = FAQ[lang];
  const wa = waLink(s.whatsapp, t.waMessage);
  const schema = ldJson({
    "@context": "https://schema.org",
    "@graph": [
      ...orgGraph(lang, t.deliveryIntro),
      { "@type": "FAQPage", "@id": `${langUrl(lang, "")}#faq`, mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      { "@type": "ItemList", name: t.bestSellers, itemListElement: data.featured.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: langUrl(lang, `/product/${p.slug}`), name: p.name })) },
    ],
  });
  const trust = t.trust.map((x) => fill(x, { eta: s.delivery_eta }));
  const cats = data.categories.filter((c) => c.count > 0 && c.slug !== "packs" && c.slug !== "mixers");

  return (
    <>
      <StructuredData json={schema} />
      <AnnouncementBar lang={lang} settings={s} />
      {/* Hero: pinned video that plays as you scroll, with captions fading in over it */}
      <ScrollStory
        poster="/assets/brand/hero-poster.jpg"
        header={<SiteHeader lang={lang} overlay />}
        beats={[
          {
            from: 0, to: 0.24,
            content: (
              <>
                <OpenBadge lang={lang} hours={s.hours} />
                <h1 className="mt-6 text-fs46 leading-[1.02] text-ink md:text-fs64">
                  <span className="alc-gold-text">{t.heroTitle}</span>
                </h1>
                <p className="mt-5 max-w-[48ch] text-fs17 leading-relaxed text-ink/80">{t.heroSub}</p>
              </>
            ),
          },
          {
            from: 0.3, to: 0.52,
            content: (
              <>
                <span aria-hidden="true" className="mb-5 block h-px w-14 bg-gold" />
                <p className="alc-display text-fs46 leading-[1.04] text-ink md:text-fs64">{trust[0]}</p>
                <p className="mt-5 text-fs17 leading-relaxed text-ink/80">{trust[2]} · {trust[3]}</p>
              </>
            ),
          },
          {
            from: 0.56, to: 0.78,
            content: (
              <>
                <span aria-hidden="true" className="mb-5 block h-px w-14 bg-gold" />
                <p className="alc-display text-fs46 leading-[1.04] text-ink md:text-fs64">{t.packsTitle}</p>
                <p className="mt-5 max-w-[48ch] text-fs17 leading-relaxed text-ink/80">{t.packsSub}</p>
              </>
            ),
          },
          {
            from: 0.82, to: 1,
            content: (
              <>
                <p className="alc-display text-fs46 leading-[1.04] md:text-fs64"><span className="alc-gold-text">{t.tagline}</span></p>
                <p className="mt-5 text-fs17 leading-relaxed text-ink/80">{trust[1]}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <SLink to={`${prefix(lang)}/catalog`}
                    className="group inline-flex h-13 items-center gap-3 rounded-full bg-gold px-7 py-3.5 text-fs16 font-semibold text-ongold transition hover:bg-gold-light active:scale-[0.98]">
                    {t.shop}
                    <span className="transition-transform group-hover:translate-x-1"><Arrow /></span>
                  </SLink>
                  {wa ? (
                    <a href={wa} target="_blank" rel="noopener" data-wa="home"
                      className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-6 py-3.5 text-fs16 font-semibold text-ink backdrop-blur transition hover:border-gold hover:text-gold">
                      {t.orderWhatsApp}
                    </a>
                  ) : null}
                </div>
              </>
            ),
          },
        ]}
      />

      {/* Trust strip */}
      <section aria-label="Why Alocmir" className="border-y border-line bg-raised">
        <ul className="mx-auto grid max-w-[1280px] grid-cols-2 gap-px md:grid-cols-4">
          {trust.map((x) => (
            <li key={x} className="flex items-center justify-center gap-3 px-4 py-5 text-center text-fs14 font-semibold text-ink">
              <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold" />
              {x}
            </li>
          ))}
        </ul>
      </section>

      <main>
        {/* Categories: editorial mosaic */}
        <section aria-labelledby="cats" className="alc-glow-bg py-20 md:py-28">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            <SectionHead id="cats" title={t.homeH2Cats} sub={t.catalogIntro} />
            <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
              {cats.map((c, i) => (
                <li key={c.slug} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                  <SLink to={`${prefix(lang)}/catalog/${c.slug}`} className="group relative block h-full overflow-hidden rounded-[18px] border border-line">
                    <img src={c.image} alt={c.name} loading="lazy" width={800} height={800}
                      className={`w-full object-cover transition duration-1000 group-hover:scale-[1.06] ${i === 0 ? "aspect-square h-full" : "aspect-[4/5]"}`} />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/10 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                      <span className={`alc-display text-ink ${i === 0 ? "text-fs36" : "text-fs22"}`}>{c.name}</span>
                      <span className="flex size-9 items-center justify-center rounded-full border border-gold/60 text-gold transition group-hover:bg-gold group-hover:text-ongold"><Arrow /></span>
                    </span>
                  </SLink>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Party packs: horizontal rail */}
        {data.packs.length ? (
          <section aria-labelledby="packs" className="border-t border-line bg-surface py-20 md:py-28">
            <div className="mx-auto max-w-[1280px] px-4 md:px-8">
              <SectionHead id="packs" title={t.packsTitle} sub={t.packsSub} />
            </div>
            <ul className="alc-noscroll mt-12 flex snap-x gap-5 overflow-x-auto px-4 pb-2 md:px-[max(2rem,calc((100vw-1280px)/2+2rem))]">
              {data.packs.map((p) => (
                <li key={p.slug} className="w-[300px] shrink-0 snap-start md:w-[380px]"><ProductCard product={p} lang={lang} /></li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Best sellers */}
        <section aria-labelledby="best" className="alc-glow-bg border-t border-line py-20 md:py-28">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            <SectionHead id="best" title={t.bestSellers} sub={t.bestSellersSub} />
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.featured.slice(0, 8).map((p, i) => <ProductCard key={p.slug} product={p} lang={lang} eager={i < 2} />)}
            </div>
            <SLink to={`${prefix(lang)}/catalog`} className="mt-12 inline-flex items-center gap-2 text-fs15 font-semibold uppercase tracking-[0.14em] text-gold hover:text-gold-light">
              {t.viewAll} <Arrow />
            </SLink>
          </div>
        </section>

        {/* How it works: split */}
        <section aria-labelledby="how" className="border-t border-line bg-surface py-20 md:py-28">
          <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-4 md:grid-cols-2 md:px-8">
            <img src="/assets/products/whisky.jpg" alt={t.deliveryTitle} loading="lazy" width={900} height={900} className="aspect-square w-full rounded-[18px] border border-line object-cover" />
            <div>
              <SectionHead id="how" title={t.howTitle} sub={t.deliveryIntro} />
              <ol className="mt-8 divide-y divide-line border-y border-line">
                {t.howSteps.map(([h, b], i) => (
                  <li key={h} className="flex gap-5 py-5">
                    <span className="alc-display alc-tabular w-8 shrink-0 text-fs30 leading-none text-gold">{i + 1}</span>
                    <div>
                      <h3 className="text-fs17 font-semibold text-ink">{h}</h3>
                      <p className="mt-1 text-fs15 leading-relaxed text-muted">{b}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-fs14 text-muted">
                {t.freeOver} <span className="alc-tabular font-semibold text-gold">{money(s.free_delivery_min, lang)}</span>
                {s.hours ? <> · {t.hours}: <span className="alc-tabular text-ink">{s.hours}</span></> : null}
              </p>
            </div>
          </div>
        </section>

        {/* Areas: link grid (local SEO) */}
        <section aria-labelledby="areas" className="border-t border-line bg-raised py-20 md:py-24">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8">
            <SectionHead id="areas" title={t.areasTitle} sub={t.areasSub} />
            <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
              {AREA_PAGES.map((a) => (
                <li key={a.slug}>
                  <SLink to={`${prefix(lang)}/delivery/${a.slug}`} className="flex items-center justify-between border-b border-line py-3.5 text-fs15 text-ink transition hover:text-gold">
                    {a.name[lang]} <Arrow />
                  </SLink>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Blog */}
        {data.posts.length ? (
          <section aria-labelledby="home-blog" className="border-t border-line bg-surface py-20 md:py-28">
            <div className="mx-auto max-w-[1280px] px-4 md:px-8">
              <SectionHead id="home-blog" title={t.latestPosts} sub={t.blogIntro} />
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {data.posts.map((p) => <PostCard key={p.slug} post={p} lang={lang} />)}
              </div>
              <SLink to={`${prefix(lang)}/blog`} className="mt-10 inline-flex items-center gap-2 text-fs15 font-semibold uppercase tracking-[0.14em] text-gold hover:text-gold-light">
                {t.blog} <Arrow />
              </SLink>
            </div>
          </section>
        ) : null}

        {/* FAQ */}
        <section aria-labelledby="faq" className="border-t border-line bg-surface py-20 md:py-28">
          <div className="mx-auto max-w-[880px] px-4 md:px-8">
            <SectionHead id="faq" title={t.faqTitle} />
            <div className="mt-10 divide-y divide-line border-y border-line">
              {faq.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-fs17 font-semibold text-ink">
                    <h3>{f.q}</h3>
                    <span aria-hidden="true" className="text-fs24 text-gold transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-[65ch] text-fs15 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} settings={s} categories={chromeCats} />
    </>
  );
}
