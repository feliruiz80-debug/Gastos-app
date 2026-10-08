import { accountBalances, monthlySeries, sumBalances, totals } from "../lib/aggregate";
import { formatMoney, monthShort } from "../lib/format";
import type { AccountConfig, Movement, Period } from "../types";

type Props = {
  movements: Movement[];
  periodMovements: Movement[];
  period: Period;
  accounts: AccountConfig[];
  onPickMonth: (month: number) => void;
};

export function Resumen({ movements, periodMovements, period, accounts, onPickMonth }: Props) {
  const periodTotals = totals(periodMovements);
  const balance = sumBalances(accountBalances(movements, accounts));
  const chartYear = period.year === "all" ? new Date().getFullYear() : period.year;
  const series = monthlySeries(movements, chartYear);
  const peak = Math.max(1, ...series.flatMap((item) => [item.income, item.expense]));
  const recent = [...periodMovements].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).slice(0, 5);

  return (
    <section>
      <div className="cards">
        <article className="card income">
          <span>Ingresos</span>
          <strong>{formatMoney(periodTotals.income)}</strong>
        </article>
        <article className="card expense">
          <span>Gastos</span>
          <strong>{formatMoney(periodTotals.expense)}</strong>
        </article>
        <article className="card">
          <span>Resultado</span>
          <strong>{formatMoney(periodTotals.result)}</strong>
        </article>
        <article className="card">
          <span>Saldo disponible</span>
          <strong>{formatMoney(balance.balance)}</strong>
        </article>
      </div>

      <div className="layout">
        <article className="panel">
          <div className="section-title">
            <h2>Año {chartYear}</h2>
            <span className="muted">Tocá un mes para filtrar</span>
          </div>
          <div className="month-chart">
            {series.map((item, index) => {
              const month = index + 1;
              return (
                <button
                  key={month}
                  type="button"
                  aria-pressed={period.month === month && period.year === chartYear}
                  aria-label={`${monthShort(month)}: ingresos ${formatMoney(item.income)}, gastos ${formatMoney(item.expense)}`}
                  onClick={() => onPickMonth(month)}
                >
                  <div className="bars" aria-hidden="true">
                    <i className="income" style={{ height: `${(item.income / peak) * 100}%` }} />
                    <i className="expense" style={{ height: `${(item.expense / peak) * 100}%` }} />
                  </div>
                  <small>{monthShort(month)}</small>
                </button>
              );
            })}
          </div>
          <p className="note">Verde: ingresos. Rojo: gastos. El saldo disponible suma todas las fechas y los saldos iniciales de Config.</p>
        </article>

        <article className="panel">
          <h2>Últimos movimientos</h2>
          {recent.length === 0 ? <p className="empty">No hay movimientos en este período.</p> : null}
          <div className="stack">
            {recent.map((movement) => (
              <div className="category" key={`${movement.id}-${movement.date}-${movement.description}`}>
                <div>
                  <strong>{movement.description || movement.category}</strong>
                  <div className="muted">{movement.category}</div>
                </div>
                <strong className={movement.type.toLowerCase().startsWith("ing") ? "amount income" : "amount expense"}>
                  {formatMoney(movement.amount)}
                </strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
