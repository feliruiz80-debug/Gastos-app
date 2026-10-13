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

  const gap = slices.length > 1 ? 3.4 : 0;
  const usable = 360 - gap * slices.length;
  let cursor = -24;
  const prepared: PreparedSlice[] = [];

  for (const slice of slices) {
    const sweep = Math.max((slice.amount / total) * usable, 1.2);
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

const DEPTH_LAYERS = 34;
const EXTRUDE = 54;

export function DonutChart({ slices, center }: { slices: Slice[]; center: string }) {
  const uid = useId().replace(/:/g, "");
  const sceneRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const { total, prepared } = useMemo(() => prepareSlices(slices), [slices]);
  const rInner = 30;
  const rOuter = 70;
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
      setTilt({ x: py * -8, y: px * 10 });
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
    <div className="donut-pro flex flex-col items-center gap-6">
      <div
        ref={sceneRef}
        className={`donut-3d-scene relative mx-auto h-72 w-72 touch-manipulation sm:h-80 sm:w-80 ${ready ? "donut-3d-ready" : ""}`}
      >
        <div className="donut-3d-shadow" aria-hidden="true" />
        <div className="donut-3d-glow" aria-hidden="true" />

        <div
          className="donut-3d-tilt donut-3d-spin"
          role="img"
          aria-label={label || "Sin datos"}
          style={{
            transform: `rotateX(${74 + tilt.x}deg) rotateZ(${-16 + tilt.y}deg)`,
          }}
        >
          {/* Cara inferior (más oscura) para que se note el cuerpo sólido */}
          <div
            className="donut-3d-layer"
            style={{ transform: `translate3d(0, ${EXTRUDE * 0.92}px, -2px)`, zIndex: 0 }}
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
                    fill={shade(slice.color, 24, "#000")}
                  />
                ))
              )}
            </svg>
          </div>

          {/* Paredes laterales gruesas */}
          <div className="donut-3d-layer donut-3d-walls" style={{ zIndex: 1 }}>
            <svg viewBox="0 0 160 160" className="h-full w-full overflow-visible" aria-hidden="true">
              <defs>
                {prepared.map((slice) => {
                  const lit = 0.5 + 0.5 * Math.cos(((slice.mid - 195) * Math.PI) / 180);
                  return (
                    <linearGradient key={`w-${slice.id}`} id={`wall-${uid}-${slice.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={shade(slice.color, 48 + lit * 22, "#000")} />
                      <stop offset="55%" stopColor={shade(slice.color, 34 + lit * 12, "#000")} />
                      <stop offset="100%" stopColor={shade(slice.color, 18, "#000")} />
                    </linearGradient>
                  );
                })}
              </defs>
              {prepared.map((slice) => (
                <g key={`side-${slice.id}`}>
                  <path d={sideWallPath(80, 80, rOuter, slice.start, slice.end, EXTRUDE)} fill={`url(#wall-${uid}-${slice.id})`} />
                  <path d={sideWallPath(80, 80, rInner, slice.start, slice.end, EXTRUDE)} fill={shade(slice.color, 16, "#000")} />
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

          {/* Capas de canto */}
          {Array.from({ length: DEPTH_LAYERS }, (_, index) => {
            const fromBottom = DEPTH_LAYERS - 1 - index;
            const t = index / Math.max(DEPTH_LAYERS - 1, 1);
            const dim = 26 + t * 58;
            const y = (fromBottom / DEPTH_LAYERS) * (EXTRUDE * 0.88);
            return (
              <div
                key={fromBottom}
                className="donut-3d-layer"
                style={{
                  transform: `translate3d(0, ${y}px, ${fromBottom * -0.2}px)`,
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

          {/* Cara superior */}
          <div className="donut-3d-layer donut-3d-top" style={{ transform: "translate3d(0, 0, 4px)", zIndex: DEPTH_LAYERS + 10 }}>
            <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
              <defs>
                {prepared.map((slice) => {
                  const lit = 0.5 + 0.5 * Math.cos(((slice.mid - 205) * Math.PI) / 180);
                  return (
                    <radialGradient
                      key={slice.id}
                      id={`top-${uid}-${slice.id}`}
                      cx={`${40 + lit * 20}%`}
                      cy={`${28 + (1 - lit) * 12}%`}
                      r="80%"
                    >
                      <stop offset="0%" stopColor={shade(slice.color, 50 + lit * 38, "#ffffff")} />
                      <stop offset="46%" stopColor={slice.color} />
                      <stop offset="100%" stopColor={shade(slice.color, 66 + (1 - lit) * 20, "#000000")} />
                    </radialGradient>
                  );
                })}
                <linearGradient id={`bevel-out-${uid}`} x1="12%" y1="0%" x2="90%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
                  <stop offset="42%" stopColor="rgba(255,255,255,0.1)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
                </linearGradient>
                <linearGradient id={`bevel-in-${uid}`} x1="18%" y1="8%" x2="82%" y2="92%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.42)" />
                </linearGradient>
                <linearGradient id={`spec-${uid}`} x1="8%" y1="0%" x2="72%" y2="88%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
                  <stop offset="26%" stopColor="rgba(255,255,255,0.16)" />
                  <stop offset="52%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <radialGradient id={`ao-${uid}`} cx="50%" cy="48%" r="52%">
                  <stop offset="62%" stopColor="rgba(0,0,0,0)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.42)" />
                </radialGradient>
                <linearGradient id={`shimmer-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="46%" stopColor="rgba(255,255,255,0.32)" />
                  <stop offset="54%" stopColor="rgba(255,255,255,0.04)" />
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
                  />
                ))
              )}

              <circle cx="80" cy="80" r={rOuter} fill="none" stroke={`url(#bevel-out-${uid})`} strokeWidth="3" />
              <circle cx="80" cy="80" r={rInner} fill="none" stroke={`url(#bevel-in-${uid})`} strokeWidth="2.2" />
              <circle cx="80" cy="80" r={rInner + 1.4} fill="none" stroke="rgba(0,0,0,0.38)" strokeWidth="1.2" />
              <circle
                cx="80"
                cy="80"
                r={(rInner + rOuter) / 2}
                fill="none"
                stroke={`url(#spec-${uid})`}
                strokeWidth={rOuter - rInner - 1}
              />
              <circle cx="80" cy="80" r={rInner - 0.4} fill={`url(#ao-${uid})`} />
              <circle
                className="donut-shimmer"
                cx="80"
                cy="80"
                r={(rInner + rOuter) / 2}
                fill="none"
                stroke={`url(#shimmer-${uid})`}
                strokeWidth={rOuter - rInner}
                strokeDasharray="80 360"
              />
            </svg>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[34%] z-20 flex -translate-y-1/2 justify-center px-12">
          <div className="donut-3d-chip px-4 py-2 text-center">
            <p className="font-display text-base leading-tight tracking-tight sm:text-lg">{center}</p>
          </div>
        </div>
      </div>

      {slices.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay nada para graficar.</p>
      ) : (
        <div className="donut-chips flex max-w-lg flex-wrap items-center justify-center gap-2">
          {prepared.map((slice) => (
            <span key={slice.id} className="donut-chip">
              <span className="donut-swatch" style={{ backgroundColor: slice.color }} />
              <span className="truncate">{slice.name}</span>
              <span className="tabular-nums text-muted">{slice.percent}%</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
