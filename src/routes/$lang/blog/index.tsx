import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";

import { StructuredData } from "@/components/StructuredData";
import { Breadcrumbs } from "@/components/store/catalog-page";
import { SiteFooter, SiteHeader } from "@/components/store/chrome";
import { PostCard } from "@/components/store/post-card";
import { DEFAULT_LANG, SITE_URL, T, homePath, isLang, langUrl, prefix, type Lang } from "@/lib/store/i18n";
import { ORG_ID, breadcrumb, ldJson, pageHead } from "@/lib/store/seo";
import { getBlog } from "@/lib/store/store.functions";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/$lang/blog/")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  loader: ({ params }) => getBlog({ data: { lang: params.lang as Lang } }),
  head: ({ params }) => {
    const lang = (isLang(params.lang) ? params.lang : DEFAULT_LANG) as Lang;
    return pageHead({ lang, rest: "/blog", title: `${T[lang].blogTitle} | Alcomir`, description: T[lang].blogIntro });
  },
  component: BlogIndex,
});

function BlogIndex() {
  const { lang: l } = Route.useParams();
  const lang = l as Lang;
  const t = T[lang];
  const { posts } = Route.useLoaderData();
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  const crumbs = [{ name: t.home, href: homePath(lang) }, { name: t.blog, href: `${prefix(lang)}/blog` }];
  const schema = ldJson({
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb(crumbs.map((c) => ({ name: c.name, url: SITE_URL + (c.href === "/" ? "" : c.href) }))),
      {
        "@type": "Blog",
        "@id": `${langUrl(lang, "/blog")}#blog`,
        name: t.blogTitle,
        description: t.blogIntro,
        url: langUrl(lang, "/blog"),
        inLanguage: lang,
        publisher: { "@id": ORG_ID },
        blogPost: posts.slice(0, 20).map((p) => ({
          "@type": "BlogPosting", headline: p.title, url: langUrl(lang, `/blog/${p.slug}`), datePublished: p.publishedAt,
        })),
      },
    ],
  });
  const [first, ...rest] = posts;
  return (
    <>
      <StructuredData json={schema} />
      <SiteHeader lang={lang} settings={root.settings} />
      <main className="alc-glow-bg">
        <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-8 md:px-8 md:pt-12">
          <Breadcrumbs items={crumbs} />
          <div className="mt-8 max-w-[760px]">
            <span aria-hidden="true" className="mb-5 block h-px w-14 bg-gold" />
            <h1 className="alc-rise text-fs40 leading-[1.05] text-ink md:text-fs56">{t.blogTitle}</h1>
            <p className="mt-5 text-fs17 leading-relaxed text-muted">{t.blogIntro}</p>
          </div>
          {first ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-2"><PostCard post={first} lang={lang} large /></div>
              {rest.map((p) => <PostCard key={p.slug} post={p} lang={lang} />)}
            </div>
          ) : (
            <p className="mt-12 text-fs17 text-muted">{t.blogEmpty}</p>
          )}
        </div>
      </main>
      <SiteFooter lang={lang} settings={root.settings} categories={root.categories} />
    </>
  );
}
