import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";

import { CatalogPage, categoryH1 } from "@/components/store/catalog-page";
import { isLang, type Lang } from "@/lib/store/i18n";
import { pageHead } from "@/lib/store/seo";
import { getCatalog } from "@/lib/store/store.functions";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/$lang/catalog/$category")({
  beforeLoad: ({ params }) => {
    if (!isLang(params.lang)) throw notFound();
  },
  loader: ({ params }) => getCatalog({ data: { lang: params.lang as Lang, category: params.category } }),
  head: ({ params, loaderData }) => {
    const lang = (isLang(params.lang) ? params.lang : "en") as Lang;
    const c = loaderData?.category;
    if (!c) return {};
    return pageHead({
      lang, rest: `/catalog/${c.slug}`, title: `${categoryH1(c.name, lang)} | Alocmir`,
      description: c.intro, image: c.image,
    });
  },
  component: CategoryRoute,
});

function CategoryRoute() {
  const { lang } = Route.useParams();
  const data = Route.useLoaderData();
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  return <CatalogPage lang={lang as Lang} categories={data.categories} category={data.category} products={data.products} settings={root.settings} chromeCats={root.categories} />;
}
