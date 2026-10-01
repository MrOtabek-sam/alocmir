import { createFileRoute, getRouteApi, notFound, redirect } from "@tanstack/react-router";

import { HomePage } from "@/components/store/home-page";
import { DEFAULT_LANG, isLang, type Lang } from "@/lib/store/i18n";
import { HOME_HEAD } from "@/lib/store/home-head";
import { pageHead } from "@/lib/store/seo";
import { getHomeData } from "@/lib/store/store.functions";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/$lang/")({
  beforeLoad: ({ params }) => {
    // The default language's home page lives at "/".
    if (params.lang === DEFAULT_LANG) throw redirect({ to: "/", statusCode: 301 });
    if (!isLang(params.lang)) throw notFound();
  },
  loader: ({ params }) => getHomeData({ data: { lang: params.lang as Lang } }),
  head: ({ params }) => {
    const lang = (isLang(params.lang) ? params.lang : DEFAULT_LANG) as Lang;
    return pageHead({ lang, rest: "", ...HOME_HEAD[lang] });
  },
  component: LangHome,
});

function LangHome() {
  const { lang } = Route.useParams();
  const data = Route.useLoaderData();
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  return <HomePage lang={lang as Lang} data={data} chromeCats={root.categories} />;
}
