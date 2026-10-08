import { useState } from "react";
import { budgetForPeriod, categoryTotals } from "../lib/aggregate";
import { formatMoney, formatPercent } from "../lib/format";
import type { Movement, Period, SheetConfig } from "../types";

type Props = {
  movements: Movement[];
  config: SheetConfig;
  period: Period;
  label: string;
};

export function Categorias({ movements, config, period, label }: Props) {
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const catalog = kind === "expense" ? config.expenseCategories : config.incomeCategories;
  const rows = categoryTotals(movements, kind, catalog).map((row) => ({
    ...row,
    budget: budgetForPeriod(row.budget, period),
  }));

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2>{kind === "expense" ? "Gastos por categoría" : "Ingresos por categoría"}</h2>
          <p className="meta">{label}</p>
        </div>
        <div className="tabs" role="tablist" aria-label="Tipo de categoría">
          <button type="button" aria-selected={kind === "expense"} onClick={() => setKind("expense")}>
            Gastos
          </button>
          <button type="button" aria-selected={kind === "income"} onClick={() => setKind("income")}>
            Ingresos
          </button>
        </div>
      </div>
      {rows.length === 0 ? <p className="empty">No hay categorías en la hoja Config.</p> : null}
      {rows.map((row) => {
        const ratio = row.budget ? row.amount / row.budget : 0;
        return (
          <article className="category" key={row.name}>
            <header>
              <strong>{row.name}</strong>
              <span>{formatMoney(row.amount)}</span>
            </header>
            {row.budget ? (
              <>
                <div className={ratio > 1 ? "track over" : "track"} aria-hidden="true">
                  <span style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
                </div>
                <div className="muted">
                  Presupuesto {formatMoney(row.budget)} · usado {formatPercent(ratio * 100)}
                  {period.month === "all" ? " (mensual × 12)" : ""}
                </div>
              </>
            ) : kind === "expense" ? (
              <div className="muted">Sin presupuesto cargado en Config</div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
