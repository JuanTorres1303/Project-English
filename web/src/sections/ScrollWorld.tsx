"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ArrowDown, Play, SkipForward } from "@phosphor-icons/react";
import { ScrollTrigger, useGSAP } from "@/animations/gsap";
import { baseEase, lineRise, revealTimeline, revealUp } from "@/animations/motion";
import { introFilm } from "@/assets/media";
import { hero, scenes, transport } from "@/assets/content";
import { stops } from "@/assets/world";
import { useExperience } from "@/components/experience/ExperienceProvider";
import { setActiveScene } from "@/hooks/useActiveScene";
import { useVideoBuffer } from "@/hooks/useVideoBuffer";
import { CoverImage } from "@/components/ui/CoverImage";
import { Hotspot } from "@/components/ui/Hotspot";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { GrammarChip } from "@/components/ui/GrammarChip";

const N = stops.length;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** piecewise-linear map: scroll position -> journey position `w` (0 at stop 0, 1 at stop 1, ...) */
const piecewise = (y: number, keys: { y: number; v: number }[]) => {
  if (y <= keys[0].y) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (y <= b.y) return a.v + (b.v - a.v) * ((y - a.y) / (b.y - a.y || 1));
  }
  return keys[keys.length - 1].v;
};

/**
 * Each stop's scroll segment: [0, FLIGHT[0]) camera at rest on the stop (read its copy),
 * [FLIGHT[0], FLIGHT[1]] the flight clip plays forward with the scroll,
 * (FLIGHT[1], 1) camera at rest on the NEXT stop (its copy is already up).
 */
const FLIGHT: [number, number] = [0.25, 0.85];

/**
 * One fixed stage + one article per stop. The article only provides scroll distance and
 * its copy (sticky, bottom left). The stage shows exactly ONE picture at a time:
 * a stop's still, or the clip flying to the next stop. No crossfades between photos.
 */
export function ScrollWorld() {
  const { phase, scrollToId, setPhase, setFilmProgress, reduceMotion } = useExperience();
  const root = useRef<HTMLElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const frames = useRef<(HTMLDivElement | null)[]>([]);
  const clips = useRef<(HTMLVideoElement | null)[]>([]);
  const clipBoxes = useRef<(HTMLDivElement | null)[]>([]);
  const clipReady = useRef<boolean[]>(stops.map(() => false));
  const [current, setCurrent] = useState(0);
  const [filmDone, setFilmDone] = useState(false);
  const renderRef = useRef<() => void>(() => {});
  const entering = phase !== "loading";
  const ready = phase === "ready";

  useVideoBuffer(film, setFilmProgress);

  // ---- hero film: background of stop 0 while the UI arrives ----
  const endFilm = useCallback(() => {
    setFilmDone(true);
    setPhase("ready");
  }, [setPhase]);

  useEffect(() => {
    const v = film.current;
    if (!v || phase !== "intro") return;
    setFilmDone(false);
    v.currentTime = 0;
    v.play().catch(endFilm);
    v.addEventListener("ended", endFilm, { once: true });
    return () => v.removeEventListener("ended", endFilm);
  }, [phase, endFilm]);

  const skipFilm = () => {
    const v = film.current;
    if (v?.duration) {
      v.pause();
      v.currentTime = v.duration - 0.05;
    }
    endFilm();
  };

  // ---- load clips one by one as Blobs (always seekable), nearest first ----
  useEffect(() => {
    if (reduceMotion) return;
    let alive = true;
    const urls: string[] = [];
    (async () => {
      for (let i = 0; i < N; i++) {
        const src = stops[i].clipToNext?.src;
        const v = clips.current[i];
        if (!src || !v) continue;
        try {
          const blob = await fetch(src).then((r) => (r.ok ? r.blob() : Promise.reject(r.status)));
          if (!alive) return;
          const url = URL.createObjectURL(blob);
          urls.push(url);
          v.src = url;
          await new Promise<void>((res) => v.addEventListener("loadeddata", () => res(), { once: true }));
          await v.play().then(() => v.pause(), () => {}); // iOS paints seeked frames only after a play
          clipReady.current[i] = true;
          renderRef.current();
        } catch {
          /* clip missing: the stills still work */
        }
      }
    })();
    return () => {
      alive = false;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [reduceMotion]);

  // ---- scroll -> stage ----
  useGSAP(
    () => {
      const articles = Array.from(root.current!.querySelectorAll<HTMLElement>("[data-stop]"));
      const marks = articles.map((a) => ScrollTrigger.create({ trigger: a, start: "top top" }));
      const target = stops.map(() => 0);
      let w = 0;
      let lastCurrent = Number.NaN; // never equal to a real value, so the first render always syncs React state

      const seek = (i: number) => {
        const v = clips.current[i];
        if (!v || !v.duration || v.seeking) return;
        const t = target[i] * (v.duration - 0.04);
        if (Math.abs(v.currentTime - t) > 0.008) v.currentTime = t;
      };
      clips.current.forEach((v, i) => v?.addEventListener("seeked", () => seek(i)));

      let span: ScrollTrigger | null = null;
      const render = (st?: ScrollTrigger) => {
        const self = st ?? span;
        if (!self) return;
        const y = self.scroll();
        w = piecewise(y, [...marks.map((m, i) => ({ y: m.start, v: i })), { y: self.end, v: N }]);
        const seg = Math.min(N - 1, Math.floor(w));
        const f = w - seg;
        const hasNext = !!stops[seg].clipToNext && seg < N - 1;
        const p = hasNext ? clamp01((f - FLIGHT[0]) / (FLIGHT[1] - FLIGHT[0])) : 0; // flight progress
        const ready = clipReady.current[seg] && !reduceMotion;
        // arrived when the flight is complete (or, without a playable clip, half way through)
        const arrived = hasNext && (ready ? p >= 1 : p >= 0.5);
        const vis = arrived ? seg + 1 : seg;

        // exactly ONE picture on stage: the still where the camera rests, or the flight clip
        frames.current.forEach((el, i) => {
          if (el) el.style.visibility = i === vis ? "visible" : "hidden";
        });
        clips.current.forEach((v, i) => {
          if (!v) return;
          const flying = i === seg && ready && p > 0 && p < 1;
          v.style.visibility = flying ? "visible" : "hidden";
          if (flying) {
            target[i] = p;
            seek(i);
          }
        });

        // copy: shown while the camera rests on a stop, hidden during the flight
        const inFlight = hasNext && p > 0 && p < 1;
        const near = arrived ? seg + 1 : seg;
        const cur = inFlight ? -1 : near;
        if (cur !== lastCurrent) {
          lastCurrent = cur;
          setCurrent(cur);
        }
        setActiveScene(stops[p >= 0.5 ? Math.min(N - 1, seg + 1) : seg].id);
      };

      span = ScrollTrigger.create({ trigger: root.current, start: "top top", end: "bottom bottom", onUpdate: render, onRefresh: render });
      renderRef.current = () => render();
      render();
    },
    { scope: root, dependencies: [reduceMotion] },
  );

  const stopIndex = (id: string) => stops.findIndex((s) => s.id === id);
  const isCur = (id: string) => stopIndex(id) === current;

  return (
    <section ref={root} id="journey" aria-label="A journey through Bogotá" className="relative">
      {/* ================= STAGE ================= */}
      <div className="sticky top-0 h-[100lvh] overflow-hidden bg-ink-950">
        {stops.map((s, i) =>
          s.still ? (
            <CoverImage
              key={s.id}
              image={s.still}
              focusX={s.focusX ?? 0.5}
              priority={i < 2}
              boxRef={(el) => {
                frames.current[i] = el;
              }}
              style={{ visibility: i === 0 ? "visible" : "hidden" }}
            >
              {/* hero film, placed so that its LAST frame lands exactly on this HD photo */}
              {s.id === "identity" && !reduceMotion && introFilm.photoWindow && (
                <motion.div
                  className="pointer-events-none absolute"
                  style={{
                    left: `${(-introFilm.photoWindow.x / introFilm.photoWindow.w) * 100}%`,
                    top: `${(-introFilm.photoWindow.y / introFilm.photoWindow.h) * 100}%`,
                    width: `${100 / introFilm.photoWindow.w}%`,
                    height: `${100 / introFilm.photoWindow.h}%`,
                  }}
                  initial={false}
                  animate={{ opacity: filmDone ? 0 : 1 }}
                  transition={{ duration: filmDone ? 1.4 : 0, ease: baseEase }}
                  aria-hidden
                >
                  <video ref={film} className="size-full object-fill" src={introFilm.src} poster={introFilm.poster} muted playsInline preload="auto" disablePictureInPicture tabIndex={-1} />
                </motion.div>
              )}
              {s.id === "identity" && (
                <div className={`absolute inset-0 transition-opacity duration-500 ${current === 0 ? "opacity-100" : "opacity-0"}`}>
                  {ready &&
                    hero.hotspots.map((h, k) => (
                      <Hotspot key={h.label} label={h.label} detail={h.detail} icon={h.icon} at={h.at} delay={revealTimeline.hotspots + k * 0.18} />
                    ))}
                </div>
              )}
              {s.id === "transport" && (
                <div aria-hidden={!isCur("transport")}>
                  <svg className="pointer-events-none absolute inset-0 hidden h-full w-full md:block" aria-hidden>
                    {transport.cards.map((c, k) => (
                      <g
                        key={c.id}
                        className="transition-opacity duration-700"
                        style={{ opacity: isCur("transport") ? 1 : 0, transitionDelay: `${300 + k * 90}ms` }}
                      >
                        <circle cx={`${c.anchor.x * 100}%`} cy={`${c.anchor.y * 100}%`} r="4" fill="var(--color-leaf-300)" />
                        <circle cx={`${c.anchor.x * 100}%`} cy={`${c.anchor.y * 100}%`} r="10" fill="none" stroke="var(--color-leaf-300)" strokeOpacity=".35" />
                      </g>
                    ))}
                  </svg>
                  {transport.cards.map((c, k) => (
                    <div
                      key={c.id}
                      className="absolute hidden md:block"
                      style={{
                        left: `${c.anchor.x * 100}%`,
                        top: `${c.anchor.y * 100}%`,
                        transform: `translate(${c.side === "right" ? "22px" : "calc(-100% - 22px)"}, calc(-50% + ${c.offsetY ?? 0}px))`,
                      }}
                    >
                      <div
                        className="transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                          opacity: isCur("transport") ? 1 : 0,
                          transform: isCur("transport") ? "none" : "translateY(16px)",
                          transitionDelay: isCur("transport") ? `${250 + k * 90}ms` : "0ms",
                        }}
                      >
                        <FeatureCard card={c} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CoverImage>
          ) : null,
        )}

        {/* clips: each flies from its stop to the next */}
        {stops.map((s, i) =>
          s.clipToNext ? (
            <div
              key={`clip-${s.id}`}
              ref={(el) => {
                clipBoxes.current[i] = el;
              }}
              className="cover-box origin-top-left"
              style={{ ["--ar" as string]: (s.clipToNext.width / s.clipToNext.height).toFixed(4), ["--fx" as string]: s.focusX ?? 0.5 }}
              aria-hidden
            >
              <video
                ref={(el) => {
                  clips.current[i] = el;
                }}
                className="size-full object-cover"
                style={{ visibility: "hidden" }}
                muted
                playsInline
                preload="none"
                disablePictureInPicture
                tabIndex={-1}
              />
            </div>
          ) : null,
        )}

        {/* legibility scrims (fade in with the UI) */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{ opacity: entering ? 1 : 0 }}
          transition={{ duration: 2, ease: baseEase, delay: entering ? revealTimeline.scrim : 0 }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(11_15_20/0.8)_0%,rgb(11_15_20/0.42)_32%,transparent_60%),linear-gradient(0deg,rgb(11_15_20/0.75)_0%,transparent_34%)]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgb(11_15_20/0.7),transparent)]" />
        </motion.div>

        {phase === "intro" && !reduceMotion && (
          <button
            onClick={skipFilm}
            className="glass absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 z-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-fog-200 transition duration-300 hover:text-fog-50 active:scale-[0.98]"
          >
            Skip intro <SkipForward size={14} />
          </button>
        )}

        {/* mobile: transport cards as one swipeable row */}
        <div
          className={`absolute inset-x-0 top-24 transition-opacity duration-700 md:hidden ${isCur("transport") ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {transport.cards.map((c) => (
              <FeatureCard key={c.id} card={c} compact />
            ))}
          </div>
        </div>
      </div>

      {/* ================= STOPS (scroll distance + copy) ================= */}
      <div className="relative z-10 -mt-[100lvh]">
        {stops.map((s) => (
          <article
            key={s.id}
            id={`anchor-${s.id}`}
            data-stop
            className={`pointer-events-none flex flex-col justify-end ${s.length}`}
          >
            <div
              className={`pointer-events-auto sticky bottom-0 w-full transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isCur(s.id) ? "opacity-100" : "pointer-events-none translate-y-8 opacity-0"
              }`}
            >
              <div className="mx-auto w-full max-w-[1400px] px-5 pb-12 md:px-8 md:pb-16">
                {s.id === "identity" ? (
                  <HeroCopy
                    entering={entering}
                    onExplore={() => (ready ? scrollToId("anchor-transport", { duration: 4.5 }) : skipFilm())}
                    onWatch={() => {
                      window.scrollTo(0, 0);
                      setPhase("intro");
                    }}
                  />
                ) : s.id === "transport" ? (
                  <SceneCopy title={transport.title} body={transport.body} grammar={transport.grammar} />
                ) : (
                  (() => {
                    const z = scenes.find((x) => x.id === s.id);
                    return z ? <SceneCopy title={z.title} body={z.body} grammar={z.grammar} facts={z.facts} /> : null;
                  })()
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HeroCopy({ entering, onExplore, onWatch }: { entering: boolean; onExplore: () => void; onWatch: () => void }) {
  return (
    <motion.div initial="hidden" animate={entering ? "shown" : "hidden"} className="pb-[10lvh]">
      <h1 className="max-w-[680px]">
        <span className="block overflow-hidden pb-1">
          <motion.span variants={lineRise} custom={revealTimeline.kicker} className="block text-2xl font-normal text-fog-200 md:text-4xl">
            {hero.kicker}
          </motion.span>
        </span>
        <span className="block overflow-hidden pb-3">
          <motion.span
            variants={lineRise}
            custom={revealTimeline.title}
            className="block bg-[linear-gradient(90deg,#ffffff_0%,#9b9b9b_100%)] bg-clip-text text-7xl font-bold leading-none tracking-tight text-transparent md:text-8xl xl:text-9xl"
          >
            {hero.title}
          </motion.span>
        </span>
      </h1>
      <motion.p variants={revealUp} custom={revealTimeline.body} className="mt-6 max-w-[680px] text-base text-fog-200 [text-wrap:pretty] md:max-w-[46ch] md:text-lg">
        {hero.body}
      </motion.p>
      <motion.div variants={revealUp} custom={revealTimeline.ctas} className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={onExplore}
          className="inline-flex items-center gap-2 rounded-full bg-leaf-500 px-6 py-3 text-base font-semibold text-ink-950 shadow-[0_10px_30px_-10px_rgb(16_185_129/0.6)] transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-leaf-300 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-300"
        >
          {hero.primary} <ArrowDown size={16} weight="bold" />
        </button>
        <button
          onClick={onWatch}
          className="glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-fog-50 transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-300"
        >
          <Play size={14} weight="fill" /> {hero.secondary}
        </button>
      </motion.div>
    </motion.div>
  );
}

function SceneCopy({ title, body, grammar, facts }: { title: string; body: string; grammar: string; facts?: string[] }) {
  return (
    <div className="glass-strong max-w-lg rounded-2xl p-6 md:p-8">
      <h2 className="text-3xl font-semibold tracking-tight text-fog-50 [text-wrap:balance] md:text-4xl">{title}</h2>
      <p className="mt-4 text-base text-fog-200 [text-wrap:pretty] md:text-lg">{body}</p>
      {facts && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {facts.map((f) => (
            <li key={f} className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-fog-50">
              {f}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-5">
        <GrammarChip>{grammar}</GrammarChip>
      </div>
    </div>
  );
}
