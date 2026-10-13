"use client";

import { useId } from "react";

type Slice = {
  id: string;
  name: string;
  amount: number;
  color: string;
};

function shade(color: string, mixPercent: number, toward = "#000000"): string {
  return `color-mix(in srgb, ${color} ${mixPercent}%, ${toward})`;
}

function RingCircles({
  slices,
  total,
  radius,
  strokeWidth,
  dim = 100,
}: {
  slices: Slice[];
  total: number;
  radius: number;
  strokeWidth: number;
  dim?: number;
}) {
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;

  return (
    <>
      <circle cx="80" cy="80" r={radius} fill="none" stroke={shade("var(--paper-deep)", Math.min(dim, 88))} strokeWidth={strokeWidth} />
      {total > 0
        ? slices.map((slice) => {
            const length = (slice.amount / total) * circumference;
            const visible = Math.max(length - 1.4, 0);
            const dash = `${visible} ${circumference - visible}`;
            const offset = -cursor - 0.7;
            cursor += length;
            return (
              <circle
                key={slice.id}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={shade(slice.color, dim)}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={dash}
                strokeDashoffset={offset}
                transform="rotate(-90 80 80)"
              />
            );
          })
        : null}
    </>
  );
}

const DEPTH = 18;

export function DonutChart({ slices, center }: { slices: Slice[]; center: string }) {
  const uid = useId().replace(/:/g, "");
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const radius = 52;
  const strokeWidth = 24;
  const label = slices.map((slice) => `${slice.name} ${slice.amount}`).join(", ");
  const shineId = `donut-shine-${uid}`;
  const glowId = `donut-glow-${uid}`;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[220px_1fr]">
      <div className="donut-3d-scene relative mx-auto h-52 w-52">
        <div className="donut-3d-shadow" aria-hidden="true" />

        <div className="donut-3d-tilt" role="img" aria-label={label || "Sin datos"}>
          {Array.from({ length: DEPTH }, (_, index) => {
            const fromBottom = DEPTH - 1 - index;
            const dim = 38 + (index / Math.max(DEPTH - 1, 1)) * 62;
            return (
              <div
                key={fromBottom}
                className="donut-3d-layer"
                style={{
                  transform: `translate3d(0, ${fromBottom * 1.2}px, ${fromBottom * -0.35}px)`,
                  zIndex: index + 1,
                }}
              >
                <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
                  <RingCircles slices={slices} total={total} radius={radius} strokeWidth={strokeWidth} dim={dim} />
                </svg>
              </div>
            );
          })}

          <div
            className="donut-3d-layer donut-3d-top"
            style={{ transform: "translate3d(0, 0, 1px)", zIndex: DEPTH + 2 }}
          >
            <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
              <defs>
                <linearGradient id={shineId} x1="18%" y1="0%" x2="82%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                  <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
                </linearGradient>
                <radialGradient id={glowId} cx="32%" cy="28%" r="70%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
              </defs>
              <RingCircles slices={slices} total={total} radius={radius} strokeWidth={strokeWidth} dim={100} />
              <circle cx="80" cy="80" r={radius} fill="none" stroke={`url(#${shineId})`} strokeWidth={strokeWidth} />
              <circle cx="80" cy="80" r={radius - strokeWidth / 2 - 1} fill={`url(#${glowId})`} />
              <circle
                cx="80"
                cy="80"
                r={radius - strokeWidth / 2}
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.3"
              />
              <circle
                cx="80"
                cy="80"
                r={radius + strokeWidth / 2}
                fill="none"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[40%] z-20 flex -translate-y-1/2 items-center justify-center px-10 text-center">
          <p className="font-display text-base leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] sm:text-lg">
            {center}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {slices.length === 0 ? <li className="text-sm text-muted">Todavía no hay nada para graficar.</li> : null}
        {slices.map((slice) => {
          const percent = total === 0 ? 0 : Math.round((slice.amount / total) * 100);
          return (
            <li key={slice.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.25)]"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate">{slice.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted">{percent}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
