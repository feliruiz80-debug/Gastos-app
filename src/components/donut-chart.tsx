"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";
import { withAlpha } from "@/lib/colors";

export type DonutSlice = {
  id: string;
  name: string;
  amount: number;
  color: string;
};

export type DayLine = {
  id: string;
  label: string;
  amount: number;
};

export type SliceDaySummary = {
  /** Monto del día para esta categoría. */
  amount: number;
  /** Etiqueta de fecha, p. ej. "Hoy" o "Ayer". */
  dateLabel: string;
  /** Líneas del resumen (notas / movimientos del día). */
  lines: DayLine[];
};

type PreparedSlice = DonutSlice & {
  start: number;
  end: number;
  percent: number;
  mid: number;
};

type DonutChartProps = {
  slices: DonutSlice[];
  /** Resumen del día por id de slice (categoría). Si falta, el popup solo muestra el monto del período. */
  daySummaries?: Record<string, SliceDaySummary>;
  /** Etiqueta del período total, p. ej. "Este mes". */
  periodLabel?: string;
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

function prepareSlices(slices: DonutSlice[]): { total: number; prepared: PreparedSlice[] } {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  if (total <= 0) return { total: 0, prepared: [] };

  const gap = slices.length > 1 ? 2.8 : 0;
  const usable = 360 - gap * slices.length;
  let cursor = -28;
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

const DEPTH_LAYERS = 22;
const EXTRUDE = 34;

export function DonutChart({ slices, daySummaries, periodLabel = "Período" }: DonutChartProps) {
  const uid = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { total, prepared } = useMemo(() => prepareSlices(slices), [slices]);
  const rInner = 34;
  const rOuter = 74;
  const aria = prepared.map((s) => `${s.name} ${s.percent}%`).join(", ") || "Sin datos";
  const selected = prepared.find((slice) => slice.id === selectedId) ?? null;
  const selectedDay = selectedId ? daySummaries?.[selectedId] : undefined;
  const legendDots = prepared.slice(0, 3);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const selectSlice = (id: string) => {
    setSelectedId((current) => (current === id ? null : id));
    setActiveId(id);
  };

  return (
    <div className="donut-pro flex flex-col items-center gap-4">
      <div className={`donut-clay ${ready ? "donut-clay-ready" : ""}`}>
        <div className="donut-clay-rail" aria-hidden="true" />
        <div className="donut-clay-panel">
          <div className={`donut-3d-scene relative mx-auto h-60 w-60 touch-manipulation sm:h-72 sm:w-72 ${ready ? "donut-3d-ready" : ""}`}>
            <div className="donut-3d-shadow" aria-hidden="true" />
            <div className="donut-3d-glow" aria-hidden="true" />

            <div
              className="donut-3d-tilt"
              role="img"
              aria-label={aria}
              style={{ transform: "rotateX(40deg) rotateZ(-8deg)" }}
            >
              <div
                className="donut-3d-layer"
                style={{ transform: `translate3d(0, ${EXTRUDE * 0.5}px, ${-EXTRUDE * 0.28}px)`, zIndex: 0 }}
              >
                <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
                  {total <= 0 ? (
                    <circle
                      cx="80"
                      cy="80"
                      r={(rInner + rOuter) / 2}
                      fill="none"
                      stroke={shade("#6b5ce7", 40, "#000")}
                      strokeWidth={rOuter - rInner}
                    />
                  ) : (
                    prepared.map((slice) => (
                      <path
                        key={`bottom-${slice.id}`}
                        d={donutSegmentPath(80, 80, rInner, rOuter, slice.start, slice.end)}
                        fill={shade(slice.color, 20, "#000")}
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
                          <stop offset="0%" stopColor={shade(slice.color, 48 + lit * 18, "#000")} />
                          <stop offset="100%" stopColor={shade(slice.color, 16, "#000")} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  {prepared.map((slice) => (
                    <g key={`side-${slice.id}`}>
                      <path d={sideWallPath(80, 80, rOuter, slice.start, slice.end, EXTRUDE)} fill={`url(#wall-${uid}-${slice.id})`} />
                      <path d={sideWallPath(80, 80, rInner, slice.start, slice.end, EXTRUDE)} fill={shade(slice.color, 10, "#000")} />
                    </g>
                  ))}
                  {total <= 0 ? (
                    <>
                      <path d={sideWallPath(80, 80, rOuter, 0, 359.9, EXTRUDE)} fill={shade("#6b5ce7", 38)} />
                      <path d={sideWallPath(80, 80, rInner, 0, 359.9, EXTRUDE)} fill={shade("#6b5ce7", 22)} />
                    </>
                  ) : null}
                </svg>
              </div>

              {Array.from({ length: DEPTH_LAYERS }, (_, index) => {
                const fromBottom = DEPTH_LAYERS - 1 - index;
                const t = index / Math.max(DEPTH_LAYERS - 1, 1);
                const dim = 34 + t * 52;
                const y = (fromBottom / DEPTH_LAYERS) * (EXTRUDE * 0.48);
                const z = (fromBottom / DEPTH_LAYERS) * -10;
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
                          stroke={shade("#6b5ce7", Math.min(dim, 78))}
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

              <div className="donut-3d-layer donut-3d-top" style={{ transform: "translate3d(0, 0, 4px)", zIndex: DEPTH_LAYERS + 10 }}>
                <svg viewBox="0 0 160 160" className="h-full w-full" aria-hidden="true">
                  <defs>
                    {prepared.map((slice) => {
                      const lit = 0.5 + 0.5 * Math.cos(((slice.mid - 205) * Math.PI) / 180);
                      const hot = activeId === slice.id || selectedId === slice.id;
                      return (
                        <radialGradient
                          key={slice.id}
                          id={`top-${uid}-${slice.id}`}
                          cx={`${34 + lit * 26}%`}
                          cy={`${20 + (1 - lit) * 14}%`}
                          r="88%"
                        >
                          <stop offset="0%" stopColor={shade(slice.color, hot ? 28 : 38 + lit * 34, "#ffffff")} />
                          <stop offset="42%" stopColor={shade(slice.color, 78, "#ffffff")} />
                          <stop offset="72%" stopColor={slice.color} />
                          <stop offset="100%" stopColor={shade(slice.color, 62 + (1 - lit) * 20, "#000000")} />
                        </radialGradient>
                      );
                    })}
                    <linearGradient id={`bevel-out-${uid}`} x1="10%" y1="0%" x2="90%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
                      <stop offset="42%" stopColor="rgba(255,255,255,0.08)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.38)" />
                    </linearGradient>
                    <linearGradient id={`bevel-in-${uid}`} x1="18%" y1="8%" x2="82%" y2="92%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.34)" />
                    </linearGradient>
                    <linearGradient id={`spec-${uid}`} x1="4%" y1="0%" x2="72%" y2="88%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.72)" />
                      <stop offset="22%" stopColor="rgba(255,255,255,0.22)" />
                      <stop offset="48%" stopColor="rgba(255,255,255,0.04)" />
                      <stop offset="70%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>

                  {total <= 0 ? (
                    <circle
                      cx="80"
                      cy="80"
                      r={(rInner + rOuter) / 2}
                      fill="none"
                      stroke="#6b5ce7"
                      strokeWidth={rOuter - rInner}
                    />
                  ) : (
                    prepared.map((slice) => {
                      const hot = activeId === null && selectedId === null || activeId === slice.id || selectedId === slice.id;
                      return (
                        <path
                          key={slice.id}
                          className="donut-slice"
                          d={donutSegmentPath(80, 80, rInner, rOuter, slice.start, slice.end)}
                          fill={`url(#top-${uid}-${slice.id})`}
                          opacity={hot ? 1 : 0.42}
                          role="button"
                          tabIndex={0}
                          aria-label={`${slice.name}, ${slice.percent}%, ${formatMoney(slice.amount)}. Tocá para ver el resumen del día.`}
                          aria-pressed={selectedId === slice.id}
                          onPointerEnter={() => setActiveId(slice.id)}
                          onPointerLeave={() => setActiveId(null)}
                          onClick={() => selectSlice(slice.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              selectSlice(slice.id);
                            }
                          }}
                        />
                      );
                    })
                  )}

                  <circle
                    cx="80"
                    cy="80"
                    r={rOuter}
                    fill="none"
                    stroke={`url(#bevel-out-${uid})`}
                    strokeWidth="2.8"
                    pointerEvents="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={rInner}
                    fill="none"
                    stroke={`url(#bevel-in-${uid})`}
                    strokeWidth="2"
                    pointerEvents="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r={(rInner + rOuter) / 2}
                    fill="none"
                    stroke={`url(#spec-${uid})`}
                    strokeWidth={rOuter - rInner - 2}
                    pointerEvents="none"
                  />
                </svg>
              </div>
            </div>

            {legendDots.length > 0 ? (
              <ul className="donut-clay-legend" aria-hidden="true">
                {legendDots.map((slice) => (
                  <li key={slice.id} className="donut-clay-dot" style={{ backgroundColor: slice.color }} />
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      {selected ? (
        <div
          className="donut-day-card"
          role="dialog"
          aria-label={`Resumen del día · ${selected.name}`}
          style={{
            borderColor: withAlpha(selected.color, 0.35),
            background: `linear-gradient(160deg, ${withAlpha(selected.color, 0.16)}, color-mix(in srgb, var(--card) 88%, ${selected.color} 12%))`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Resumen del día</p>
              <h3 className="mt-1 flex items-center gap-2 font-display text-2xl tracking-tight">
                <span className="donut-swatch h-3 w-3" style={{ backgroundColor: selected.color }} />
                <span className="truncate">{selected.name}</span>
              </h3>
              <p className="mt-1 text-sm text-muted">{selectedDay?.dateLabel ?? "Hoy"}</p>
            </div>
            <button type="button" className="rounded-full px-2 py-1 text-sm text-muted" onClick={() => setSelectedId(null)}>
              Cerrar
            </button>
          </div>

          <p className="mt-4 font-display text-3xl tracking-tight tabular-nums">
            {formatMoney(selectedDay?.amount ?? 0)}
          </p>
          <p className="mt-1 text-sm text-muted">Monto del resumen</p>

          {selectedDay && selectedDay.lines.length > 0 ? (
            <ul className="mt-4 space-y-2 border-t border-line/70 pt-3">
              {selectedDay.lines.map((line) => (
                <li key={line.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{line.label}</span>
                  <span className="shrink-0 tabular-nums font-medium">{formatMoney(line.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border-t border-line/70 pt-3 text-sm text-muted">Sin movimientos hoy en esta categoría.</p>
          )}

          <p className="mt-4 text-xs text-muted">
            {periodLabel}: {formatMoney(selected.amount)} · {selected.percent}% del total
          </p>
        </div>
      ) : null}

      {slices.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay nada para graficar.</p>
      ) : (
        <div className="donut-chips flex max-w-lg flex-wrap items-center justify-center gap-2">
          {prepared.map((slice) => {
            const hot = activeId === slice.id || selectedId === slice.id;
            return (
              <button
                key={slice.id}
                type="button"
                className={`donut-chip ${hot ? "donut-chip-hot" : ""}`}
                style={{
                  borderColor: withAlpha(slice.color, hot ? 0.45 : 0.18),
                  background: withAlpha(slice.color, hot ? 0.16 : 0.08),
                }}
                aria-pressed={selectedId === slice.id}
                onPointerEnter={() => setActiveId(slice.id)}
                onPointerLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(slice.id)}
                onBlur={() => setActiveId(null)}
                onClick={() => selectSlice(slice.id)}
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
