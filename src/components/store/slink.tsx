import { Link } from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";

/** Link for dynamic, language-prefixed paths built at runtime. */
export function SLink({ to, ...rest }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to: string }) {
  return <Link to={to as "/"} {...(rest as Record<string, unknown>)} />;
}
