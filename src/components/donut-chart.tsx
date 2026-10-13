"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type Slice = {
  id: string;
  name: string;
  amount: number;
  color: string;
};

type PreparedSlice = Slice & {
  start: number;
  end: number;
  percent: number;
};

function shade(color: string, mixPercent: number, toward = "#000000"): string {
  return `color-mix(in srgb, ${color} ${mixPercent}%, ${toward})`;
}

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function donutSegmentPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  start: number,
  end: number,
): string {
  const sweep = Math.max(Math.min(end - start, 359.999), 0.001);
  const large = sweep > 180 ? 1 : 0;
  const [ox1, oy1] = polar(cx, cy, rOuter, start);
  const [ox2, oy2] = polar(cx, cy, rOuter, start + sweep);
  const [ix2, iy2] = polar(cx, cy, rInner, start + sweep);
  const [ix1, iy1] = polar(cx, cy, rInner, start);
  return [
    `M ${ox1} ${oy1}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${ix1} ${iy1}`,
    "Z",
  ].join(" ");
}

/** Pared lateral de un segmento (extrusión entre dos radios). */
function sideWallPath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
  depth: number,
): string {
  const sweep = Math.max(Math.min(end - start, 359.999), 0.001);
  const large = sweep > 180 ? 1 : 0;
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, start + sweep);
  const [x3, y3] = [x2, y2 + depth];
  const [x4, y4] = [x1, y1 + depth];
  return [
    `M ${x1} ${y1}`,
    `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${r} ${r} 0 ${large} 0 ${x4} ${y4}`,
    "Z",
  ].join(" ");
}

function prepareSlices(slices: Slice[]): { total: number; prepared: PreparedSlice[] } {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  if (total <= 0) return { total: 0, prepared: [] };

  const gap = slices.length > 1 ? 2.8 : 0;
  const usable = 360 - gap * slices.length;
  let cursor = -18; // gira un poco para composición más linda
  const prepared: PreparedSlice[] = [];

  for (const slice of slices) {
    const sweep = Math.max((slice.amount / total) * usable, 1);
    prepared.push({
      ...slice,
      start: cursor,
      end: cursor + sweep,
      percent: Math.round((slice.amount / total) * 100),
    });
    cursor += sweep + gap;
  }

  return { total, prepared };
}

const DEPTH_LAYERS = 26;
const EXTRUDE = 28;

export function DonutChart({ slices, center }: { slices: Slice[]; center: string }) {
  const uid = useId().replace(/:/g, "");
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const { total, prepared } = useMemo(() => prepareSlices(slices), [slices]);
  const rInner = 33;
  const rOuter = 68;
  const label = slices.map((slice) => `${slice.name} ${slice.amount}`).join(", ");

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const node = sceneRef.current;
    if (!node) return;

    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      setTilt({ x: py * -10, y: px * 12 });
    };
    const onLeave = () => setTilt({ x: 0, y: 0 });

    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);
    return () => {
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="grid items-center gap-8 sm:grid-cols-[260px_1fr]">
      <div
        ref={sceneRef}
        className={`donut-3d-scene relative mx-auto h-60 w-60 touch-manipulation ${ready ? "donut-3d-ready" : ""}`}
      >
        <div className="donut-3d-shadow" aria-hidden="true" />
        <div className="donut-3d-glow" aria-hidden="true" />
        <div className="donut-3d-floor" aria-hidden="true" />

        <div
          className="donut-3d-tilt donut-3d-spin"
          role="img"
          aria-label={label || "Sin datos"}
          style={{
            transform: `rotateX(${66 + tilt.x}deg) rotateZ(${-12 + tilt.y}deg)`,
          }}
        >
          {/* Paredes laterales reales (extrusión) */}
          <div className="donut-3d-layer donut-3d-walls" style={{ zIndex: 1 }}>
            <svg viewBox="0 0 160 160" className="h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                {prepared.map((slice) => {
                  const mid = (slice.start + slice.end) / 2;
                  const lit = 0.5 + 0.5 * Math.cos(((mid - 200) * Math.PI) / 180);
                  return (
                    <linearGradient key={`w-${slice.id}`} id={`wall-${uid}-${slice.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={shade(slice.color, 55 + lit * 20, "#000")} />
                      <stop offset="100%" stopColor={shade(slice.color, 28 + lit * 10, "#000")} />
                    </linearGradient>
                  );
                })}
              </defs>
              {prepared.map((slice) => (
                <g key={`side-${slice.id}`}>
                  <path
                    d={sideWallPath(80, 80, rOuter, slice.start, slice.end, EXTRUDE)}
                    fill={`url(#wall-${uid}-${slice.id})`}
                  />
                  <path
                    d={sideWallPath(80, 80, rInner, slice.start, slice.end, EXTRUDE)}
                    fill={shade(slice.color, 22, "#000")}
                    opacity="0.95"
                  />
                </g>
              ))}
              {total <= 0 ? (
                <>
                  <path d={sideWallPath(80, 80, rOuter, 0, 359.9, EXTRUDE)} fill={shade("var(--paper-deep)", 45)} />
                  <path d={sideWallPath(80, 80, rInner, 0, 359.9, EXTRUDE)} fill={shade("var(--paper-deep)", 30)} />
                </>
              ) : null}
            </svg>
          </div>

          {/* Capas de volumen para el canto */}
          {Array.from({ length: DEPTH_LAYERS }, (_, index) => {
            const fromBottom = DEPTH_LAYERS - 1 - index;
            const t = index / Math.max(DEPTH_LAYERS - 1, 1);
            const dim = 32 + t * 52;
            const y = (fromBottom / DEPTH_LAYERS) * (EXTRUDE * 0.55);
            return (
              <div
                key={fromBottom}
                className="donut-3d-layer"
                style={{
                  transform: `translate3d(0, ${y}px, ${fromBottom * -0.25}px)`,
                  zIndex: index + 2,
                }}
              >
                <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
                  {total <= 0 ? (
                    <circle
                      cx="80"
                      cy="80"
                      r={(rInner + rOuter) / 2}
                      fill="none"
                      stroke={shade("var(--paper-deep)", Math.min(dim, 80))}
                      strokeWidth={rOuter - rInner}
                    />
                  ) : (
                    prepared.map((slice) => (
                      <path
                        key={slice.id}
                        d={donutSegmentPath(80, 80, rInner, rOuter, slice.start, slice.end)}
                        fill={shade(slice.color, dim)}
                      />
                    ))
                  )}
                </svg>
              </div>
            );
          })}

          {/* Cara superior premium */}
          <div
            className="donut-3d-layer donut-3d-top"
            style={{ transform: "translate3d(0, 0, 3px)", zIndex: DEPTH_LAYERS + 8 }}
          >
            <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
              <defs>
                {prepared.map((slice) => {
                  const mid = (slice.start + slice.end) / 2;
                  const lit = 0.5 + 0.5 * Math.cos(((mid - 205) * Math.PI) / 180);
                  return (
                    <radialGradient
                      key={slice.id}
                      id={`top-${uid}-${slice.id}`}
                      cx={`${42 + lit * 18}%`}
                      cy={`${30 + (1 - lit) * 10}%`}
                      r="78%"
                    >
                      <stop offset="0%" stopColor={shade(slice.color, 55 + lit * 35, "#ffffff")} />
                      <stop offset="48%" stopColor={slice.color} />
                      <stop offset="100%" stopColor={shade(slice.color, 68 + (1 - lit) * 18, "#000000")} />
                    </radialGradient>
                  );
                })}
                <linearGradient id={`bevel-out-${uid}`} x1="15%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                  <stop offset="40%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
                </linearGradient>
                <linearGradient id={`bevel-in-${uid}`} x1="20%" y1="10%" x2="80%" y2="90%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
                </linearGradient>
                <linearGradient id={`spec-${uid}`} x1="10%" y1="0%" x2="70%" y2="90%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.72)" />
                  <stop offset="28%" stopColor="rgba(255,255,255,0.18)" />
                  <stop offset="55%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <radialGradient id={`ao-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="70%" stopColor="rgba(0,0,0,0)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.38)" />
                </radialGradient>
                <linearGradient id={`shimmer-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="45%" stopColor="rgba(255,255,255,0.28)" />
                  <stop offset="55%" stopColor="rgba(255,255,255,0.05)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>

              {total <= 0 ? (
                <circle
                  cx="80"
                  cy="80"
                  r={(rInner + rOuter) / 2}
                  fill="none"
                  stroke="var(--paper-deep)"
                  strokeWidth={rOuter - rInner}
                />
              ) : (
                prepared.map((slice) => (
                  <path
                    key={slice.id}
                    d={donutSegmentPath(80, 80, rInner, rOuter, slice.start, slice.end)}
                    fill={`url(#top-${uid}-${slice.id})`}
                    stroke={shade(slice.color, 70, "#000")}
                    strokeWidth="0.35"
                  />
                ))
              )}

              <circle cx="80" cy="80" r={rOuter} fill="none" stroke={`url(#bevel-out-${uid})`} strokeWidth="2.6" />
              <circle cx="80" cy="80" r={rInner} fill="none" stroke={`url(#bevel-in-${uid})`} strokeWidth="2" />
              <circle cx="80" cy="80" r={rInner + 1.2} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.1" />
              <circle
                cx="80"
                cy="80"
                r={(rInner + rOuter) / 2}
                fill="none"
                stroke={`url(#spec-${uid})`}
                strokeWidth={rOuter - rInner - 1}
              />
              <circle cx="80" cy="80" r={rInner - 0.5} fill={`url(#ao-${uid})`} />

              {/* Shimmer barrido */}
              <circle
                className="donut-shimmer"
                cx="80"
                cy="80"
                r={(rInner + rOuter) / 2}
                fill="none"
                stroke={`url(#shimmer-${uid})`}
                strokeWidth={rOuter - rInner}
                strokeDasharray="70 340"
              />
            </svg>
          </div>
        </div>

        <div className="donut-3d-label pointer-events-none absolute inset-x-0 top-[36%] z-20 flex -translate-y-1/2 justify-center px-10">
          <div className="donut-3d-chip max-w-[9.5rem] px-3 py-1.5 text-center">
            <p className="font-display text-sm leading-tight tracking-tight sm:text-base">{center}</p>
          </div>
        </div>
      </div>

      <ul className="space-y-3">
        {slices.length === 0 ? <li className="text-sm text-muted">Todavía no hay nada para graficar.</li> : null}
        {prepared.map((slice) => (
          <li key={slice.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="donut-swatch" style={{ backgroundColor: slice.color }} />
                <span className="truncate font-medium">{slice.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted">{slice.percent}%</span>
            </div>
            <div className="donut-legend-track">
              <div
                className="donut-legend-fill"
                style={{
                  width: `${Math.max(slice.percent, slice.amount > 0 ? 4 : 0)}%`,
                  background: `linear-gradient(90deg, ${shade(slice.color, 75, "#fff")}, ${slice.color})`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
