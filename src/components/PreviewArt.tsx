import { useEffect, useRef } from "react";
import type { Project } from "../content";
import { useReducedMotion } from "../lib/hooks";
import { mulberry32 } from "../lib/utils";

type Props = {
  active: Project;
  projects: readonly Project[];
};

export function PreviewArt({ active, projects }: Props) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const frame = frameRef.current;
    if (!frame) return;

    const animation = frame.animate(
      [
        { borderRadius: "50% 50% 50% 50% / 50% 50% 50% 50%" },
        {
          borderRadius: "46% 54% 57% 43% / 52% 45% 55% 48%",
          offset: 0.32,
        },
        {
          borderRadius: "53% 47% 44% 56% / 46% 55% 45% 54%",
          offset: 0.68,
        },
        { borderRadius: "50% 50% 50% 50% / 50% 50% 50% 50%" },
      ],
      {
        duration: 820,
        easing: "cubic-bezier(0.45, 0, 0.25, 1)",
      },
    );

    return () => animation.cancel();
  }, [active.slug, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const random = mulberry32(active.index.charCodeAt(0) * 809);
    const particles = Array.from({ length: 260 }, () => {
      const angle = random() * Math.PI * 2;
      const radius = Math.sqrt(random()) * rect.width * 0.49;
      return {
        x: rect.width / 2 + Math.cos(angle) * radius,
        y: rect.height / 2 + Math.sin(angle) * radius,
        size: 0.5 + random() * 2.4,
        delay: random() * 0.28,
        drift: 6 + random() * 22,
        alpha: 0.35 + random() * 0.65,
      };
    });

    let raf = 0;
    const started = performance.now();
    const duration = 720;

    const draw = (now: number) => {
      const elapsed = now - started;
      const progress = Math.min(1, elapsed / duration);
      ctx.clearRect(0, 0, rect.width, rect.height);

      for (const particle of particles) {
        const local = Math.max(
          0,
          Math.min(1, (progress - particle.delay) / (1 - particle.delay)),
        );
        if (local <= 0 || local >= 1) continue;
        const fade = Math.sin(local * Math.PI);
        const spread = particle.drift * local;
        ctx.globalAlpha = fade * particle.alpha;
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(
          particle.x + spread,
          particle.y - spread * 0.45,
          particle.size * (1 + local * 0.8),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      if (progress < 1) raf = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, rect.width, rect.height);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active.slug, active.index, reducedMotion]);

  return (
    <div className="preview-frame" ref={frameRef}>
      {projects.map((project) => (
        <img
          key={project.slug}
          className={`preview-frame__image ${
            project.slug === active.slug ? "is-active" : ""
          }`}
          src={`/previews/${project.preview}.svg`}
          alt={`${project.title} abstract preview`}
          draggable={false}
        />
      ))}
      <div className="preview-frame__grain" aria-hidden="true" />
      <canvas className="preview-frame__flecks" ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
