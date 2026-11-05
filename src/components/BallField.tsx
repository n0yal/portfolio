import { useEffect, useRef } from "react";
import Matter from "matter-js";
import { useMediaQuery, useReducedMotion } from "../lib/hooks";

type Props = {
  active: boolean;
  paused: boolean;
};

type Palette = {
  red: string;
  green: string;
  circle: string;
};

type Ball = {
  body: Matter.Body;
  radius: number;
  color: "red" | "green";
  entered: boolean;
  bornAt: number;
  lifetime: number;
  retiring: boolean;
  retireAt: number;
};

type LocalPart = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Platform = {
  el: Element;
  body: Matter.Body;
  kind: "letter" | "line";
  thickness: number;
  localParts: LocalPart[] | null;
  prevLeft: number;
  prevTop: number;
  prevRight: number;
  prevBottom: number;
  prevWidth: number;
  prevHeight: number;
  prevCenterX: number;
  prevCenterY: number;
};

type Orb = {
  body: Matter.Body;
  start: number;
  frames: number[];
  x: number;
  y: number;
  radius: number;
  active: boolean;
  phase: number;
  offsets: Float32Array;
  velocities: Float32Array;
  hover: boolean;
  hoverAngle: number;
  drawnRadius: number;
};

const DESIGN_WIDTH = 1880;
const STEP = 1000 / 60;

// Measured values from the reference recording, expressed in engine units.
const GRAVITY_Y = 1.2;
const RESTITUTION = 0.5;
const RED_SHARE = 0.64;

// Simple defaults for behaviour the recording never showed.
const DESKTOP_MAX_BALLS = 12;
const MOBILE_MAX_BALLS = 7;
const DESKTOP_BURST = 8;
const MOBILE_BURST = 5;

const FIRST_BALL_DELAY = 0.45;
const BURST_MIN = 0.035;
const BURST_MAX = 0.11;
const CONTINUOUS_MIN = 0.35;
const CONTINUOUS_MAX = 0.9;

// Balls retire on a timer and fade out so fresh ones can keep replacing them
// even once the population reaches its cap.
const RETIRE_FADE = 0.28;
const BALL_LIFETIME_MIN = 8;
const BALL_LIFETIME_MAX = 15;

const CIRCLE_A_START = 0.72;
const CIRCLE_B_START = 0.9;
const POP_STEP = 0.05;
const POP_A = [0, 54, 83, 107, 97, 85, 80, 82, 86, 87];
const POP_B = [0, 44, 68, 87, 79, 69, 65, 67, 70, 71];
const POP_DURATION = (POP_A.length - 1) * POP_STEP;

const ALL_MASK = 0xffffffff;

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    styles.getPropertyValue(name).trim() || fallback;
  return {
    red: read("--ball-red", "#f44c65"),
    green: read("--ball-green", "#46ba74"),
    circle: read("--ball-circle", "#f44c65"),
  };
}

function randomRadius(width: number) {
  // ~22% are small enough to fall through the 17-22px letter gaps.
  if (Math.random() < 0.22) {
    return Math.max(3.5, width * randomBetween(0.004, 0.0053));
  }
  return Math.max(4.5, width * randomBetween(0.0055, 0.011));
}

function randomSpawnX(width: number, radius: number) {
  const x =
    Math.random() < 0.7
      ? width * randomBetween(0.03, 0.48)
      : width * randomBetween(0.95, 0.98);
  return Math.min(width - radius - 2, Math.max(radius + 2, x));
}

function popScale(frames: number[], start: number, seconds: number) {
  const t = seconds - start;
  if (t <= 0) return 0;
  const final = frames[frames.length - 1] ?? 1;
  const index = Math.min(frames.length - 1, Math.floor(t / POP_STEP));
  return (frames[index] ?? final) / final;
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  if (radius <= 0) return;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Rasterise a glyph once and record the top contour as a row of narrow
 * rectangles, expressed as fractions of the letter's box. A plain bounding box
 * would let balls float over the empty upper-right corner of letters like L;
 * this keeps every resting ball on an actual inked edge.
 */
function sampleLetterParts(el: SVGGraphicsElement, rect: DOMRect): LocalPart[] {
  const pathData = el.getAttribute("d");
  const matrix = el.getScreenCTM();
  if (!pathData || !matrix || rect.width < 1 || rect.height < 1) return [];

  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));
  const buffer = document.createElement("canvas");
  buffer.width = width;
  buffer.height = height;
  const context = buffer.getContext("2d");
  if (!context) return [];

  context.setTransform(
    matrix.a,
    matrix.b,
    matrix.c,
    matrix.d,
    matrix.e - rect.left,
    matrix.f - rect.top,
  );
  context.fillStyle = "#fff";
  context.fill(new Path2D(pathData));

  const pixels = context.getImageData(0, 0, width, height).data;
  const columnWidth = Math.max(6, Math.min(12, rect.width / 16));
  const columns = Math.max(1, Math.ceil(rect.width / columnWidth));
  const parts: LocalPart[] = [];

  for (let column = 0; column < columns; column += 1) {
    const x0 = column * columnWidth;
    const x1 = Math.min(rect.width, x0 + columnWidth);
    const partWidth = x1 - x0;
    if (partWidth <= 0) continue;

    let top = Number.POSITIVE_INFINITY;
    for (let sample = 0; sample < 3; sample += 1) {
      const localX = x0 + (partWidth * (sample + 0.5)) / 3;
      const px = Math.min(width - 1, Math.max(0, Math.round(localX)));
      for (let py = 0; py < height; py += 1) {
        if (pixels[(py * width + px) * 4 + 3] > 96) {
          top = Math.min(top, py);
          break;
        }
      }
    }

    if (!Number.isFinite(top)) continue;
    const partHeight = rect.height - top;
    if (partHeight < 1) continue;

    parts.push({
      x: x0 / rect.width,
      y: top / rect.height,
      width: partWidth / rect.width,
      height: partHeight / rect.height,
    });
  }

  return parts;
}

const LETTER_OPTIONS = {
  isStatic: true,
  restitution: 0,
  friction: 0.45,
  frictionStatic: 0.6,
} as const;

function buildLetterBody(localParts: LocalPart[], rect: DOMRect) {
  const parts = localParts.map((part) =>
    Matter.Bodies.rectangle(
      rect.left + (part.x + part.width / 2) * rect.width,
      rect.top + (part.y + part.height / 2) * rect.height,
      Math.max(0.8, part.width * rect.width + 0.6),
      Math.max(0.8, part.height * rect.height),
      LETTER_OPTIONS,
    ),
  );

  if (!parts.length) {
    return Matter.Bodies.rectangle(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      Math.max(1, rect.width),
      Math.max(1, rect.height),
      LETTER_OPTIONS,
    );
  }

  return Matter.Body.create({
    parts,
    ...LETTER_OPTIONS,
  });
}

export function BallField({ active, paused }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startRef = useRef<(() => void) | null>(null);
  const activeRef = useRef(active);
  const pausedRef = useRef(paused);
  const reducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 900px)");

  activeRef.current = active;
  pausedRef.current = paused;

  useEffect(() => {
    if (active) startRef.current?.();
  }, [active]);

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: GRAVITY_Y, scale: 0.001 },
      enableSleeping: false,
    });
    const world = engine.world;
    let palette = readPalette();

    let disposed = false;
    let raf = 0;
    let last = performance.now();
    let accumulator = 0;
    let started = false;
    let elapsed = 0;
    let burstStarted = false;
    let burstLeft = 0;
    let nextBurstAt = 0;
    let nextContinuousAt = 0;

    const maxBalls = isMobile ? MOBILE_MAX_BALLS : DESKTOP_MAX_BALLS;
    const burstCount = isMobile ? MOBILE_BURST : DESKTOP_BURST;
    const balls: Ball[] = [];
    const platforms: Platform[] = [];

    const heroEl = document.querySelector<HTMLElement>(".hero");
    const letterEls = Array.from(
      document.querySelectorAll<SVGGraphicsElement>(
        ".hero-title [data-letter]",
      ),
    );
    const lineEls = Array.from(
      document.querySelectorAll<HTMLElement>("[data-ball-platform]"),
    );

    const viewport = () => ({
      width:
        canvas.clientWidth ||
        document.documentElement.clientWidth ||
        window.innerWidth,
      height:
        canvas.clientHeight ||
        document.documentElement.clientHeight ||
        window.innerHeight,
    });

    const resize = () => {
      const { width, height } = viewport();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      palette = readPalette();
    };
    resize();

    // One collider per glyph. The contour is sampled once and rebuilt from the
    // live box if the title is resized, so it always tracks the SVG exactly.
    for (const el of letterEls) {
      const rect = el.getBoundingClientRect();
      const localParts = sampleLetterParts(el, rect);
      const body = buildLetterBody(localParts, rect);
      Matter.Composite.add(world, body);
      platforms.push({
        el,
        body,
        kind: "letter",
        thickness: rect.height,
        localParts,
        prevLeft: rect.left,
        prevTop: rect.top,
        prevRight: rect.right,
        prevBottom: rect.bottom,
        prevWidth: Math.max(1, rect.width),
        prevHeight: Math.max(1, rect.height),
        prevCenterX: rect.left + rect.width / 2,
        prevCenterY: rect.top + rect.height / 2,
      });
    }

    // The hairline is a thin visible line but a thicker collider. The extra
    // thickness is entirely below the line and stops fast, small balls from
    // tunnelling through between physics steps.
    for (const el of lineEls) {
      const rect = el.getBoundingClientRect();
      const thickness = 28;
      const body = Matter.Bodies.rectangle(
        rect.left + rect.width / 2,
        rect.top + thickness / 2,
        Math.max(1, rect.width),
        thickness,
        { isStatic: true, restitution: 0, friction: 0.45 },
      );
      Matter.Composite.add(world, body);
      platforms.push({
        el,
        body,
        kind: "line",
        thickness,
        localParts: null,
        prevLeft: rect.left,
        prevTop: rect.top,
        prevRight: rect.right,
        prevBottom: rect.bottom,
        prevWidth: Math.max(1, rect.width),
        prevHeight: 1,
        prevCenterX: rect.left + rect.width / 2,
        prevCenterY: rect.top + thickness / 2,
      });
    }

    const makeOrb = (start: number, frames: number[]) => {
      const body = Matter.Bodies.circle(0, 0, 1, {
        isStatic: true,
        restitution: 0,
        friction: 0.5,
      });
      // Invisible until the pop finishes; then it becomes a real collider.
      body.collisionFilter.mask = 0;
      Matter.Composite.add(world, body);
      return {
        body,
        start,
        frames,
        x: 0,
        y: 0,
        radius: 0,
        active: false,
      } satisfies Orb;
    };

    const orbs: Orb[] = [
      makeOrb(CIRCLE_A_START, POP_A),
      makeOrb(CIRCLE_B_START, POP_B),
    ];

    const removeBall = (index: number) => {
      const ball = balls[index];
      if (!ball) return;
      Matter.Composite.remove(world, ball.body);
      balls.splice(index, 1);
    };

    const activeBallCount = () =>
      balls.reduce((total, ball) => total + (ball.retiring ? 0 : 1), 0);

    const retireBall = (ball: Ball) => {
      if (ball.retiring) return;
      ball.retiring = true;
      ball.retireAt = elapsed / 1000;
    };

    const spawnBall = () => {
      if (activeBallCount() >= maxBalls) return;
      const { width } = viewport();
      const radius = randomRadius(width);
      const x = randomSpawnX(width, radius);
      const y = -radius - randomBetween(50, 250);
      const body = Matter.Bodies.circle(x, y, radius, {
        restitution: RESTITUTION,
        friction: 0.35,
        frictionStatic: 0.5,
        frictionAir: 0.002,
        density: 0.001,
        slop: 0.02,
      });
      // Near-vertical entry: |vx| stays under about 60 px/s.
      Matter.Body.setVelocity(body, {
        x: randomBetween(-1, 1),
        y: 0,
      });
      Matter.Body.setAngularVelocity(body, randomBetween(-0.04, 0.04));
      Matter.Composite.add(world, body);
      balls.push({
        body,
        radius,
        color: Math.random() < RED_SHARE ? "red" : "green",
        entered: false,
        bornAt: elapsed / 1000,
        lifetime: randomBetween(BALL_LIFETIME_MIN, BALL_LIFETIME_MAX),
        retiring: false,
        retireAt: 0,
      });
    };

    // At the cap, fade out the oldest settled ball before adding the newcomer
    // so the field keeps cycling instead of freezing at full population.
    const spawnOrReplace = () => {
      if (activeBallCount() >= maxBalls) {
        const active = balls.filter((ball) => !ball.retiring);
        const resting = active.filter(
          (ball) =>
            Math.abs(ball.body.velocity.x) < 0.2 &&
            Math.abs(ball.body.velocity.y) < 0.2,
        );
        const pool = resting.length ? resting : active;
        if (pool.length) {
          retireBall(
            pool.reduce((oldest, ball) =>
              oldest.bornAt <= ball.bornAt ? oldest : ball,
            ),
          );
        }
      }
      spawnBall();
    };

    const updateRetirements = () => {
      const seconds = elapsed / 1000;
      for (let i = balls.length - 1; i >= 0; i -= 1) {
        const ball = balls[i];
        if (!ball) continue;
        if (ball.retiring) {
          if (seconds - ball.retireAt >= RETIRE_FADE) removeBall(i);
        } else if (seconds - ball.bornAt >= ball.lifetime) {
          retireBall(ball);
        }
      }
    };

    const updateTimeline = () => {
      const seconds = elapsed / 1000;

      if (!burstStarted && seconds >= FIRST_BALL_DELAY) {
        burstStarted = true;
        spawnOrReplace();
        burstLeft = Math.max(0, burstCount - 1);
        nextBurstAt = seconds + randomBetween(BURST_MIN, BURST_MAX);
        nextContinuousAt = seconds + randomBetween(CONTINUOUS_MIN, CONTINUOUS_MAX);
      }

      if (burstLeft > 0 && seconds >= nextBurstAt) {
        spawnOrReplace();
        burstLeft -= 1;
        nextBurstAt = seconds + randomBetween(BURST_MIN, BURST_MAX);
        if (burstLeft === 0) {
          nextContinuousAt =
            seconds + randomBetween(CONTINUOUS_MIN, CONTINUOUS_MAX);
        }
      }

      if (burstStarted && burstLeft === 0 && seconds >= nextContinuousAt) {
        spawnOrReplace();
        nextContinuousAt =
          seconds + randomBetween(CONTINUOUS_MIN, CONTINUOUS_MAX);
      }
    };

    const carryBalls = (
      platform: Platform,
      rect: DOMRect,
      scaleX: number,
      scaleY: number,
    ) => {
      const dx = rect.left - platform.prevLeft;
      const dy = rect.top - platform.prevTop;
      const moved = Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01;
      const scaled = Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001;
      if (!moved && !scaled) return;

      for (const ball of balls) {
        const radius = ball.radius;
        const x = ball.body.position.x;
        const bottom = ball.body.position.y + radius;
        if (
          x + radius < platform.prevLeft - 2 ||
          x - radius > platform.prevRight + 2
        ) {
          continue;
        }

        if (platform.kind === "letter") {
          // Glyph tops follow the real path, so a resting ball can be sitting
          // anywhere inside the letter's bounds, not only on the bbox top.
          if (bottom < platform.prevTop - 12 || bottom > platform.prevBottom + 12) {
            continue;
          }
          if (Math.abs(ball.body.velocity.y) > 0.2) continue;
        } else if (bottom < platform.prevTop - 6 || bottom > platform.prevTop + 6) {
          continue;
        }

        // Scale the ball's contact point with the platform, which keeps it on
        // the same part of the glyph when the title grows or shrinks. The
        // ball's own radius stays constant, so it always sits on the surface.
        Matter.Body.setPosition(ball.body, {
          x: rect.left + (x - platform.prevLeft) * scaleX,
          y: rect.top + (bottom - platform.prevTop) * scaleY - radius,
        });
        Matter.Body.setVelocity(ball.body, {
          x: ball.body.velocity.x,
          y: 0,
        });
      }
    };

    const syncPlatforms = () => {
      for (const platform of platforms) {
        const rect = platform.el.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;

        const centerX = rect.left + rect.width / 2;
        const centerY =
          platform.kind === "line"
            ? rect.top + platform.thickness / 2
            : rect.top + rect.height / 2;
        const dx = centerX - platform.prevCenterX;
        const dy = centerY - platform.prevCenterY;
        const scaleX = rect.width / platform.prevWidth;
        const scaleY =
          platform.kind === "line"
            ? 1
            : rect.height / platform.prevHeight;
        carryBalls(platform, rect, scaleX, scaleY);

        if (platform.kind === "letter") {
          const resized =
            Math.abs(rect.width - platform.prevWidth) > 0.5 ||
            Math.abs(rect.height - platform.prevHeight) > 0.5;
          if (resized && platform.localParts) {
            Matter.Composite.remove(world, platform.body);
            platform.body = buildLetterBody(platform.localParts, rect);
            Matter.Composite.add(world, platform.body);
          } else {
            Matter.Body.setPosition(platform.body, {
              x: platform.body.position.x + dx,
              y: platform.body.position.y + dy,
            });
          }
        } else {
          const resized = Math.abs(rect.width - platform.prevWidth) > 0.5;
          if (resized) {
            Matter.Composite.remove(world, platform.body);
            platform.body = Matter.Bodies.rectangle(
              centerX,
              centerY,
              Math.max(1, rect.width),
              platform.thickness,
              { isStatic: true, restitution: 0, friction: 0.45 },
            );
            Matter.Composite.add(world, platform.body);
          } else {
            Matter.Body.setPosition(platform.body, { x: centerX, y: centerY });
          }
        }

        platform.prevLeft = rect.left;
        platform.prevTop = rect.top;
        platform.prevRight = rect.right;
        platform.prevBottom = rect.bottom;
        platform.prevWidth = Math.max(1, rect.width);
        platform.prevHeight = Math.max(1, rect.height);
        platform.prevCenterX = centerX;
        platform.prevCenterY = centerY;
      }
    };

    const syncOrbs = () => {
      const heroRect = heroEl?.getBoundingClientRect();
      const { width, height } = viewport();
      const heroTop = heroRect?.top ?? 0;
      const heroHeight = heroRect?.height ?? height;
      const targets = [
        {
          x: width * 0.848,
          y: heroTop + heroHeight * 0.266,
          radius: (width * 87) / DESIGN_WIDTH,
        },
        {
          x: width * 0.922,
          y: heroTop + heroHeight * 0.522,
          radius: (width * 71) / DESIGN_WIDTH,
        },
      ];

      orbs.forEach((orb, index) => {
        const target = targets[index];
        if (!target) return;
        orb.x = target.x;
        orb.y = target.y;
        orb.radius = target.radius;

        const currentRadius = orb.body.circleRadius ?? 1;
        if (Math.abs(currentRadius - target.radius) > 0.5) {
          Matter.Body.scale(
            orb.body,
            target.radius / Math.max(0.01, currentRadius),
            target.radius / Math.max(0.01, currentRadius),
          );
        }
        Matter.Body.setPosition(orb.body, { x: target.x, y: target.y });

        if (
          !orb.active &&
          elapsed / 1000 >= orb.start + POP_DURATION
        ) {
          orb.body.collisionFilter.mask = ALL_MASK;
          orb.active = true;
        }
      });
    };

    const removeLostBalls = () => {
      const { width, height } = viewport();
      for (let i = balls.length - 1; i >= 0; i -= 1) {
        const ball = balls[i];
        if (!ball) continue;
        const y = ball.body.position.y;
        if (y > height + ball.radius + 60) {
          removeBall(i);
          continue;
        }
        // A ball carried off the top by a scrolling platform is gone.
        if (ball.entered && y + ball.radius < -120) {
          removeBall(i);
          continue;
        }
        if (
          ball.body.position.x < -ball.radius - 60 ||
          ball.body.position.x > width + ball.radius + 60
        ) {
          removeBall(i);
          continue;
        }
        if (y > 0) ball.entered = true;
      }
    };

    const draw = () => {
      const { width, height } = viewport();
      ctx.clearRect(0, 0, width, height);

      const seconds = elapsed / 1000;
      for (const orb of orbs) {
        const scale = popScale(orb.frames, orb.start, seconds);
        if (scale > 0) {
          drawCircle(
            ctx,
            orb.x,
            orb.y,
            orb.radius * scale,
            palette.circle,
          );
        }
      }

      for (const ball of balls) {
        const alpha = ball.retiring
          ? Math.max(0, 1 - (seconds - ball.retireAt) / RETIRE_FADE)
          : 1;
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        drawCircle(
          ctx,
          ball.body.position.x,
          ball.body.position.y,
          ball.radius,
          ball.color === "red" ? palette.red : palette.green,
        );
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      if (disposed) return;
      const delta = Math.min(50, Math.max(0, now - last));
      last = now;

      syncPlatforms();
      syncOrbs();

      if (started && !pausedRef.current) {
        elapsed += delta;
        updateTimeline();
        accumulator += delta;
        let steps = 0;
        while (accumulator >= STEP && steps < 4) {
          Matter.Engine.update(engine, STEP);
          accumulator -= STEP;
          steps += 1;
        }
        updateRetirements();
        removeLostBalls();
      } else {
        accumulator = 0;
      }

      draw();
      raf = requestAnimationFrame(loop);
    };

    startRef.current = () => {
      if (started) return;
      started = true;
      elapsed = 0;
      last = performance.now();
      accumulator = 0;
    };

    document.fonts.ready
      .catch(() => undefined)
      .then(() => {
        if (disposed) return;
        syncPlatforms();
        syncOrbs();
        if (activeRef.current) startRef.current?.();
        last = performance.now();
        raf = requestAnimationFrame(loop);
      });

    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      startRef.current = null;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      Matter.Engine.clear(engine);
    };
  }, [isMobile, reducedMotion]);

  // Reduced motion: no physics, just a few balls resting on the artwork.
  useEffect(() => {
    if (!reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let disposed = false;

    const draw = () => {
      if (disposed) return;
      const width =
        canvas.clientWidth ||
        document.documentElement.clientWidth ||
        window.innerWidth;
      const height =
        canvas.clientHeight ||
        document.documentElement.clientHeight ||
        window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const palette = readPalette();
      const heroEl = document.querySelector<HTMLElement>(".hero");
      const heroRect = heroEl?.getBoundingClientRect();
      const heroTop = heroRect?.top ?? 0;
      const heroHeight = heroRect?.height ?? height;

      drawCircle(
        ctx,
        width * 0.848,
        heroTop + heroHeight * 0.266,
        (width * 87) / DESIGN_WIDTH,
        palette.circle,
      );
      drawCircle(
        ctx,
        width * 0.922,
        heroTop + heroHeight * 0.522,
        (width * 71) / DESIGN_WIDTH,
        palette.circle,
      );

      const letters = Array.from(
        document.querySelectorAll<SVGGraphicsElement>(
          ".hero-title [data-letter]",
        ),
      );
      letters.forEach((letter, index) => {
        if (index % 2 !== 0) return;
        const rect = letter.getBoundingClientRect();
        if (!rect.width || rect.top < 0 || rect.top > height) return;
        const radius = Math.max(4, (width * (index % 3 === 0 ? 8 : 6)) / DESIGN_WIDTH);
        drawCircle(
          ctx,
          rect.left + rect.width / 2,
          rect.top - radius,
          radius,
          index % 4 === 0 ? palette.red : palette.green,
        );
      });

      const hairline = document.querySelector<HTMLElement>(".hero__hairline");
      if (hairline) {
        const rect = hairline.getBoundingClientRect();
        const radius = Math.max(4, (width * 8) / DESIGN_WIDTH);
        [0.2, 0.46, 0.72].forEach((fraction, index) => {
          drawCircle(
            ctx,
            rect.left + rect.width * fraction,
            rect.top - radius,
            radius,
            index === 1 ? palette.green : palette.red,
          );
        });
      }
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    };

    schedule();
    document.fonts.ready.then(schedule).catch(() => undefined);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} className="ball-field" aria-hidden="true" />;
}
