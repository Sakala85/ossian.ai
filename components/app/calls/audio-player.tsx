"use client";

import { Download, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn, duration } from "@/lib/utils";

const SPEEDS = [1, 1.25, 1.5, 2] as const;

/** Simulated playback clock (the demo has no real audio files). */
export function usePlayback(total: number) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      const prev = last.current ?? now;
      last.current = now;
      setT((cur) => {
        const next = cur + ((now - prev) / 1000) * speed;
        if (next >= total) {
          setPlaying(false);
          return total;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, total]);

  const toggle = useCallback(() => {
    if (!playing && t >= total) setT(0);
    setPlaying(!playing);
  }, [playing, t, total]);

  const seek = useCallback((s: number) => setT(Math.max(0, Math.min(total, s))), [total]);
  const cycleSpeed = useCallback(() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]!), []);

  return { t, playing, speed, toggle, seek, cycleSpeed, total };
}

export type Playback = ReturnType<typeof usePlayback>;

function bars(seed: string, n: number) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    const r = ((h >>> 0) % 1000) / 1000;
    const env = 0.55 + 0.45 * Math.sin((i / n) * Math.PI * 3.2 + r);
    out.push(0.18 + 0.82 * Math.abs(env) * (0.35 + r * 0.65));
  }
  return out;
}

export function AudioPlayer({ id, playback, onDownload }: { id: string; playback: Playback; onDownload?: () => void }) {
  const { t, playing, speed, toggle, seek, cycleSpeed, total } = playback;
  const N = 72;
  const heights = useMemo(() => bars(id, N), [id]);
  const progress = total ? t / total : 0;
  const trackRef = useRef<HTMLDivElement>(null);

  const seekFromEvent = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return;
    seek(((clientX - r.left) / r.width) * total);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-soft">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Lecture"}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform active:scale-95 [&_svg]:size-4"
        >
          {playing ? <Pause className="fill-current" /> : <Play className="translate-x-px fill-current" />}
        </button>

        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label="Position de lecture"
          aria-valuemin={0}
          aria-valuemax={Math.round(total)}
          aria-valuenow={Math.round(t)}
          aria-valuetext={`${duration(t)} sur ${duration(total)}`}
          onPointerDown={(e) => {
            seekFromEvent(e.clientX);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => e.buttons === 1 && seekFromEvent(e.clientX)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") seek(t + 5);
            if (e.key === "ArrowLeft") seek(t - 5);
          }}
          className="flex h-9 min-w-0 flex-1 cursor-pointer touch-none items-center gap-[2px] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {heights.map((h, i) => (
            <span
              key={i}
              className={cn("min-w-px flex-1 rounded-full transition-colors duration-150", i / N < progress ? "bg-primary" : "bg-border-strong")}
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 pl-12 text-xs text-muted-foreground">
        <span className="tabular">
          <span className="text-foreground">{duration(t)}</span> / {duration(total)}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => seek(t - 10)}
            aria-label="Reculer de 10 secondes"
            className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3"
          >
            <RotateCcw /> 10 s
          </button>
          <button
            type="button"
            onClick={cycleSpeed}
            aria-label="Vitesse de lecture"
            className="inline-flex h-6 min-w-11 items-center justify-center rounded-md border border-border px-1.5 font-medium text-foreground tabular transition-colors hover:bg-muted"
          >
            {String(speed).replace(".", ",")}×
          </button>
          <button
            type="button"
            onClick={onDownload}
            aria-label="Télécharger l'enregistrement"
            className="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
          >
            <Download />
          </button>
        </div>
      </div>
    </div>
  );
}
