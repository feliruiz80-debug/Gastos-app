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

export type SummaryLine = {
  id: string;
  label: string;
  amount: number;
};

/** Resumen del mes (o período) por categoría. */
export type SlicePeriodSummary = {
  amount: number;
  lines: SummaryLine[];
};

type PreparedSlice = DonutSlice & {
  start: number;
  end: number;
  percent: number;
  mid: number;
};

type DonutChartProps = {
  slices: DonutSlice[];
  /** Movimientos del período por id de slice (categoría). */
  periodSummaries?: Record<string, SlicePeriodSummary>;
  /** Etiqueta del período, p. ej. "Este mes". */
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

function prepareSlices(slices: DonutSlice[]): { total: number; prepared: PreparedSlice[] } {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  if (total <= 0) return { total: 0, prepared: [] };

  const gap = slices.length > 1 ? 2.4 : 0;
  const usable = 360 - gap * slices.length;
  let cursor = 0;
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

/** Anillo de frente: grueso, centrado, con volumen suave (sin inclinación). */
const R_INNER = 34;
const R_OUTER = 72;
const CX = 80;
const CY = 80;

export function DonutChart({ slices, periodSummaries, periodLabel = "Este mes" }: DonutChartProps) {
  const uid = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { total, prepared } = useMemo(() => prepareSlices(slices), [slices]);
  const aria = prepared.map((s) => `${s.name} ${s.percent}%`).join(", ") || "Sin datos";
  const selected = prepared.find((slice) => slice.id === selectedId) ?? null;
  const selectedPeriod = selectedId ? periodSummaries?.[selectedId] : undefined;
  const summaryAmount = selectedPeriod?.amount ?? selected?.amount ?? 0;
  const summaryLines = selectedPeriod?.lines ?? [];

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
      <div className={`donut-front-scene relative mx-auto h-64 w-64 touch-manipulation sm:h-72 sm:w-72 ${ready ? "donut-front-ready" : ""}`}>
        <div className="donut-front-shadow" aria-hidden="true" />

        <svg viewBox="0 0 160 160" className="donut-front-svg relative z-[1] h-full w-full" role="img" aria-label={aria}>
          <defs>
            {prepared.map((slice) => {
              const hot = activeId === slice.id || selectedId === slice.id;
              return (
                <radialGradient
                  key={slice.id}
                  id={`face-${uid}-${slice.id}`}
                  cx="32%"
                  cy="28%"
                  r="78%"
                >
                  <stop offset="0%" stopColor={shade(slice.color, hot ? 28 : 36, "#ffffff")} />
                  <stop offset="45%" stopColor={shade(slice.color, 82, "#ffffff")} />
                  <stop offset="78%" stopColor={slice.color} />
                  <stop offset="100%" stopColor={shade(slice.color, 72, "#000000")} />
                </radialGradient>
              );
            })}
            <radialGradient id={`rim-${uid}`} cx="30%" cy="24%" r="80%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.22)" />
            </radialGradient>
            <radialGradient id={`hole-${uid}`} cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
            </radialGradient>
            <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="rgba(40,20,80,0.28)" />
            </filter>
          </defs>

          {/* Base oscura para volumen, centrada */}
          <g transform="translate(0 3)" opacity="0.35" aria-hidden="true">
            {total <= 0 ? (
              <circle
                cx={CX}
                cy={CY}
                r={(R_INNER + R_OUTER) / 2}
                fill="none"
                stroke="#7b5cff"
                strokeWidth={R_OUTER - R_INNER}
              />
            ) : (
              prepared.map((slice) => (
                <path
                  key={`base-${slice.id}`}
                  d={donutSegmentPath(CX, CY, R_INNER, R_OUTER, slice.start, slice.end)}
                  fill={shade(slice.color, 35, "#000")}
                />
              ))
            )}
          </g>

          <g filter={`url(#soft-${uid})`}>
            {total <= 0 ? (
              <circle
                cx={CX}
                cy={CY}
                r={(R_INNER + R_OUTER) / 2}
                fill="none"
                stroke="#7b5cff"
                strokeWidth={R_OUTER - R_INNER}
              />
            ) : (
              prepared.map((slice) => {
                const hot =
                  (activeId === null && selectedId === null) ||
                  activeId === slice.id ||
                  selectedId === slice.id;
                return (
                  <path
                    key={slice.id}
                    className="donut-slice"
                    d={donutSegmentPath(CX, CY, R_INNER, R_OUTER, slice.start, slice.end)}
                    fill={`url(#face-${uid}-${slice.id})`}
                    opacity={hot ? 1 : 0.38}
                    role="button"
                    tabIndex={0}
                    aria-label={`${slice.name}, ${slice.percent}%, ${formatMoney(slice.amount)}. Tocá para ver el resumen del mes.`}
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
          </g>

          {/* Brillo y bisel, sin tapar clics */}
          <circle
            cx={CX}
            cy={CY}
            r={R_OUTER - 0.8}
            fill="none"
            stroke={`url(#rim-${uid})`}
            strokeWidth="2.6"
            pointerEvents="none"
          />
          <circle
            cx={CX}
            cy={CY}
            r={R_INNER + 0.8}
            fill="none"
            stroke={`url(#hole-${uid})`}
            strokeWidth="2"
            pointerEvents="none"
          />
          <circle
            cx={CX}
            cy={CY}
            r={(R_INNER + R_OUTER) / 2}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={Math.max(R_OUTER - R_INNER - 10, 8)}
            pointerEvents="none"
            style={{ mixBlendMode: "soft-light" }}
          />
        </svg>
      </div>

      {selected ? (
        <div
          className="donut-summary-card"
          role="dialog"
          aria-label={`Resumen del mes · ${selected.name}`}
          style={{
            borderColor: withAlpha(selected.color, 0.4),
            background: `linear-gradient(160deg, ${withAlpha(selected.color, 0.18)}, color-mix(in srgb, var(--card) 88%, ${selected.color} 12%))`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Resumen del mes</p>
              <h3 className="mt-1 flex items-center gap-2 font-display text-2xl tracking-tight">
                <span className="donut-swatch h-3 w-3" style={{ backgroundColor: selected.color }} />
                <span className="truncate">{selected.name}</span>
              </h3>
              <p className="mt-1 text-sm text-muted">{periodLabel}</p>
            </div>
            <button type="button" className="rounded-full px-2 py-1 text-sm text-muted" onClick={() => setSelectedId(null)}>
              Cerrar
            </button>
          </div>

          <p className="mt-4 font-display text-3xl tracking-tight tabular-nums">{formatMoney(summaryAmount)}</p>
          <p className="mt-1 text-sm text-muted">
            Monto del mes · {selected.percent}% del total
          </p>

          {summaryLines.length > 0 ? (
            <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto border-t border-line/70 pt-3">
              {summaryLines.map((line) => (
                <li key={line.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">{line.label}</span>
                  <span className="shrink-0 tabular-nums font-medium">{formatMoney(line.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border-t border-line/70 pt-3 text-sm text-muted">
              Sin movimientos este mes en esta categoría.
            </p>
          )}
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
                  borderColor: withAlpha(slice.color, hot ? 0.5 : 0.22),
                  background: withAlpha(slice.color, hot ? 0.2 : 0.1),
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
