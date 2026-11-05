import { useEffect, useRef, useState } from "react";
import { content } from "../content";
import { useFinePointer, useMediaQuery } from "../lib/hooks";

type CursorMode = "default" | "link" | "project" | "hidden";

const colorMap: Record<string, string> = {
  pink: "#F44C65",
  yellow: "#EDE248",
  green: "#46BA74",
  cream: "#F2F0EA",
};

export function CustomCursor({
  enabled,
  resetKey,
}: {
  enabled: boolean;
  resetKey?: string;
}) {
  const finePointer = useFinePointer();
  const isNarrow = useMediaQuery("(max-width: 900px)");
  const dotRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const pressed = useRef(false);
  const frame = useRef(0);
  const [mode, setMode] = useState<CursorMode>("hidden");
  const [pill, setPill] = useState({ index: "01", color: "#F44C65" });

  const showing = enabled && finePointer;

  useEffect(() => {
    setMode("hidden");
  }, [resetKey]);

  useEffect(() => {
    if (!showing) {
      document.body.classList.remove("has-custom-cursor");
      return;
    }
    document.body.classList.add("has-custom-cursor");

    const onMove = (event: PointerEvent) => {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;

      const target = event.target as HTMLElement | null;
      const project = isNarrow
        ? null
        : target?.closest<HTMLElement>('[data-cursor="project"]');
      if (project) {
        const index = project.dataset.index ?? "01";
        const color = colorMap[project.dataset.color ?? "pink"] ?? "#F44C65";
        setPill((current) =>
          current.index === index && current.color === color
            ? current
            : { index, color },
        );
        setMode("project");
        return;
      }

      const interactive = target?.closest<HTMLElement>(
        'a, button, [data-cursor="link"]',
      );
      if (interactive) {
        setMode("link");
        return;
      }

      setMode("default");
    };

    const onLeave = () => setMode("hidden");
    const onEnter = () => setMode("default");
    const onDown = (event: PointerEvent) => {
      pressed.current = true;
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      smooth.current.x = event.clientX;
      smooth.current.y = event.clientY;
      document.body.classList.add("cursor-is-down");
    };
    const onUp = (event: PointerEvent) => {
      pressed.current = false;
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      smooth.current.x = event.clientX;
      smooth.current.y = event.clientY;
      document.body.classList.remove("cursor-is-down");
    };
    const onScroll = () =>
      setMode((current) =>
        current === "project" ? "hidden" : current,
      );

    const animate = () => {
      if (pressed.current) {
        smooth.current.x = pointer.current.x;
        smooth.current.y = pointer.current.y;
      } else {
        smooth.current.x += (pointer.current.x - smooth.current.x) * 0.42;
        smooth.current.y += (pointer.current.y - smooth.current.y) * 0.42;
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${
          smooth.current.x
        }px, ${smooth.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (pillRef.current) {
        pillRef.current.style.transform = `translate3d(${
          smooth.current.x + 16
        }px, ${smooth.current.y + 16}px, 0)`;
      }
      frame.current = requestAnimationFrame(animate);
    };

    frame.current = requestAnimationFrame(animate);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      document.body.classList.remove("cursor-is-down");
      pressed.current = false;
      cancelAnimationFrame(frame.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
    };
  }, [showing, isNarrow]);

  if (!showing) return null;

  return (
    <div className={`cursor ${mode === "hidden" ? "is-hidden" : ""}`} aria-hidden="true">
      <div
        className={`cursor__dot ${mode === "link" ? "is-link" : ""} ${
          mode === "project" ? "is-project" : ""
        }`}
        ref={dotRef}
      />
      <div
        className={`cursor__pill ${mode === "project" ? "is-visible" : ""}`}
        ref={pillRef}
        style={{ backgroundColor: pill.color }}
      >
        <span>{pill.index}</span>
        <span>{content.cursor.separator}</span>
        <span>{content.cursor.view}</span>
        <span>{content.nav.arrow}</span>
      </div>
    </div>
  );
}
