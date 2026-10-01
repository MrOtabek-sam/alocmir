import handler from "@tanstack/react-start/server-entry";

import { applySecurityHeaders } from "./lib/security-headers.server";

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname !== "/" && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.replace(/\/+$/, "");
      return Response.redirect(url.toString(), 301);
    }
    const response = await handler.fetch(request);
    return applySecurityHeaders(response);
  },
};
