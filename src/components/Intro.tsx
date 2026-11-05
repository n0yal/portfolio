import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { content } from "../content";
import { useReducedMotion } from "../lib/hooks";
import { TitleMark } from "./TitleMark";

type Metrics = {
  left: number;
  top: number;
  width: number;
  height: number;
  startX: number;
  startY: number;
};

type Phase = "ghost" | "wipe" | "move";

export function Intro({ onComplete }: { onComplete: () => void }) {
  const reducedMotion = useReducedMotion();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [fill, setFill] = useState(0);
  const [phase, setPhase] = useState<Phase>("ghost");
  const completeRef = useRef(onComplete);
  const finishedRef = useRef(false);
  completeRef.current = onComplete;

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    completeRef.current();
  };
  const finishRef = useRef(finish);
  finishRef.current = finish;

  useEffect(() => {
    if (reducedMotion) {
      finishRef.current();
      return;
    }

    let cancelled = false;
    let frame = 0;
    const timers: number[] = [];

    document.body.classList.add("intro-is-running");
    window.scrollTo(0, 0);

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    const run = async () => {
      await document.fonts.ready.catch(() => undefined);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      if (cancelled) return;

      const mark = document.querySelector<SVGElement>(
        ".hero-title .title-mark",
      );
      if (!mark) {
        finishRef.current();
        return;
      }

      const rect = mark.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (!width || !height) {
        finishRef.current();
        return;
      }

      const initialScale = 0.25;
      const startX =
        window.innerWidth / 2 - rect.left - (width * initialScale) / 2;
      const startY =
        window.innerHeight / 2 - rect.top - (height * initialScale) / 2;

      setMetrics({
        left: rect.left,
        top: rect.top,
        width,
        height,
        startX,
        startY,
      });

      await wait(240);
      if (cancelled) return;
      setPhase("wipe");

      const started = performance.now();
      const duration = 940;

      const tick = (now: number) => {
        if (cancelled) return;
        const progress = Math.min(1, (now - started) / duration);
        setFill(progress);

        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setPhase("move");
          // The stage finishes arriving in ~920ms. `transitionend` hands off
          // at exactly that point; this timer is only a safety net.
          timers.push(
            window.setTimeout(() => finishRef.current(), 1200),
          );
        }
      };

      frame = requestAnimationFrame(tick);
    };

    run().catch(() => finishRef.current());

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      timers.forEach((timer) => window.clearTimeout(timer));
      document.body.classList.remove("intro-is-running");
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  const initialScale = 0.25;
  const dotLeft = metrics
    ? metrics.left + metrics.startX + metrics.width * initialScale * fill
    : 0;
  const dotTop = metrics
    ? metrics.top +
      metrics.startY +
      (metrics.height * initialScale) / 2
    : 0;

  return (
    <div className={`intro intro--${phase}`} aria-label={content.a11y.intro}>
      <div className="intro__veil" aria-hidden="true" />

      <div
        className="intro__stage"
        onTransitionEnd={(event) => {
          if (phase === "move" && event.propertyName === "transform") {
            finishRef.current();
          }
        }}
        style={
          metrics
            ? {
                left: `${metrics.left}px`,
                top: `${metrics.top}px`,
                transform:
                  phase === "move"
                    ? "translate3d(0, 0, 0) scale(1)"
                    : `translate3d(${metrics.startX}px, ${metrics.startY}px, 0) scale(${initialScale})`,
                transformOrigin: "0 0",
                transition:
                  phase === "move"
                    ? "transform 920ms cubic-bezier(0.76, 0, 0.18, 1)"
                    : "none",
                opacity: phase === "move" ? 0.98 : 1,
              }
            : undefined
        }
      >
        <div className="intro-title intro-title--ghost" aria-hidden="true">
          <TitleMark />
        </div>
        <div
          className="intro-title intro-title--fill"
          style={{ "--fill": `${fill * 100}%` } as CSSProperties}
          aria-hidden="true"
        >
          <TitleMark />
        </div>
      </div>

      <span
        className="intro__dot"
        style={{
          left: dotLeft,
          top: dotTop,
          opacity: metrics && phase !== "move" ? 1 : 0,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
