"use client";

import { formatGroupDate } from "@/lib/dates";
import { formatSigned } from "@/lib/money";
import type { CategoryTotal } from "@/lib/stats";
import type { Account, Category, Transaction } from "@/lib/types";
import { AnimatedMoney } from "./animated-number";
import { DonutChart } from "./donut-chart";

type FlowPanelProps = {
  type: "income" | "expense";
  periodLabel: string;
  totals: CategoryTotal[];
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
};

export function FlowPanel({
  type,
  periodLabel,
  totals,
  transactions,
  categories,
  accounts,
  onClose,
  onEdit,
}: FlowPanelProps) {
  const title = type === "income" ? "Ingresos" : "Gastos";
  const shown = totals.filter((item) => item.amount > 0);
  const total = shown.reduce((sum, item) => sum + item.amount, 0);
  const byCategory = new Map(categories.map((category) => [category.id, category]));
  const byAccount = new Map(accounts.map((account) => [account.id, account]));
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass max-h-[92vh] w-full overflow-y-auto rounded-t-3xl p-5 sm:max-w-3xl sm:rounded-3xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{periodLabel}</p>
            <h2 className="font-display text-4xl tracking-tight">{title}</h2>
            <p className={`mt-1 font-display text-2xl ${type === "income" ? "text-income" : "text-expense"}`}>
              <AnimatedMoney value={total} />
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-muted">
            Cerrar
          </button>
        </div>

        <div className="rounded-3xl border border-line/70 bg-card/50 p-4">
          <DonutChart
            slices={shown.map((item) => ({
              id: item.category.id,
              name: item.category.name,
              amount: item.amount,
              color: item.category.color,
            }))}
          />
        </div>

        <ul className="mt-5 space-y-2">
          {sorted.length === 0 ? <li className="py-8 text-center text-sm text-muted">No hay movimientos en este período.</li> : null}
          {sorted.map((transaction) => {
            const category = byCategory.get(transaction.categoryId);
            const account = byAccount.get(transaction.accountId);
            const label = transaction.note || category?.name || title;
            return (
              <li key={transaction.id}>
                <button
                  type="button"
                  onClick={() => onEdit(transaction)}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-paper/70"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ backgroundColor: `${category?.color ?? "#57534e"}22`, color: category?.color ?? "#57534e" }}
                  >
                    {(category?.name || title).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{label}</span>
                    <span className="block truncate text-sm text-muted">
                      {formatGroupDate(transaction.date)} · {category?.name ?? "Sin categoría"} · {account?.name ?? "Sin cuenta"}
                    </span>
                  </span>
                  <span className={`shrink-0 font-medium tabular-nums ${type === "income" ? "text-income" : "text-expense"}`}>
                    {formatSigned(type, transaction.amount)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
