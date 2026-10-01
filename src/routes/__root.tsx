import { SLink } from "@/components/store/slink";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { GA_ID, track } from "@/lib/analytics";

import appCss from "../styles.css?url";
import appMetaJson from "../app-meta.json";
import { CartProvider } from "@/components/store/cart";
import { AgeGate, FirstOrderPopup, WhatsAppFloat } from "@/components/store/chrome";
import { THEME_COLOR, homePath, langFromPath, T } from "@/lib/store/i18n";
import { getChrome } from "@/lib/store/store.functions";


type AppMeta = {
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  favicon_url?: string | null;
  og_video_url?: string | null;
  marketplace_cover_url?: string | null;
};
const appMeta = appMetaJson as AppMeta;

function buildHead(meta: AppMeta) {
  const title = meta.og_title ?? "Alocmir";
  const description = meta.og_description ?? "";
  return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title },
      { name: "description", content: description },
      { name: "author", content: "Alocmir" },
      { name: "theme-color", content: THEME_COLOR },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      ...(meta.og_image_url ? [{ property: "og:image", content: meta.og_image_url }, { name: "twitter:image", content: meta.og_image_url }] : []),
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" as const },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      ...(meta.favicon_url ? [{ rel: "icon", href: meta.favicon_url }, { rel: "apple-touch-icon", href: "/assets/brand/apple-touch-icon.png" }] : []),
    ],
  };
}

function NotFoundComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = langFromPath(pathname);
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="alc-tabular text-fs64 font-bold text-gold">404</p>
        <h1 className="mt-2 text-fs24 font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-fs15 text-muted">This bottle is not on our shelf.</p>
        <SLink to={homePath(lang)} className="mt-6 inline-flex h-11 items-center rounded-full bg-gold px-6 font-semibold text-ongold">
          {T[lang].home}
        </SLink>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-fs24 font-bold text-ink">This page didn't load</h1>
        <p className="mt-2 text-fs15 text-muted">Please try again in a moment.</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 h-11 rounded-full bg-gold px-6 font-semibold text-ongold"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => buildHead(appMeta),
  loader: ({ location }) => getChrome({ data: { lang: langFromPath(location.pathname) } }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = langFromPath(pathname);
  return (
    <html lang={lang} dir="ltr" style={{ colorScheme: "dark" }}>
      <head>
        <HeadContent />
        {GA_ID && !pathname.startsWith("/admin") ? (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`} />
            <script dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(GA_ID).replace(/</g, "\\u003c")});` }} />
          </>
        ) : null}
      </head>
      <body className="alc-body">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const chrome = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = langFromPath(pathname);

  useEffect(() => {
    track("pageview");
  }, [pathname]);

  // One listener covers every WhatsApp link on the site; data-wa names where it was clicked.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.("a[href*='wa.me/']");
      if (a) track("whatsapp_click", { label: a.getAttribute("data-wa") ?? "link" });
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Outlet />
        <WhatsAppFloat lang={lang} number={chrome?.settings?.whatsapp ?? ""} />
        <FirstOrderPopup lang={lang} />
        <AgeGate lang={lang} />
      </CartProvider>
    </QueryClientProvider>
  );
}
