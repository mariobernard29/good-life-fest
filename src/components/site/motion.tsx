"use client";

import Lenis from "lenis";
import Link from "next/link";
import { Fragment, createElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import { Photo } from "@/components/site/photo";
import type { Photo as PhotoData } from "@/content/images";
import { cn } from "@/lib/utils";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Añade `is-in` al elemento la primera vez que entra en pantalla. */
function useInView<T extends HTMLElement>(margin = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return ref;
}

/** Scroll suave en las páginas públicas (se desactiva con «reducir movimiento»). */
export function SmoothScroll() {
  useEffect(() => {
    if (reducedMotion()) return;
    const lenis = new Lenis({ duration: 1.15, anchors: { offset: -72 }, autoRaf: true });
    return () => lenis.destroy();
  }, []);
  return null;
}

/** Aparece al entrar en pantalla (una sola vez). */
export function Reveal({ children, className, delay = 0, as = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "article" }) {
  const ref = useInView<HTMLDivElement>();
  return createElement(as, { ref, className: cn("reveal", className), style: { transitionDelay: `${delay}ms` } }, children);
}

/** Titular cuyas palabras suben desde una máscara al entrar en pantalla. */
export function SplitText({
  text,
  as = "h2",
  className,
  delay = 0,
  italic,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  /** Palabras (en minúsculas, sin signos) que van en cursiva. */
  italic?: string[];
}) {
  const ref = useInView<HTMLHeadingElement>("0px 0px -8% 0px");
  const words = text.split(" ");
  const clean = (w: string) => w.toLowerCase().replace(/[.,;:!?¿¡«»"“”]/g, "");
  const italics = new Set(italic?.map(clean));
  return createElement(
    as,
    { ref, className: cn("split", className), "aria-label": text, style: { "--d": `${delay}ms` } as CSSProperties },
    words.map((w, i) => (
      <Fragment key={i}>
        <span className="w" aria-hidden>
          <span style={{ "--i": i } as CSSProperties} className={italics.has(clean(w)) ? "italic" : undefined}>
            {w}
          </span>
        </span>
        {i < words.length - 1 && " "}
      </Fragment>
    )),
  );
}

/** Imagen que se descubre de abajo hacia arriba con un leve zoom. */
export function ImageReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("img-reveal overflow-hidden", className)} style={{ transitionDelay: `${delay}ms` }}>
      <div className="h-full w-full" style={{ transitionDelay: `${delay}ms` }}>
        {children}
      </div>
    </div>
  );
}

/** Desplaza su contenido más lento que el scroll (parallax). */
export function Parallax({ children, className, speed = 0.12 }: { children: ReactNode; className?: string; speed?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reducedMotion()) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const o = outer.current;
      const i = inner.current;
      if (!o || !i) return;
      const r = o.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      i.style.transform = `translate3d(0, ${(-progress * speed * r.height).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);
  return (
    <div ref={outer} className={cn("relative overflow-hidden", className)}>
      <div ref={inner} className="absolute inset-x-0 -top-[14%] -bottom-[14%] will-change-transform">
        {children}
      </div>
    </div>
  );
}

/** Video silencioso en bucle que solo se reproduce mientras está visible. */
export function LoopVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || reducedMotion()) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.1 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-hidden className={cn("photo-grade h-full w-full object-cover", className)} />;
}

/** Montaje del héroe: varios clips que se funden entre sí. */
export function HeroReel({ clips, interval = 7000 }: { clips: { src: string; poster: string }[]; interval?: number }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (reducedMotion()) return;
    const id = setInterval(() => setActive((a) => (a + 1) % clips.length), interval);
    return () => clearInterval(id);
  }, [clips.length, interval]);

  useEffect(() => {
    if (reducedMotion()) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    refs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        timers.push(setTimeout(() => v.pause(), 1600));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <div className="hero-zoom absolute inset-0 -z-10" aria-hidden>
      {clips.map((c, i) => (
        <video
          key={c.src}
          ref={(el) => {
            refs.current[i] = el;
          }}
          src={c.src}
          poster={c.poster}
          muted
          loop
          playsInline
          preload={i === 0 ? "auto" : "metadata"}
          className={cn("hero-clip photo-grade absolute inset-0 h-full w-full object-cover", i === active && "is-active")}
        />
      ))}
    </div>
  );
}

/** Reproductor del video promocional: póster con botón y sonido al pulsar. */
export function PromoPlayer({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="group relative aspect-video overflow-hidden bg-forest">
      <video ref={ref} src={src} poster={poster} playsInline preload="none" controls={playing} onEnded={() => setPlaying(false)} className="h-full w-full object-cover" />
      {!playing && (
        <button
          type="button"
          onClick={() => {
            setPlaying(true);
            ref.current?.play();
          }}
          className="absolute inset-0 flex items-center justify-center bg-forest/30 transition-colors duration-500 hover:bg-forest/15"
          aria-label={label}
        >
          <span className="play-pulse flex size-20 items-center justify-center rounded-full bg-cream text-forest transition-transform duration-500 group-hover:scale-110 sm:size-28">
            <Play className="ml-1 size-7 fill-current sm:size-9" />
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * Galería horizontal: en escritorio la sección se fija y avanza de lado con el scroll;
 * en móvil es un carrusel deslizable.
 */
export function HorizontalScroll({ children, className, header }: { children: ReactNode; className?: string; header?: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    if (reducedMotion()) return;
    let raf = 0;
    const measure = () => {
      const t = track.current;
      if (!t || !mq.matches) {
        setHeight(null);
        if (t) t.style.transform = "";
        return;
      }
      setHeight(t.scrollWidth - window.innerWidth + window.innerHeight);
    };
    const update = () => {
      raf = 0;
      const o = outer.current;
      const t = track.current;
      if (!o || !t || !mq.matches) return;
      const r = o.getBoundingClientRect();
      const max = o.offsetHeight - window.innerHeight;
      const p = Math.min(Math.max(-r.top / Math.max(max, 1), 0), 1);
      t.style.transform = `translate3d(${(-p * (t.scrollWidth - window.innerWidth)).toFixed(1)}px, 0, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    mq.addEventListener("change", measure);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", measure);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={outer} className={cn("relative", className)} style={height ? { height } : undefined}>
      <div className={cn("flex flex-col justify-center overflow-hidden", height && "sticky top-0 h-svh")}>
        {header}
        <div
          ref={track}
          className={cn(
            "flex gap-4 px-5 will-change-transform sm:px-8 lg:gap-6 lg:px-12",
            !height && "snap-x snap-mandatory overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Lista editorial: en escritorio, al pasar el cursor por cada fila aparece su foto junto al puntero.
 */
export function HoverList({ items }: { items: { href: string; n: string; title: string; text: string; photo: PhotoData }[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  return (
    <div
      ref={wrap}
      className="relative"
      onMouseMove={(e) => {
        const w = wrap.current?.getBoundingClientRect();
        if (!w || !preview.current) return;
        preview.current.style.transform = `translate3d(${e.clientX - w.left}px, ${e.clientY - w.top}px, 0)`;
      }}
      onMouseLeave={() => setActive(null)}
    >
      <ul className="border-t border-forest/15">
        {items.map((it, i) => (
          <li key={it.href} onMouseEnter={() => setActive(i)}>
            <Link
              href={it.href}
              className="group grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b border-forest/15 py-6 transition-colors duration-500 hover:bg-forest/[0.03] sm:grid-cols-[5rem_1fr_1fr_auto] sm:py-8"
            >
              <span className="font-mono text-xs text-forest/50">{it.n}</span>
              <span className="display text-3xl text-forest transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3 sm:text-5xl">{it.title}</span>
              <span className="col-start-2 -mt-2 max-w-sm text-sm text-foreground/65 sm:col-start-auto sm:mt-0">{it.text}</span>
              <ArrowUpRight className="col-start-3 row-start-1 size-5 text-forest/40 transition-all duration-500 group-hover:rotate-45 group-hover:text-forest sm:col-start-auto sm:row-start-auto" />
            </Link>
          </li>
        ))}
      </ul>
      <div ref={preview} className="pointer-events-none absolute top-0 left-0 z-10 hidden lg:block" aria-hidden>
        {items.map((it, i) => (
          <div
            key={it.href}
            data-show={active === i}
            className="hover-preview absolute -top-36 left-10 h-72 w-56 overflow-hidden shadow-[0_30px_60px_-25px_rgba(39,50,34,0.55)]"
          >
            <Photo photo={it.photo} sizes="224px" className="h-full w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
