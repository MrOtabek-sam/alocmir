import { createFileRoute, getRouteApi, notFound, redirect } from "@tanstack/react-router";

import { StructuredData } from "@/components/StructuredData";
import { Breadcrumbs } from "@/components/store/catalog-page";
import { SiteFooter, SiteHeader, waLink } from "@/components/store/chrome";
import { PostCard, postDate } from "@/components/store/post-card";
import { ProductCard } from "@/components/store/product-card";
import { RichText } from "@/components/store/rich-text";
import { SLink } from "@/components/store/slink";
import { DEFAULT_LANG, SITE_URL, T, fill, homePath, isLang, langUrl, prefix, type Lang } from "@/lib/store/i18n";
import { ORG_ID, breadcrumb, ldJson, pageHead } from "@/lib/store/seo";
import { getBlogPost } from "@/lib/store/store.functions";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/$lang/blog/$slug")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  loader: async ({ params }) => {
    const r = await getBlogPost({ data: { lang: params.lang as Lang, slug: params.slug } });
    if (r.missing) throw redirect({ to: `/${params.lang}/blog` as "/", statusCode: 302 });
    return r;
  },
  head: ({ params, loaderData }) => {
    const lang = (isLang(params.lang) ? params.lang : DEFAULT_LANG) as Lang;
    const post = loaderData?.post;
    if (!post) return {};
    return pageHead({
      lang, rest: `/blog/${post.slug}`, type: "article", langs: post.langs, image: post.cover,
      title: post.metaTitle || `${post.title} | Alocmir`, description: post.metaDesc || post.excerpt,
      published: post.publishedAt, modified: post.updatedAt,
    });
  },
  component: PostRoute,
});

function PostRoute() {
  const { lang: l } = Route.useParams();
  const lang = l as Lang;
  const t = T[lang];
  const data = Route.useLoaderData();
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  if (data.missing) return null;
  const { post, products, related } = data;
  const s = root.settings;
  const url = langUrl(lang, `/blog/${post.slug}`);
  const crumbs = [
    { name: t.home, href: homePath(lang) },
    { name: t.blog, href: `${prefix(lang)}/blog` },
    { name: post.title, href: `${prefix(lang)}/blog/${post.slug}` },
  ];
  const wa = s ? waLink(s.whatsapp, t.waMessage) : "";
  const schema = ldJson({
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb(crumbs.map((c) => ({ name: c.name, url: SITE_URL + (c.href === "/" ? "" : c.href) }))),
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: post.title,
        description: post.metaDesc || post.excerpt,
        image: post.cover.startsWith("http") ? post.cover : SITE_URL + post.cover,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        inLanguage: lang,
        mainEntityOfPage: url,
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        isPartOf: { "@id": `${langUrl(lang, "/blog")}#blog` },
      },
    ],
  });
  return (
    <>
      <StructuredData json={schema} />
      <SiteHeader lang={lang} settings={s} />
      <main className="alc-glow-bg">
        <article className="mx-auto max-w-[1280px] px-4 pb-20 pt-8 md:px-8 md:pt-12">
          <Breadcrumbs items={crumbs} />
          <header className="mx-auto mt-10 max-w-[760px]">
            <p className="text-fs14 text-muted"><time dateTime={post.publishedAt}>{postDate(post.publishedAt, lang)}</time> · {post.minutes} {t.minRead}</p>
            <h1 className="alc-rise mt-4 text-fs40 leading-[1.06] text-ink md:text-fs52">{post.title}</h1>
            <p className="mt-5 text-fs19 leading-relaxed text-ink/75">{post.excerpt}</p>
          </header>
          <img src={post.cover} alt={post.title} fetchPriority="high" width={1280} height={640}
            className="mx-auto mt-10 aspect-[2/1] w-full max-w-[1040px] rounded-[20px] border border-line object-cover" />
          <div className="mx-auto mt-12 max-w-[720px]">
            <RichText source={post.body} />
          </div>

          {products.length ? (
            <section aria-labelledby="post-products" className="mt-20">
              <h2 id="post-products" className="text-fs32 text-ink md:text-fs40">{t.shopThese}</h2>
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((p) => <ProductCard key={p.slug} product={p} lang={lang} />)}
              </div>
            </section>
          ) : null}

          <aside className="mx-auto mt-16 max-w-[860px] rounded-[20px] border border-gold/40 bg-raised p-8 text-center md:p-10">
            <p className="alc-display text-fs30 leading-tight"><span className="alc-gold-text">{t.tagline}</span></p>
            <p className="mt-3 text-fs16 text-muted">{s ? fill(t.trust[0], { eta: s.delivery_eta }) : null} · {t.trust[1]}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <SLink to={`${prefix(lang)}/catalog`} className="inline-flex h-12 items-center rounded-full bg-gold px-7 text-fs16 font-semibold text-ongold hover:bg-gold-light">{t.shop}</SLink>
              {wa ? <a href={wa} target="_blank" rel="noopener" data-wa="blog" className="inline-flex h-12 items-center rounded-full border border-ink/30 px-6 text-fs16 font-semibold text-ink hover:border-gold hover:text-gold">{t.orderWhatsApp}</a> : null}
            </div>
          </aside>

          {related.length ? (
            <section aria-labelledby="post-related" className="mt-20">
              <h2 id="post-related" className="text-fs32 text-ink">{t.morePosts}</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {related.map((p) => <PostCard key={p.slug} post={p} lang={lang} />)}
              </div>
            </section>
          ) : null}
        </article>
      </main>
      <SiteFooter lang={lang} settings={s} categories={root.categories} />
    </>
  );
}
