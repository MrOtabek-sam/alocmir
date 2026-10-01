import type { Post } from "@/lib/store/blog.server";
import { T, prefix, type Lang } from "@/lib/store/i18n";
import { SLink } from "./slink";

export function postDate(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "ru" ? "ru-RU" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" })
    .format(new Date(iso));
}

export function PostCard({ post, lang, large = false }: { post: Post; lang: Lang; large?: boolean }) {
  const t = T[lang];
  return (
    <SLink to={`${prefix(lang)}/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-raised transition hover:border-gold/50">
      <div className="overflow-hidden">
        <img src={post.cover} alt="" loading="lazy" width={800} height={500}
          className={`w-full object-cover transition duration-700 group-hover:scale-[1.05] ${large ? "aspect-[16/9]" : "aspect-[16/10]"}`} />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-fs13 text-muted"><time dateTime={post.publishedAt}>{postDate(post.publishedAt, lang)}</time> · {post.minutes} {t.minRead}</p>
        <h3 className={`alc-display mt-3 leading-tight text-ink transition group-hover:text-gold ${large ? "text-fs30" : "text-fs22"}`}>{post.title}</h3>
        <p className="mt-3 line-clamp-3 text-fs15 leading-relaxed text-muted">{post.excerpt}</p>
        <span className="mt-auto pt-5 text-fs13 font-semibold uppercase tracking-[0.14em] text-gold">{t.readMore} →</span>
      </div>
    </SLink>
  );
}
