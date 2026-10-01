import type { ReactNode } from "react";

import { SLink } from "./slink";

// Renders the small Markdown subset used by blog posts into React elements (never raw HTML):
// "## " / "### " headings, "- " and "1. " lists, "> " callouts, **bold** and [text](url) links.

function safeHref(url: string): string | null {
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (url.startsWith("https://")) return url;
  return null;
}

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let i = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={k} className="font-semibold text-ink">{m[1]}</strong>);
    } else {
      const href = safeHref(m[3]);
      const cls = "font-semibold text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold";
      if (!href) out.push(m[2]);
      else if (href.startsWith("/")) out.push(<SLink key={k} to={href} className={cls}>{m[2]}</SLink>);
      else out.push(<a key={k} href={href} target="_blank" rel="noopener nofollow" className={cls}>{m[2]}</a>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 text-fs17 leading-[1.75] text-ink/85">
      {blocks.map((b, i) => {
        const key = `b${i}`;
        const lines = b.split("\n").map((l) => l.trim());
        if (b.startsWith("### ")) return <h3 key={key} className="pt-2 text-fs22 font-semibold text-ink">{inline(b.slice(4), key)}</h3>;
        if (b.startsWith("## ")) return <h2 key={key} className="pt-6 text-fs30 leading-tight text-ink">{inline(b.slice(3), key)}</h2>;
        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={key} className="space-y-2 ps-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3"><span aria-hidden="true" className="mt-[0.7em] size-1.5 shrink-0 rotate-45 bg-gold" /><span>{inline(l.slice(2), `${key}-${j}`)}</span></li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={key} className="space-y-3">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-4">
                  <span className="alc-display alc-tabular w-6 shrink-0 text-fs22 leading-[1.4] text-gold">{j + 1}</span>
                  <span>{inline(l.replace(/^\d+\.\s/, ""), `${key}-${j}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        if (lines.every((l) => l.startsWith(">"))) {
          return (
            <aside key={key} className="rounded-[14px] border border-gold/40 bg-tint px-5 py-4 text-fs16 text-ink">
              {inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), key)}
            </aside>
          );
        }
        return <p key={key}>{inline(lines.join(" "), key)}</p>;
      })}
    </div>
  );
}
