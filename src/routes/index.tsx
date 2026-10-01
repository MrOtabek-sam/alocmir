import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { HomePage } from "@/components/store/home-page";
import { DEFAULT_LANG } from "@/lib/store/i18n";
import { HOME_HEAD } from "@/lib/store/home-head";
import { pageHead } from "@/lib/store/seo";
import { getHomeData } from "@/lib/store/store.functions";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  loader: () => getHomeData({ data: { lang: DEFAULT_LANG } }),
  head: () => pageHead({ lang: DEFAULT_LANG, rest: "", ...HOME_HEAD[DEFAULT_LANG] }),
  component: Index,
});

function Index() {
  const data = Route.useLoaderData();
  const root = rootApi.useLoaderData() ?? { settings: null, categories: [] as { slug: string; name: string }[] };
  return <HomePage lang={DEFAULT_LANG} data={data} chromeCats={root.categories} />;
}
