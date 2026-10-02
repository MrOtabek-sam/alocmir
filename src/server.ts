import handler from "@tanstack/react-start/server-entry";

import { SITE_URL } from "./lib/store/i18n";
import { applySecurityHeaders } from "./lib/security-headers.server";

const SITE_HOST = new URL(SITE_URL).host;

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    // Production *.vercel.app addresses would be duplicate copies of the site in Google: send them to the real domain.
    if (process.env.VERCEL_ENV === "production" && url.host.endsWith(".vercel.app") && url.host !== SITE_HOST) {
      return Response.redirect(SITE_URL + url.pathname + url.search, 301);
    }
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
      return Response.redirect(url.toString(), 301);
    }
    const response = await handler.fetch(request);
    return applySecurityHeaders(response);
  },
};
