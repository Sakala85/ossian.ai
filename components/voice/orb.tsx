"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/**
 * Liquid "voice orb" rendered on canvas: three blended, noise-deformed blobs
 * whose amplitude follows the current audio level and conversation state.
 */
export function Orb({
  state = "idle",
  level = 0,
  className,
  size = 280,
}: {
  state?: OrbState;
  level?: number;
  className?: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  stateRef.current = state;
  levelRef.current = level;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = Math.random() * 100;
    let amp = 0.04;
    let spin = 0;

    // Liquid blobs moving inside a glass sphere.
    const blobs = [
      { hue: 286, r: 0.62, sx: 0.9, sy: 0.7, ph: 0 },
      { hue: 252, r: 0.58, sx: 0.6, sy: 1.1, ph: 1.7 },
      { hue: 205, r: 0.5, sx: 1.2, sy: 0.8, ph: 3.1 },
      { hue: 325, r: 0.36, sx: 0.8, sy: 1.3, ph: 4.4 },
      { hue: 175, r: 0.32, sx: 1.4, sy: 0.6, ph: 5.2 },
    ];

    const draw = () => {
      const s = stateRef.current;
      const lvl = Math.min(1, Math.max(0, levelRef.current));
      const target =
        s === "speaking" ? 0.05 + lvl * 0.11 : s === "listening" ? 0.035 + lvl * 0.09 : s === "thinking" ? 0.045 : 0.022;
      amp += (target - amp) * 0.1;
      const speed = s === "thinking" ? 2.6 : s === "speaking" ? 1.7 : s === "listening" ? 1.25 : 0.55;
      t += reduce ? 0 : 0.01 * speed;
      spin += reduce ? 0 : 0.0025 * speed;

      const c = size / 2;
      const R = size * 0.33;
      ctx.clearRect(0, 0, size, size);

      // ambient glow
      const glow = ctx.createRadialGradient(c, c, R * 0.4, c, c, R * 1.5);
      glow.addColorStop(0, `oklch(0.62 0.2 285 / ${0.32 + amp * 1.5})`);
      glow.addColorStop(1, "oklch(0.62 0.2 285 / 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, size, size);

      // sphere outline, gently deformed by voice
      const path = new Path2D();
      const steps = 120;
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * Math.PI * 2;
        const n = Math.sin(3 * th + t * 1.3) * 0.5 + Math.sin(5 * th - t * 1.1 + 1.2) * 0.3 + Math.sin(2 * th + t * 0.7 + 2.4) * 0.2;
        const r = R * (1 + amp * n);
        const x = c + r * Math.cos(th + spin);
        const y = c + r * Math.sin(th + spin);
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
      path.closePath();

      ctx.save();
      ctx.clip(path);
      // deep base
      const base = ctx.createRadialGradient(c, c + R * 0.3, R * 0.1, c, c, R * 1.1);
      base.addColorStop(0, "oklch(0.32 0.14 278)");
      base.addColorStop(1, "oklch(0.16 0.06 280)");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);
      // liquid
      ctx.globalCompositeOperation = "screen";
      try {
        ctx.filter = `blur(${Math.round(size * 0.045)}px)`;
      } catch {}
      for (const b of blobs) {
        const bx = c + Math.cos(t * b.sx + b.ph) * R * 0.45;
        const by = c + Math.sin(t * b.sy + b.ph * 1.3) * R * 0.45;
        const br = R * b.r * (1 + amp * 2.2);
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, `oklch(0.78 0.17 ${b.hue} / 0.95)`);
        g.addColorStop(0.55, `oklch(0.62 0.2 ${b.hue} / 0.45)`);
        g.addColorStop(1, `oklch(0.5 0.2 ${b.hue} / 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }
      try {
        ctx.filter = "none";
      } catch {}
      ctx.globalCompositeOperation = "source-over";
      // glass: top highlight + bottom inner shade
      const hl = ctx.createRadialGradient(c - R * 0.35, c - R * 0.55, 0, c - R * 0.35, c - R * 0.55, R * 0.85);
      hl.addColorStop(0, "oklch(1 0 0 / 0.5)");
      hl.addColorStop(0.4, "oklch(1 0 0 / 0.08)");
      hl.addColorStop(1, "oklch(1 0 0 / 0)");
      ctx.fillStyle = hl;
      ctx.fillRect(0, 0, size, size);
      const shade = ctx.createRadialGradient(c, c, R * 0.7, c, c, R * 1.08);
      shade.addColorStop(0, "oklch(0 0 0 / 0)");
      shade.addColorStop(1, "oklch(0.1 0.05 280 / 0.55)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // rim
      ctx.strokeStyle = "oklch(1 0 0 / 0.14)";
      ctx.lineWidth = 1;
      ctx.stroke(path);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      {(state === "listening" || state === "speaking") && (
        <>
          <span className="absolute inset-[18%] animate-pulse-ring rounded-full border border-primary/40" />
          <span className="absolute inset-[18%] animate-pulse-ring rounded-full border border-primary/30 [animation-delay:1.2s]" />
        </>
      )}
      <canvas ref={canvasRef} style={{ width: size, height: size }} className="relative" aria-hidden />
    </div>
  );
}
