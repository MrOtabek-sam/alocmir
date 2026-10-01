import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";

import { CatalogPage } from "@/components/store/catalog-page";
import { T, isLang, type Lang } from "@/lib/store/i18n";
import { pageHead } from "@/lib/store/seo";
import { getCatalog } from "@/lib/store/store.functions";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/$lang/catalog/")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  loader: ({ params }) => getCatalog({ data: { lang: params.lang as Lang } }),
  head: ({ params }) => {
    const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
    return pageHead({ lang, rest: "/catalog", title: `${T[lang].catalogTitle} | Alocmir`, description: T[lang].catalogIntro });
  },
  component: Catalog,
});

function Catalog() {
  const { lang } = Route.useParams();
  const data = Route.useLoaderData();
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  return <CatalogPage lang={lang as Lang} categories={data.categories} category={null} products={data.products} settings={root.settings} chromeCats={root.categories} />;
}
