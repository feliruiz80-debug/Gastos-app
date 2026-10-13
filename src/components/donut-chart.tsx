"use client";

import { useId, useMemo } from "react";

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

function prepareSlices(slices: Slice[]): { total: number; prepared: PreparedSlice[] } {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  if (total <= 0) return { total: 0, prepared: [] };

  const gap = slices.length > 1 ? 2.2 : 0;
  const usable = 360 - gap * slices.length;
  let cursor = 0;
  const prepared: PreparedSlice[] = [];

  for (const slice of slices) {
    const sweep = Math.max((slice.amount / total) * usable, 0.8);
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

function RingFaces({
  prepared,
  total,
  rInner,
  rOuter,
  dim,
  gradientPrefix,
}: {
  prepared: PreparedSlice[];
  total: number;
  rInner: number;
  rOuter: number;
  dim: number;
  gradientPrefix?: string;
}) {
  if (total <= 0) {
    return (
      <circle
        cx="80"
        cy="80"
        r={(rInner + rOuter) / 2}
        fill="none"
        stroke={shade("var(--paper-deep)", Math.min(dim, 85))}
        strokeWidth={rOuter - rInner}
      />
    );
  }

  return (
    <>
      {prepared.map((slice) => (
        <path
          key={slice.id}
          d={donutSegmentPath(80, 80, rInner, rOuter, slice.start, slice.end)}
          fill={gradientPrefix ? `url(#${gradientPrefix}-${slice.id})` : shade(slice.color, dim)}
          stroke={shade(slice.color, Math.max(dim - 18, 25), "#000")}
          strokeWidth="0.4"
        />
      ))}
    </>
  );
}

const DEPTH = 22;

export function DonutChart({ slices, center }: { slices: Slice[]; center: string }) {
  const uid = useId().replace(/:/g, "");
  const { total, prepared } = useMemo(() => prepareSlices(slices), [slices]);
  const rInner = 34;
  const rOuter = 66;
  const label = slices.map((slice) => `${slice.name} ${slice.amount}`).join(", ");

  return (
    <div className="grid items-center gap-7 sm:grid-cols-[240px_1fr]">
      <div className="donut-3d-scene relative mx-auto h-56 w-56">
        <div className="donut-3d-shadow" aria-hidden="true" />
        <div className="donut-3d-glow" aria-hidden="true" />

        <div className="donut-3d-tilt donut-3d-spin" role="img" aria-label={label || "Sin datos"}>
          {/* Núcleo / oclusión del hueco */}
          <div className="donut-3d-core" aria-hidden="true" />

          {Array.from({ length: DEPTH }, (_, index) => {
            const fromBottom = DEPTH - 1 - index;
            const t = index / Math.max(DEPTH - 1, 1);
            // Pared lateral: más oscura abajo, un poco más clara arriba.
            const dim = 28 + t * 55;
            return (
              <div
                key={fromBottom}
                className="donut-3d-layer"
                style={{
                  transform: `translate3d(0, ${fromBottom * 1.35}px, ${fromBottom * -0.45}px)`,
                  zIndex: index + 1,
                }}
              >
                <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
                  <RingFaces prepared={prepared} total={total} rInner={rInner} rOuter={rOuter} dim={dim} />
                </svg>
              </div>
            );
          })}

          {/* Cara superior con gradientes por porción + brillos */}
          <div className="donut-3d-layer donut-3d-top" style={{ transform: "translate3d(0, 0, 2px)", zIndex: DEPTH + 3 }}>
            <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
              <defs>
                {prepared.map((slice) => {
                  const mid = (slice.start + slice.end) / 2;
                  // Luz desde arriba-izquierda: las porciones “de frente” se ven más claras.
                  const lit = 0.5 + 0.5 * Math.cos(((mid - 210) * Math.PI) / 180);
                  const lightMix = 62 + lit * 30;
                  const darkMix = 78 + (1 - lit) * 14;
                  return (
                    <linearGradient
                      key={slice.id}
                      id={`top-${uid}-${slice.id}`}
                      x1="18%"
                      y1="8%"
                      x2="88%"
                      y2="92%"
                    >
                      <stop offset="0%" stopColor={shade(slice.color, lightMix, "#ffffff")} />
                      <stop offset="55%" stopColor={slice.color} />
                      <stop offset="100%" stopColor={shade(slice.color, darkMix, "#000000")} />
                    </linearGradient>
                  );
                })}
                <radialGradient id={`hole-${uid}`} cx="38%" cy="32%" r="70%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                  <stop offset="55%" stopColor="rgba(0,0,0,0)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
                </radialGradient>
                <linearGradient id={`rim-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                  <stop offset="45%" stopColor="rgba(255,255,255,0.08)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
                </linearGradient>
                <linearGradient id={`spec-${uid}`} x1="20%" y1="0%" x2="70%" y2="80%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
                  <stop offset="35%" stopColor="rgba(255,255,255,0.12)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>

              <RingFaces
                prepared={prepared}
                total={total}
                rInner={rInner}
                rOuter={rOuter}
                dim={100}
                gradientPrefix={`top-${uid}`}
              />

              {/* Bordes biselados */}
              <circle cx="80" cy="80" r={rOuter} fill="none" stroke={`url(#rim-${uid})`} strokeWidth="2.2" />
              <circle cx="80" cy="80" r={rInner} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.6" />
              <circle cx="80" cy="80" r={rInner + 0.8} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.2" />
              <circle cx="80" cy="80" r={(rInner + rOuter) / 2} fill="none" stroke={`url(#spec-${uid})`} strokeWidth={rOuter - rInner} />
              <circle cx="80" cy="80" r={rInner - 1} fill={`url(#hole-${uid})`} />
            </svg>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[38%] z-20 flex -translate-y-1/2 flex-col items-center justify-center px-11 text-center">
          <p className="font-display text-base leading-tight tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-lg">
            {center}
          </p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {slices.length === 0 ? <li className="text-sm text-muted">Todavía no hay nada para graficar.</li> : null}
        {prepared.map((slice) => (
          <li key={slice.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="donut-swatch" style={{ backgroundColor: slice.color }} />
              <span className="truncate">{slice.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted">{slice.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
