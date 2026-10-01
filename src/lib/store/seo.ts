import { BRAND, OG_LOCALE, SITE_URL, alternates, langUrl, type Lang } from "./i18n";

export function pageHead(opts: {
  lang: Lang; rest: string; title: string; description: string; image?: string; noindex?: boolean; type?: string;
  langs?: readonly Lang[]; published?: string; modified?: string;
}) {
  const url = langUrl(opts.lang, opts.rest);
  const image = opts.image ? (opts.image.startsWith("http") ? opts.image : SITE_URL + opts.image) : `${SITE_URL}/assets/brand/og.jpg`;
  const title = opts.title.length > 62 ? opts.title.slice(0, 60).trimEnd() : opts.title;
  return {
    meta: [
      { title },
      { name: "description", content: opts.description.slice(0, 160) },
      { name: "robots", content: opts.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large" },
      { property: "og:title", content: title },
      { property: "og:description", content: opts.description.slice(0, 200) },
      { property: "og:url", content: url },
      { property: "og:type", content: opts.type ?? "website" },
      { property: "og:site_name", content: BRAND },
      { property: "og:locale", content: OG_LOCALE[opts.lang] },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: opts.description.slice(0, 200) },
      { name: "twitter:image", content: image },
      ...(opts.published ? [{ property: "article:published_time", content: opts.published }] : []),
      ...(opts.modified ? [{ property: "article:modified_time", content: opts.modified }] : []),
    ],
    links: [{ rel: "canonical", href: url }, ...alternates(opts.rest, opts.langs)],
  };
}

export function ldJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export const ORG_ID = `${SITE_URL}/#org`;
export function orgGraph(lang: Lang, description: string) {
  return [
    {
      "@type": ["Organization", "LiquorStore"],
      "@id": ORG_ID,
      name: BRAND,
      url: SITE_URL,
      logo: `${SITE_URL}/assets/brand/mark.png`,
      image: `${SITE_URL}/assets/brand/og.jpg`,
      description,
      areaServed: { "@type": "City", name: "Dubai" },
      address: { "@type": "PostalAddress", addressLocality: "Dubai", addressCountry: "AE" },
      currenciesAccepted: "AED",
      paymentAccepted: "Cash, Credit Card",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: BRAND,
      url: SITE_URL,
      inLanguage: lang,
      publisher: { "@id": ORG_ID },
    },
  ];
}

export function breadcrumb(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}
