import { accountBalances, sumBalances } from "../lib/aggregate";
import { formatMoney } from "../lib/format";
import type { AccountConfig, Movement } from "../types";

type Props = {
  movements: Movement[];
  accounts: AccountConfig[];
};

export function Cuentas({ movements, accounts }: Props) {
  const rows = accountBalances(movements, accounts);
  const total = sumBalances(rows);

  return (
    <section className="panel">
      <div className="section-title">
        <h2>Saldos por cuenta</h2>
        <span className="muted">Saldo inicial de Config + ingresos − gastos, de todas las fechas</span>
      </div>
      {rows.map((account) => (
        <article className="account" key={account.name}>
          <div>
            <strong>{account.name}</strong>
            <div className="muted">Inicial {formatMoney(account.openingBalance)}</div>
          </div>
          <div>
            <span className="amount income">{formatMoney(account.income)}</span>
            <div className="muted">Ingresos</div>
          </div>
          <div>
            <span className="amount expense">{formatMoney(account.expense)}</span>
            <div className="muted">Gastos</div>
          </div>
          <div>
            <strong>{formatMoney(account.balance)}</strong>
            <div className="muted">Saldo actual</div>
          </div>
        </article>
      ))}
      <article className="account">
        <strong>Total</strong>
        <span className="amount income">{formatMoney(total.income)}</span>
        <span className="amount expense">{formatMoney(total.expense)}</span>
        <strong>{formatMoney(total.balance)}</strong>
      </article>
    </section>
  );
}
