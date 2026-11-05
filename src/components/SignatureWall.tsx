import { useEffect, useRef, useState } from "react";
import { content } from "../content";
import { clamp } from "../lib/utils";

type Point = [number, number];

type Stroke = {
  points: Point[];
  color: string;
  width: number;
};

const INK = {
  pink: "#F44C65",
  yellow: "#EDE248",
  cream: "#F2F0EA",
  green: "#46BA74",
};

const STORAGE_KEY = "noyal-signature-wall-v1";

function loadSavedStrokes(): Stroke[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (stroke): stroke is Stroke =>
        Boolean(
          stroke &&
            typeof stroke === "object" &&
            Array.isArray((stroke as Stroke).points) &&
            typeof (stroke as Stroke).color === "string",
        ),
    );
  } catch {
    return [];
  }
}

function strokePath(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  width: number,
  height: number,
  fraction = 1,
) {
  const visible = Math.max(1, Math.floor(stroke.points.length * fraction));
  if (visible < 2) return;

  ctx.beginPath();
  const [sx, sy] = stroke.points[0] ?? [0, 0];
  ctx.moveTo(sx * width, sy * height);
  for (let i = 1; i < visible; i += 1) {
    const [x, y] = stroke.points[i] ?? [0, 0];
    ctx.lineTo(x * width, y * height);
  }
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width * Math.min(width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function SignatureWall() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const redrawRef = useRef<(() => void) | null>(null);
  const liveStrokeRef = useRef<Stroke | null>(null);

  const [savedStrokes, setSavedStrokes] = useState<Stroke[]>(loadSavedStrokes);
  const [signatures, setSignatures] = useState<number>(
    () => content.signatures.count + loadSavedStrokes().length,
  );
  const [hereNow, setHereNow] = useState<number>(content.signatures.hereNow);
  const [drawing, setDrawing] = useState(false);
  const [pencilVisible, setPencilVisible] = useState(false);
  const [ink, setInk] = useState(INK.pink);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const check = () => {
      const rect = node.getBoundingClientRect();
      const visible =
        rect.top < window.innerHeight * 0.88 &&
        rect.bottom > window.innerHeight * 0.26;
      setPencilVisible(visible);
      if (!visible) setDrawing(false);
    };

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  useEffect(() => {
    if (!drawing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawing(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawing]);

  useEffect(() => {
    setHereNow(content.signatures.hereNow + (drawing ? 1 : 0));
  }, [drawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let resizeObserver: ResizeObserver | null = null;
    let size = { width: 0, height: 0 };

    const draw = () => {
      const { width, height } = size;
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);

      savedStrokes.forEach((stroke) => {
        strokePath(ctx, stroke, width, height);
      });

      if (liveStrokeRef.current) {
        strokePath(ctx, liveStrokeRef.current, width, height);
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = { width: rect.width, height: rect.height };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();
    redrawRef.current = draw;

    return () => {
      resizeObserver?.disconnect();
      redrawRef.current = null;
    };
  }, [savedStrokes]);

  const toLocalPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      clamp((event.clientX - rect.left) / rect.width, 0, 1),
      clamp((event.clientY - rect.top) / rect.height, 0, 1),
    ];
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    liveStrokeRef.current = {
      points: [toLocalPoint(event)],
      color: ink,
      width: 0.016,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !liveStrokeRef.current) return;
    const next = toLocalPoint(event);
    const points = liveStrokeRef.current.points;
    const last = points[points.length - 1];
    if (!last) return;
    const dx = next[0] - last[0];
    const dy = next[1] - last[1];
    if (Math.hypot(dx, dy) < 0.004) return;
    points.push(next);
    redrawRef.current?.();
  };

  const finishStroke = () => {
    if (!liveStrokeRef.current) return;
    const stroke = liveStrokeRef.current;
    liveStrokeRef.current = null;

    if (stroke.points.length > 1) {
      setSavedStrokes((current) => {
        const next = [...current, stroke];
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Local persistence is a graceful enhancement, not a requirement.
        }
        return next;
      });
      setSignatures((value) => value + 1);
      setHereNow((value) => Math.max(value, content.signatures.hereNow + 1));
      setToast(true);
      window.setTimeout(() => setToast(false), 1800);
    }
  };

  const onPointerUp = () => finishStroke();
  const onPointerCancel = () => finishStroke();

  const handlePencil = () => {
    setDrawing((value) => !value);
  };

  const signatureCount = signatures.toLocaleString("en-US");

  return (
    <section
      className={`signature-wall ${drawing ? "is-drawing" : ""}`}
      id="signatures"
      ref={sectionRef}
      aria-labelledby="signature-heading"
    >
      <canvas
        className="signature-wall__canvas"
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{ pointerEvents: drawing ? "auto" : "none" }}
        aria-label={content.a11y.signatureCanvas}
      />

      <div className="signature-wall__ui">
        <div className="signature-wall__stat">
          <h2 className="signature-wall__count" id="signature-heading">
            {signatureCount}
          </h2>
          <p className="signature-wall__label mono">
            {content.signatures.label}
          </p>
        </div>

        <div className="signature-wall__presence mono">
          <span className="signature-wall__presence-dot" aria-hidden="true" />
          {hereNow} {content.signatures.onlineLabel}
        </div>

        {toast ? (
          <p className="signature-wall__toast mono" role="status">
            {content.signatures.saved}
          </p>
        ) : null}
      </div>

      <div
        className={`pencil-dock ${pencilVisible ? "is-visible" : ""} ${
          drawing ? "is-drawing" : ""
        }`}
      >
        {drawing ? (
          <div className="pencil-dock__panel">
            <p className="pencil-dock__hint mono">{content.controls.hint}</p>
            <div
              className="pencil-dock__colors"
              role="radiogroup"
              aria-label={content.controls.colorsLabel}
            >
              {Object.entries(INK).map(([name, color]) => (
                <button
                  key={name}
                  type="button"
                  className={`ink-dot ${ink === color ? "is-active" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setInk(color)}
                  aria-label={
                    content.a11y.inkNames[
                      name as keyof typeof content.a11y.inkNames
                    ]
                  }
                  aria-pressed={ink === color}
                  role="radio"
                  aria-checked={ink === color}
                  data-cursor="link"
                />
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          className="pencil-button"
          onClick={handlePencil}
          aria-pressed={drawing}
          aria-label={
            drawing ? content.controls.drawing : content.controls.pencilLabel
          }
          data-cursor="link"
        >
          {drawing ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 20l4.1-1 10.4-10.4a2.1 2.1 0 0 0-3-3L5.1 16 4 20z" />
              <path d="M13.6 6.5l3.9 3.9" />
            </svg>
          )}
          <span className="mono">
            {drawing ? content.controls.drawing : content.controls.draw}
          </span>
        </button>
      </div>
    </section>
  );
}
