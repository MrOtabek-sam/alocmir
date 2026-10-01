import { useEffect, useRef, useState, type ReactNode } from "react";

// Encoded with a keyframe on every frame (-g 1) so any scroll position can be shown without decoding neighbours.
const SRC_DESKTOP = "/assets/brand/hero-scrub-1600.mp4";
const SRC_MOBILE = "/assets/brand/hero-scrub-720.mp4";
const SMOOTH = 0.12;
const FADE = 0.06;

export type Beat = { from: number; to: number; content: ReactNode };

function clamp01(n: number) {
  return Math.min(Math.max(n, 0), 1);
}

/** Opacity of a caption at scroll progress p: fades in after `from`, out before `to`. */
function beatOpacity(p: number, from: number, to: number) {
  const fadeIn = from <= 0 ? 1 : clamp01((p - from) / FADE);
  const fadeOut = to >= 1 ? 1 : clamp01((to - p) / FADE);
  return Math.min(fadeIn, fadeOut);
}

/**
 * A tall section whose inner screen stays pinned while the user scrolls through it.
 * Scroll progress drives the video's playback position and fades captions in and out;
 * once the video ends the page scrolls on to the next section.
 */
export function ScrollStory({ poster, header, beats, heightVh = 400 }: { poster: string; header: ReactNode; beats: Beat[]; heightVh?: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Load the whole file into memory so seeking is local, not a network range request per frame.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const SRC = window.matchMedia("(min-width: 768px)").matches ? SRC_DESKTOP : SRC_MOBILE;
    let url = "";
    let cancelled = false;
    const load = (init?: RequestInit) => fetch(SRC, init).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.blob();
    });
    // Large files can fail to write to the HTTP cache; retry without it before falling back to streaming.
    load()
      .catch(() => load({ cache: "no-store" }))
      .then((b) => {
        if (cancelled) return;
        url = URL.createObjectURL(b);
        v.src = url;
      })
      .catch(() => { if (!cancelled) v.src = SRC; });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let shown = 0;
    function tick() {
      const sec = sectionRef.current;
      if (sec) {
        const r = sec.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        const p = total > 0 ? clamp01(-r.top / total) : 0;
        shown += (p - shown) * SMOOTH;
        const v = videoRef.current;
        if (v && ready && Number.isFinite(v.duration) && !v.seeking) {
          const t = shown * (v.duration - 0.05);
          if (Math.abs(v.currentTime - t) > 0.015) v.currentTime = t;
        }
        sec.querySelectorAll<HTMLElement>("[data-beat]").forEach((el) => {
          const o = beatOpacity(shown, Number(el.dataset.from), Number(el.dataset.to));
          el.style.opacity = String(o);
          el.style.transform = `translateY(${(1 - o) * 28}px)`;
          el.style.visibility = o < 0.01 ? "hidden" : "visible";
        });
        if (hintRef.current) hintRef.current.style.opacity = String(1 - clamp01(shown / 0.05));
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: `${heightVh}vh` }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <img src={poster} alt="" fetchPriority="high" className="absolute inset-0 size-full object-cover object-[70%_50%]" />
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onLoadedData={(e) => {
            const v = e.currentTarget;
            // iOS only paints seeked frames after the video has played once.
            v.play().then(() => v.pause()).catch(() => {});
            setReady(true);
          }}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-surface/90 via-surface/50 to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-surface to-transparent" />
        <div className="relative z-10">{header}</div>
        <div className="absolute inset-0 flex items-end md:items-center">
          <div className="mx-auto grid w-full max-w-[1280px] px-4 pb-24 md:px-8 md:pb-0">
            {beats.map((b, i) => {
              const o = beatOpacity(0, b.from, b.to);
              return (
                <div key={i} data-beat data-from={b.from} data-to={b.to}
                  className="col-start-1 row-start-1 max-w-[640px] will-change-transform"
                  style={{ opacity: o, visibility: o < 0.01 ? "hidden" : "visible" }}>
                  {b.content}
                </div>
              );
            })}
          </div>
        </div>
        <div ref={hintRef} aria-hidden="true" className="absolute inset-x-0 bottom-6 flex justify-center">
          <span className="relative h-12 w-7 rounded-full border border-ink/40">
            <span className="alc-scroll-dot absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 rounded-full bg-gold" />
          </span>
        </div>
      </div>
    </section>
  );
}
