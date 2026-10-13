"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { withAlpha } from "@/lib/colors";

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
  mid: number;
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
  return [
    `M ${x1} ${y1}`,
    `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x2} ${y2 + depth}`,
    `A ${r} ${r} 0 ${large} 0 ${x1} ${y1 + depth}`,
    "Z",
  ].join(" ");
}

function prepareSlices(slices: Slice[]): { total: number; prepared: PreparedSlice[] } {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  if (total <= 0) return { total: 0, prepared: [] };

  const gap = slices.length > 1 ? 3.5 : 0;
  const usable = 360 - gap * slices.length;
  let cursor = -20;
  const prepared: PreparedSlice[] = [];

  for (const slice of slices) {
    const sweep = Math.max((slice.amount / total) * usable, 1.6);
    const start = cursor;
    const end = cursor + sweep;
    prepared.push({
      ...slice,
      start,
      end,
      mid: (start + end) / 2,
      percent: Math.round((slice.amount / total) * 100),
    });
    cursor += sweep + gap;
  }

  return { total, prepared };
}

const DEPTH_LAYERS = 18;
const EXTRUDE = 28;

export function DonutChart({ slices }: { slices: Slice[] }) {
  const uid = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { total, prepared } = useMemo(() => prepareSlices(slices), [slices]);
  const rInner = 36;
  const rOuter = 72;
  const aria = prepared.map((s) => `${s.name} ${s.percent}%`).join(", ") || "Sin datos";

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="donut-pro flex flex-col items-center gap-5">
      <div
        className={`donut-3d-scene relative mx-auto h-64 w-64 touch-manipulation sm:h-72 sm:w-72 ${ready ? "donut-3d-ready" : ""}`}
      >
        <div className="donut-3d-shadow" aria-hidden="true" />
        <div className="donut-3d-glow" aria-hidden="true" />

        <div
          className="donut-3d-tilt"
          role="img"
          aria-label={aria}
          style={{ transform: "rotateX(36deg) rotateZ(-4deg)" }}
        >
          <div
            className="donut-3d-layer"
            style={{ transform: `translate3d(0, ${EXTRUDE * 0.48}px, ${-EXTRUDE * 0.3}px)`, zIndex: 0 }}
          >
            <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
              {total <= 0 ? (
                <circle
                  cx="80"
                  cy="80"
                  r={(rInner + rOuter) / 2}
                  fill="none"
                  stroke={shade("var(--paper-deep)", 35)}
                  strokeWidth={rOuter - rInner}
                />
              ) : (
                prepared.map((slice) => (
                  <path
                    key={`bottom-${slice.id}`}
                    d={donutSegmentPath(80, 80, rInner, rOuter, slice.start, slice.end)}
                    fill={shade(slice.color, 22, "#000")}
                  />
                ))
              )}
            </svg>
          </div>

          <div className="donut-3d-layer donut-3d-walls" style={{ zIndex: 1 }}>
            <svg viewBox="0 0 160 160" className="h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                {prepared.map((slice) => {
                  const lit = 0.5 + 0.5 * Math.cos(((slice.mid - 195) * Math.PI) / 180);
                  return (
                    <linearGradient key={`w-${slice.id}`} id={`wall-${uid}-${slice.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={shade(slice.color, 50 + lit * 16, "#000")} />
                      <stop offset="100%" stopColor={shade(slice.color, 18, "#000")} />
                    </linearGradient>
                  );
                })}
              </defs>
              {prepared.map((slice) => (
                <g key={`side-${slice.id}`}>
                  <path d={sideWallPath(80, 80, rOuter, slice.start, slice.end, EXTRUDE)} fill={`url(#wall-${uid}-${slice.id})`} />
                  <path d={sideWallPath(80, 80, rInner, slice.start, slice.end, EXTRUDE)} fill={shade(slice.color, 12, "#000")} />
                </g>
              ))}
              {total <= 0 ? (
                <>
                  <path d={sideWallPath(80, 80, rOuter, 0, 359.9, EXTRUDE)} fill={shade("var(--paper-deep)", 40)} />
                  <path d={sideWallPath(80, 80, rInner, 0, 359.9, EXTRUDE)} fill={shade("var(--paper-deep)", 25)} />
                </>
              ) : null}
            </svg>
          </div>

          {Array.from({ length: DEPTH_LAYERS }, (_, index) => {
            const fromBottom = DEPTH_LAYERS - 1 - index;
            const t = index / Math.max(DEPTH_LAYERS - 1, 1);
            const dim = 36 + t * 50;
            const y = (fromBottom / DEPTH_LAYERS) * (EXTRUDE * 0.45);
            const z = (fromBottom / DEPTH_LAYERS) * -9;
            return (
              <div
                key={fromBottom}
                className="donut-3d-layer"
                style={{ transform: `translate3d(0, ${y}px, ${z}px)`, zIndex: index + 2 }}
              >
                <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
                  {total <= 0 ? (
                    <circle
                      cx="80"
                      cy="80"
                      r={(rInner + rOuter) / 2}
                      fill="none"
                      stroke={shade("var(--paper-deep)", Math.min(dim, 78))}
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

          <div className="donut-3d-layer donut-3d-top" style={{ transform: "translate3d(0, 0, 3px)", zIndex: DEPTH_LAYERS + 10 }}>
            <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
              <defs>
                {prepared.map((slice) => {
                  const lit = 0.5 + 0.5 * Math.cos(((slice.mid - 205) * Math.PI) / 180);
                  const hot = activeId === slice.id;
                  return (
                    <radialGradient
                      key={slice.id}
                      id={`top-${uid}-${slice.id}`}
                      cx={`${36 + lit * 24}%`}
                      cy={`${24 + (1 - lit) * 16}%`}
                      r="84%"
                    >
                      <stop offset="0%" stopColor={shade(slice.color, hot ? 35 : 42 + lit * 30, "#ffffff")} />
                      <stop offset="55%" stopColor={slice.color} />
                      <stop offset="100%" stopColor={shade(slice.color, 64 + (1 - lit) * 18, "#000000")} />
                    </radialGradient>
                  );
                })}
                <linearGradient id={`bevel-out-${uid}`} x1="10%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
                  <stop offset="48%" stopColor="rgba(255,255,255,0.06)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
                </linearGradient>
                <linearGradient id={`bevel-in-${uid}`} x1="18%" y1="8%" x2="82%" y2="92%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
                </linearGradient>
                <linearGradient id={`spec-${uid}`} x1="6%" y1="0%" x2="68%" y2="90%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                  <stop offset="32%" stopColor="rgba(255,255,255,0.08)" />
                  <stop offset="60%" stopColor="rgba(255,255,255,0)" />
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
                prepared.map((slice) => {
                  const hot = activeId === null || activeId === slice.id;
                  return (
                    <path
                      key={slice.id}
                      className="donut-slice"
                      d={donutSegmentPath(80, 80, rInner, rOuter, slice.start, slice.end)}
                      fill={`url(#top-${uid}-${slice.id})`}
                      opacity={hot ? 1 : 0.45}
                      onPointerEnter={() => setActiveId(slice.id)}
                      onPointerLeave={() => setActiveId(null)}
                    />
                  );
                })
              )}

              <circle cx="80" cy="80" r={rOuter} fill="none" stroke={`url(#bevel-out-${uid})`} strokeWidth="2.4" />
              <circle cx="80" cy="80" r={rInner} fill="none" stroke={`url(#bevel-in-${uid})`} strokeWidth="1.8" />
              <circle
                cx="80"
                cy="80"
                r={(rInner + rOuter) / 2}
                fill="none"
                stroke={`url(#spec-${uid})`}
                strokeWidth={rOuter - rInner - 1}
              />
            </svg>
          </div>
        </div>
      </div>

      {slices.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay nada para graficar.</p>
      ) : (
        <div className="donut-chips flex max-w-lg flex-wrap items-center justify-center gap-2">
          {prepared.map((slice) => {
            const hot = activeId === slice.id;
            return (
              <button
                key={slice.id}
                type="button"
                className={`donut-chip ${hot ? "donut-chip-hot" : ""}`}
                style={{
                  borderColor: withAlpha(slice.color, hot ? 0.4 : 0.18),
                  background: withAlpha(slice.color, hot ? 0.14 : 0.08),
                }}
                onPointerEnter={() => setActiveId(slice.id)}
                onPointerLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(slice.id)}
                onBlur={() => setActiveId(null)}
              >
                <span className="donut-swatch" style={{ backgroundColor: slice.color }} />
                <span className="truncate">{slice.name}</span>
                <span className="tabular-nums font-medium text-muted">{slice.percent}%</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
