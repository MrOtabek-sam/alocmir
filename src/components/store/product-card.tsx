import { SLink } from "@/components/store/slink";
import { useState } from "react";

import { useCart } from "./cart";
import { T, money, prefix, type Lang } from "@/lib/store/i18n";
import type { Product } from "@/lib/store/db.server";

export function AddToCart({ product, lang, qty = 1, wide = false }: { product: Product; lang: Lang; qty?: number; wide?: boolean }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  const t = T[lang];
  const disabled = product.stock <= 0;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        add({ slug: product.slug, name: product.name, price: product.price, image: product.image }, qty);
        setDone(true);
        window.setTimeout(() => setDone(false), 1400);
      }}
      className={`${wide ? "h-14 w-full text-fs16" : "h-11 px-4 text-fs14"} inline-flex items-center justify-center gap-2 rounded-[12px] font-semibold transition active:translate-y-[1px] disabled:cursor-not-allowed disabled:bg-raised disabled:text-muted ${done ? "bg-ok text-ongold" : "bg-gold text-ongold hover:brightness-110"}`}
    >
      {disabled ? t.outOfStock : done ? t.added : t.addToCart}
    </button>
  );
}

export function StockNote({ stock, lang }: { stock: number; lang: Lang }) {
  const t = T[lang];
  if (stock <= 0) return <span className="text-fs13 font-semibold text-bad">{t.outOfStock}</span>;
  if (stock <= 5) return <span className="text-fs13 font-semibold text-warn">{t.lowStock}</span>;
  return <span className="text-fs13 font-semibold text-ok">{t.inStock}</span>;
}

export function ProductCard({ product, lang, large = false, eager = false }: { product: Product; lang: Lang; large?: boolean; eager?: boolean }) {
  const href = `${prefix(lang)}/product/${product.slug}`;
  const meta = [product.volume ? `${product.volume} ml` : null, product.abv ? `${product.abv}%` : null, product.origin].filter(Boolean).join(" · ");
  return (
    <article className={`group flex flex-col overflow-hidden rounded-[16px] border border-line bg-raised transition hover:border-line-strong ${large ? "md:col-span-2 md:flex-row" : ""}`}>
      <SLink to={href} className={`relative block overflow-hidden bg-surface ${large ? "md:w-1/2" : ""}`}>
        <img
          src={product.image}
          alt={`${product.name}, ${meta}`}
          loading={eager ? "eager" : "lazy"}
          width={600}
          height={600}
          className="aspect-square w-full object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        {product.oldPrice && product.oldPrice > product.price ? (
          <span className="absolute start-3 top-3 rounded-[6px] bg-gold px-2 py-0.5 text-fs12 font-semibold text-ongold">
            -{Math.round((1 - product.price / product.oldPrice) * 100)}%
          </span>
        ) : null}
      </SLink>
      <div className={`flex flex-1 flex-col gap-2 p-4 ${large ? "md:justify-center md:p-8" : ""}`}>
        <h3 className={`${large ? "text-fs24" : "text-fs17"} font-semibold leading-snug text-ink`}>
          <SLink to={href} className="hover:text-gold">{product.name}</SLink>
        </h3>
        <p className="text-fs13 text-muted">{meta}</p>
        {large && product.description ? <p className="max-w-[48ch] text-fs15 leading-relaxed text-muted">{product.description}</p> : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="flex flex-col">
            <span className="alc-tabular text-fs20 font-bold text-ink">{money(product.price, lang)}</span>
            {product.oldPrice && product.oldPrice > product.price ? (
              <span className="alc-tabular text-fs13 text-muted line-through">{money(product.oldPrice, lang)}</span>
            ) : <StockNote stock={product.stock} lang={lang} />}
          </div>
          <AddToCart product={product} lang={lang} />
        </div>
      </div>
    </article>
  );
}
