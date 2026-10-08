import { useEffect, useMemo, useState } from "react";
import { SHEET_URL } from "./config";
import { Cuentas } from "./components/Cuentas";
import { Categorias } from "./components/Categorias";
import { Movimientos } from "./components/Movimientos";
import { Resumen } from "./components/Resumen";
import { filterPeriod, yearsIn } from "./lib/aggregate";
import { formatFetchedAt, monthName } from "./lib/format";
import type { Period, SheetsPayload } from "./types";

type Tab = "resumen" | "movimientos" | "cuentas" | "categorias";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "movimientos", label: "Movimientos" },
  { id: "cuentas", label: "Cuentas" },
  { id: "categorias", label: "Categorías" },
];

const today = new Date();

export function App() {
  const [data, setData] = useState<SheetsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("resumen");
  const [period, setPeriod] = useState<Period>({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });

  async function loadSheets() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sheets?t=${Date.now()}`, { cache: "no-store" });
      const body = (await response.json()) as SheetsPayload & { error?: string };
      if (!response.ok) throw new Error(body.error || "No se pudo leer la hoja.");
      setData(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo leer la hoja.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSheets();
  }, []);

  const years = useMemo(() => yearsIn(data?.movimientos ?? []), [data]);
  const periodMovements = useMemo(
    () => filterPeriod(data?.movimientos ?? [], period),
    [data, period],
  );

  const periodLabel =
    period.year === "all"
      ? "Todo el historial"
      : period.month === "all"
        ? String(period.year)
        : `${monthName(period.month)} ${period.year}`;

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="mark" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <path d="M8 21c2.2-4.8 4.4-7 8-7s5.2 3.4 8 7" stroke="#e7c27a" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="16" cy="11" r="2.2" fill="#f4f1ea" />
            </svg>
          </div>
          <div>
            <h1>Gastos</h1>
            <p>Ingresos, gastos y saldo leídos de tu Google Sheet.</p>
          </div>
        </div>
        <div className="actions">
          <a className="button" href={SHEET_URL} target="_blank" rel="noreferrer">
            Abrir hoja
          </a>
          <button className="button primary" type="button" onClick={() => void loadSheets()} disabled={loading}>
            {loading ? "Leyendo…" : "Actualizar"}
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="toolbar">
          <div className="tabs" role="tablist" aria-label="Secciones">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="filters">
            <label>
              <span className="muted">Año </span>
              <select
                aria-label="Año"
                value={String(period.year)}
                onChange={(event) => {
                  const value = event.target.value;
                  setPeriod({
                    year: value === "all" ? "all" : Number(value),
                    month: value === "all" ? "all" : period.month,
                  });
                }}
              >
                <option value="all">Todo</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
                {period.year !== "all" && !years.includes(period.year) ? (
                  <option value={period.year}>{period.year}</option>
                ) : null}
              </select>
            </label>
            <label>
              <span className="muted">Mes </span>
              <select
                aria-label="Mes"
                value={String(period.month)}
                disabled={period.year === "all"}
                onChange={(event) => {
                  const value = event.target.value;
                  setPeriod({ ...period, month: value === "all" ? "all" : Number(value) });
                }}
              >
                <option value="all">Todo el año</option>
                {Array.from({ length: 12 }, (_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {monthName(index + 1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <p className="meta">
          {data ? `Hoja leída ${formatFetchedAt(data.fetchedAt)} · ${periodLabel}` : "Conectando con la hoja…"}
        </p>
      </section>

      <div style={{ height: 16 }} />

      {error ? <p className="error">{error}</p> : null}

      {data && tab === "resumen" ? (
        <Resumen
          movements={data.movimientos}
          periodMovements={periodMovements}
          period={period}
          accounts={data.config.accounts}
          onPickMonth={(month) => setPeriod({ year: period.year === "all" ? today.getFullYear() : period.year, month })}
        />
      ) : null}
      {data && tab === "movimientos" ? (
        <Movimientos movements={periodMovements} config={data.config} />
      ) : null}
      {data && tab === "cuentas" ? <Cuentas movements={data.movimientos} accounts={data.config.accounts} /> : null}
      {data && tab === "categorias" ? (
        <Categorias movements={periodMovements} config={data.config} period={period} label={periodLabel} />
      ) : null}
    </main>
  );
}
