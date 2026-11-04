"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Aparece al entrar en pantalla (una sola vez). */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Video silencioso en bucle que solo se reproduce mientras está visible. */
export function LoopVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-hidden className={cn("h-full w-full object-cover", className)} />;
}

/** Montaje del héroe: varios clips que se funden entre sí. */
export function HeroReel({ clips, interval = 6000 }: { clips: { src: string; poster: string }[]; interval?: number }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => setActive((a) => (a + 1) % clips.length), interval);
    return () => clearInterval(id);
  }, [clips.length, interval]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    refs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        // Se pausa después del fundido para que no se congele en pantalla.
        setTimeout(() => v.pause(), 1400);
      }
    });
  }, [active]);

  return (
    <div className="absolute inset-0 -z-10" aria-hidden>
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
          className={cn("hero-clip absolute inset-0 h-full w-full object-cover", i === active && "is-active")}
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
    <div className="group relative aspect-video overflow-hidden rounded-[1.75rem] bg-ink shadow-[0_30px_80px_-30px_rgba(30,35,28,0.6)]">
      <video
        ref={ref}
        src={src}
        poster={poster}
        playsInline
        preload="none"
        controls={playing}
        onEnded={() => setPlaying(false)}
        className="h-full w-full object-cover"
      />
      {!playing && (
        <button
          type="button"
          onClick={() => {
            setPlaying(true);
            ref.current?.play();
          }}
          className="absolute inset-0 flex items-center justify-center bg-ink/25 transition-colors hover:bg-ink/10"
          aria-label={label}
        >
          <span className="play-pulse flex size-20 items-center justify-center rounded-full bg-cream text-ink transition-transform group-hover:scale-110 sm:size-24">
            <Play className="ml-1 size-8 fill-current" />
          </span>
        </button>
      )}
    </div>
  );
}

/** Sello circular con texto girando. */
export function SpinBadge({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("relative size-28 sm:size-32", className)} aria-hidden>
      <svg viewBox="0 0 100 100" className="spin-slow size-full">
        <defs>
          <path id="badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-current text-[9.5px] tracking-[0.32em] uppercase" style={{ fontFamily: "var(--font-sans)" }}>
          <textPath href="#badge-circle">{text}</textPath>
        </text>
      </svg>
      <span className="display absolute inset-0 flex items-center justify-center text-3xl text-sunset">✦</span>
    </div>
  );
}
