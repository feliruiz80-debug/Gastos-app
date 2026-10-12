"use client";

import { useRef, useState } from "react";
import { currentMonth, formatGroupDate, formatMonth, formatMonthShort, shiftMonth } from "@/lib/dates";
import { formatMoney, formatSigned } from "@/lib/money";
import type { AccountBalance, CategoryTotal } from "@/lib/stats";
import type { Account, Category, Transaction, TxType } from "@/lib/types";
import { ThemeToggle } from "./theme-toggle";
import { UpdateButton } from "./update-button";

type DashboardProps = {
  scope: "month" | "all";
  month: string;
  balance: number;
  income: number;
  expense: number;
  series: { month: string; income: number; expense: number }[];
  categoryView: Exclude<TxType, "transfer">;
  categoryTotals: CategoryTotal[];
  accountBalances: AccountBalance[];
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  query: string;
  typeFilter: "all" | TxType;
  accountFilter: string;
  hasAny: boolean;
  syncing: boolean;
  onMonth: (month: string) => void;
  onScope: (scope: "month" | "all") => void;
  onCategoryView: (type: Exclude<TxType, "transfer">) => void;
  onQuery: (value: string) => void;
  onTypeFilter: (value: "all" | TxType) => void;
  onAccountFilter: (value: string) => void;
  onAdd: (type: TxType) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onSeed: () => void;
  onOpenCategories: () => void;
  onOpenAccounts: () => void;
  onSync: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
  onReset: () => void;
};

function insight(income: number, expense: number, scope: "month" | "all"): string | null {
  if (income === 0 && expense === 0) return null;
  const when = scope === "month" ? "Este mes" : "En total";
  if (income === 0) return `${when} solo hay gastos, por ${formatMoney(expense)}.`;
  const percent = Math.round((expense / income) * 100);
  if (expense > income) {
    return `${when} los gastos superan a los ingresos por ${formatMoney(expense - income)}.`;
  }
  return `${when} gastaste el ${percent}% de tus ingresos.`;
}

export function Dashboard(props: DashboardProps) {
  const {
    scope,
    month,
    balance,
    income,
    expense,
    series,
    categoryView,
    categoryTotals,
    accountBalances,
    transactions,
    categories,
    accounts,
    query,
    typeFilter,
    accountFilter,
    hasAny,
    syncing,
    onMonth,
    onScope,
    onCategoryView,
    onQuery,
    onTypeFilter,
    onAccountFilter,
    onAdd,
    onEdit,
    onDelete,
    onSeed,
    onOpenCategories,
    onOpenAccounts,
    onSync,
    onExport,
    onImport,
    onClear,
    onReset,
  } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const todayMonth = currentMonth();
  const periodLabel = scope === "month" ? "Este mes" : "En total";
  const note = insight(income, expense, scope);
  const categoryTotal = categoryTotals.reduce((sum, item) => sum + item.amount, 0);
  const spansYears = new Set(series.map((item) => item.month.slice(0, 4))).size > 1;
  const maxBar = Math.max(...series.flatMap((item) => [item.income, item.expense]), 1);
  const byCategory = new Map(categories.map((category) => [category.id, category]));
  const byAccount = new Map(accounts.map((account) => [account.id, account]));
  const sorted = [...transactions].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    return byDate === 0 ? b.createdAt.localeCompare(a.createdAt) : byDate;
  });
  const groups: { date: string; items: Transaction[] }[] = [];
  for (const transaction of sorted) {
    const last = groups[groups.length - 1];
    if (last?.date === transaction.date) last.items.push(transaction);
    else groups.push({ date: transaction.date, items: [transaction] });
  }
  const chartLabel = series
    .map(
      (item) =>
        `${formatMonth(item.month)}: ingresos ${formatMoney(item.income)}, gastos ${formatMoney(item.expense)}`,
    )
    .join(". ");

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-10 sm:pb-10">
      <header className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-muted">Pesos, cuentas y presupuestos</p>
            <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Gastos</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <UpdateButton />
            <div className="hidden gap-2 sm:flex">
              <button type="button" onClick={() => onAdd("income")} className="rounded-full bg-income-solid px-4 py-2.5 text-sm font-semibold text-white">
                Nuevo ingreso
              </button>
              <button type="button" onClick={() => onAdd("expense")} className="rounded-full bg-expense-solid px-4 py-2.5 text-sm font-semibold text-white">
                Nuevo gasto
              </button>
              <button type="button" onClick={() => onAdd("transfer")} className="rounded-full border border-line bg-card px-4 py-2.5 text-sm font-semibold shadow-[var(--shadow)]">
                Pasar
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {scope === "month" ? (
            <div className="inline-flex items-center rounded-full border border-line bg-card">
              <button type="button" className="px-3 py-2 text-lg" aria-label="Mes anterior" onClick={() => onMonth(shiftMonth(month, -1))}>
                ‹
              </button>
              <span className="min-w-40 text-center text-sm font-medium">{formatMonth(month)}</span>
              <button type="button" className="px-3 py-2 text-lg" aria-label="Mes siguiente" onClick={() => onMonth(shiftMonth(month, 1))}>
                ›
              </button>
            </div>
          ) : (
            <span className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium">Todo el historial</span>
          )}
          {scope === "month" && month !== todayMonth ? (
            <button type="button" onClick={() => onMonth(todayMonth)} className="rounded-full px-3 py-2 text-sm text-muted">
              Hoy
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onScope(scope === "month" ? "all" : "month")}
            className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium"
          >
            {scope === "month" ? "Ver todo" : "Ver el mes"}
          </button>
          <button type="button" onClick={onOpenCategories} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium">
            Categorías
          </button>
          <button type="button" onClick={onOpenAccounts} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium">
            Cuentas
          </button>
          <div className="relative">
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium"
            >
              Datos
            </button>
            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-10" onMouseDown={() => setMenuOpen(false)} />
                <div role="menu" className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-line bg-card p-1 shadow-xl">
                  <MenuButton
                    onClick={() => {
                      setMenuOpen(false);
                      onSync();
                    }}
                  >
                    {syncing ? "Leyendo la hoja…" : "Traer de la hoja"}
                  </MenuButton>
                  <MenuButton
                    onClick={() => {
                      setMenuOpen(false);
                      onExport();
                    }}
                  >
                    Exportar respaldo
                  </MenuButton>
                  <MenuButton
                    onClick={() => {
                      setMenuOpen(false);
                      fileRef.current?.click();
                    }}
                  >
                    Importar respaldo
                  </MenuButton>
                  <MenuButton
                    onClick={() => {
                      setMenuOpen(false);
                      onSeed();
                    }}
                  >
                    Cargar ejemplos
                  </MenuButton>
                  <MenuButton
                    onClick={() => {
                      setMenuOpen(false);
                      onClear();
                    }}
                  >
                    Borrar movimientos
                  </MenuButton>
                  <MenuButton
                    onClick={() => {
                      setMenuOpen(false);
                      onReset();
                    }}
                  >
                    Restablecer app
                  </MenuButton>
                </div>
              </>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Importar respaldo"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onImport(file);
            }}
          />
        </div>
      </header>

      {!hasAny ? (
        <section className="mt-8 rounded-3xl border border-dashed border-line bg-card px-6 py-16 text-center">
          <h2 className="font-display text-4xl tracking-tight">Todavía no hay movimientos</h2>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Anotá el sueldo, el super o un pago entre cuentas. El saldo y los presupuestos se arman solos.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => onAdd("income")} className="rounded-full bg-income-solid px-4 py-2.5 text-sm font-semibold text-white">
              Nuevo ingreso
            </button>
            <button type="button" onClick={() => onAdd("expense")} className="rounded-full bg-expense-solid px-4 py-2.5 text-sm font-semibold text-white">
              Nuevo gasto
            </button>
            <button type="button" onClick={onSync} className="rounded-full border border-line px-4 py-2.5 text-sm font-medium">
              {syncing ? "Leyendo la hoja…" : "Traer de la hoja"}
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-3xl bg-ink p-5 text-paper">
              <p className="text-sm text-paper/70">Saldo en cuentas</p>
              <p className="mt-3 font-display text-4xl tracking-tight tabular-nums">{formatMoney(balance)}</p>
              <p className="mt-3 text-sm text-paper/70">Saldo inicial más movimientos</p>
            </article>
            <MoneyCard label="Ingresos" hint={periodLabel} value={income} tone="income" />
            <MoneyCard label="Gastos" hint={periodLabel} value={expense} tone="expense" />
            <MoneyCard
              label="Balance"
              hint={periodLabel}
              value={income - expense}
              tone={income - expense >= 0 ? "income" : "expense"}
              signed
            />
          </section>
          {note ? <p className="mt-4 text-sm text-muted">{note}</p> : null}

          <section className="mt-6">
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="font-display text-2xl tracking-tight">Cuentas</h2>
              <button type="button" onClick={onOpenAccounts} className="text-sm text-muted">
                Editar saldos
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {accountBalances.map((item) => (
                <button
                  key={item.account.id}
                  type="button"
                  onClick={() => onAccountFilter(accountFilter === item.account.id ? "all" : item.account.id)}
                  className={`rounded-3xl border bg-card p-4 text-left ${
                    accountFilter === item.account.id ? "border-ink" : "border-line"
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.account.color }} />
                    <span className="truncate">{item.account.name}</span>
                  </p>
                  <p className={`mt-2 font-display text-2xl tracking-tight tabular-nums ${item.balance < 0 ? "text-expense" : ""}`}>
                    {formatMoney(item.balance)}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-3 lg:grid-cols-5">
            <article className="rounded-3xl border border-line bg-card p-5 lg:col-span-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl tracking-tight">Últimos 6 meses</h2>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-income" /> Ingresos
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-expense" /> Gastos
                  </span>
                </div>
              </div>
              <div className="flex h-48 items-end gap-2" role="img" aria-label={chartLabel}>
                {series.map((item) => (
                  <div key={item.month} className="flex h-full flex-1 flex-col justify-end">
                    <div className="flex h-40 items-end justify-center gap-1">
                      <span className="flex h-full items-end">
                        <Bar value={item.income} max={maxBar} className="bg-income" label={`Ingresos ${formatMonth(item.month)}`} />
                      </span>
                      <span className="flex h-full items-end">
                        <Bar value={item.expense} max={maxBar} className="bg-expense" label={`Gastos ${formatMonth(item.month)}`} />
                      </span>
                    </div>
                    <span className={`mt-2 text-center text-xs ${item.month === month ? "font-semibold text-ink" : "text-muted"}`}>
                      {formatMonthShort(item.month, spansYears)}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-line bg-card p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl tracking-tight">Por categoría</h2>
                <div className="flex rounded-full bg-paper p-1 text-sm">
                  {(
                    [
                      ["expense", "Gastos"],
                      ["income", "Ingresos"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={categoryView === value}
                      onClick={() => onCategoryView(value)}
                      className={`rounded-full px-3 py-1 ${categoryView === value ? "bg-ink text-paper" : "text-muted"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {categoryTotals.length === 0 ? (
                <p className="text-sm text-muted">Nada en este período.</p>
              ) : (
                <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
                  {categoryTotals.map((item) => {
                    const percent = categoryTotal === 0 ? 0 : (item.amount / categoryTotal) * 100;
                    const budgetPercent = item.budget ? Math.min((item.amount / item.budget) * 100, 100) : null;
                    const over = item.budget !== null && item.amount > item.budget;
                    return (
                      <li key={item.category.id}>
                        <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.category.color }} />
                            <span className="truncate">{item.category.name}</span>
                          </span>
                          <span className={`shrink-0 tabular-nums ${over ? "text-expense" : "text-muted"}`}>
                            {item.budget
                              ? `${formatMoney(item.amount)} / ${formatMoney(item.budget)}`
                              : `${Math.round(percent)}% · ${formatMoney(item.amount)}`}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-paper-deep">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${Math.max(budgetPercent ?? percent, item.amount > 0 || item.budget ? 2 : 0)}%`,
                              backgroundColor: over ? "#9a3412" : item.category.color,
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          </section>

          <section className="mt-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-2xl tracking-tight">Movimientos</h2>
                <p className="text-sm text-muted">{sorted.length === 1 ? "1 movimiento" : `${sorted.length} movimientos`}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="buscar">
                  Buscar movimientos
                </label>
                <input
                  id="buscar"
                  value={query}
                  onChange={(event) => onQuery(event.target.value)}
                  placeholder="Buscar"
                  className="w-full rounded-full border border-line bg-card px-4 py-2 text-sm outline-none sm:w-44"
                />
                <label className="sr-only" htmlFor="cuenta">
                  Cuenta
                </label>
                <select
                  id="cuenta"
                  value={accountFilter}
                  onChange={(event) => onAccountFilter(event.target.value)}
                  className="rounded-full border border-line bg-card px-3 py-2 text-sm outline-none"
                >
                  <option value="all">Todas las cuentas</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <div className="flex rounded-full bg-card p-1 text-sm">
                  {(
                    [
                      ["all", "Todos"],
                      ["income", "Ingresos"],
                      ["expense", "Gastos"],
                      ["transfer", "Pases"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={typeFilter === value}
                      onClick={() => onTypeFilter(value)}
                      className={`rounded-full px-3 py-1 ${typeFilter === value ? "bg-ink text-paper" : "text-muted"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {sorted.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-line bg-card px-5 py-10 text-center text-muted">
                {query || typeFilter !== "all" || accountFilter !== "all"
                  ? "Nada coincide con ese filtro."
                  : "No hay movimientos en este período."}
              </p>
            ) : (
              <div className="space-y-5">
                {groups.map((group) => (
                  <section key={group.date}>
                    <h3 className="mb-2 text-sm font-medium text-muted">{formatGroupDate(group.date)}</h3>
                    <ul className="overflow-hidden rounded-3xl border border-line bg-card">
                      {group.items.map((transaction) => {
                        const category = byCategory.get(transaction.categoryId);
                        const account = byAccount.get(transaction.accountId);
                        const target = transaction.toAccountId ? byAccount.get(transaction.toAccountId) : undefined;
                        const title = transaction.note || category?.name || "Transferencia";
                        const subtitle =
                          transaction.type === "transfer"
                            ? `${account?.name ?? "Sin cuenta"} → ${target?.name ?? "Sin cuenta"}`
                            : [transaction.note ? category?.name : transaction.type === "income" ? "Ingreso" : "Gasto", account?.name]
                                .filter(Boolean)
                                .join(" · ");
                        const color = category?.color ?? account?.color ?? "#57534e";
                        const letter = (category?.name || account?.name || "T").slice(0, 1).toUpperCase();
                        return (
                          <li key={transaction.id} className="flex items-center gap-2 border-b border-line px-2 py-2 last:border-b-0">
                            <button
                              type="button"
                              onClick={() => onEdit(transaction)}
                              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-paper"
                            >
                              <span
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                                style={{ backgroundColor: `${color}22`, color }}
                              >
                                {letter}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{title}</span>
                                <span className="block truncate text-sm text-muted">{subtitle}</span>
                              </span>
                              <span
                                className={`shrink-0 font-medium tabular-nums ${
                                  transaction.type === "income"
                                    ? "text-income"
                                    : transaction.type === "expense"
                                      ? "text-expense"
                                      : "text-ink"
                                }`}
                              >
                                {transaction.type === "transfer"
                                  ? formatMoney(transaction.amount)
                                  : formatSigned(transaction.type, transaction.amount)}
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-label={`Eliminar ${title}`}
                              onClick={() => onDelete(transaction)}
                              className="rounded-full px-3 py-2 text-sm text-muted hover:text-expense"
                            >
                              Borrar
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <p className="mt-10 text-center text-xs text-muted">
        Los datos quedan en este navegador. La hoja pública se trae cuando vos lo pedís.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 p-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <button type="button" onClick={() => onAdd("income")} className="flex-1 rounded-full bg-income-solid py-3 text-sm font-semibold text-white">
            Ingreso
          </button>
          <button type="button" onClick={() => onAdd("expense")} className="flex-1 rounded-full bg-expense-solid py-3 text-sm font-semibold text-white">
            Gasto
          </button>
          <button type="button" onClick={() => onAdd("transfer")} className="rounded-full border border-line px-4 py-3 text-sm font-semibold">
            Pasar
          </button>
        </div>
      </div>
    </div>
  );
}

function MoneyCard({
  label,
  hint,
  value,
  tone,
  signed = false,
}: {
  label: string;
  hint: string;
  value: number;
  tone: "income" | "expense";
  signed?: boolean;
}) {
  const shown = signed ? `${value < 0 ? "−" : "+"}${formatMoney(Math.abs(value))}` : formatMoney(value);
  return (
    <article className="rounded-3xl border border-line bg-card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-3 font-display text-3xl tracking-tight tabular-nums ${tone === "income" ? "text-income" : "text-expense"}`}>
        {shown}
      </p>
      <p className="mt-3 text-sm text-muted">{hint}</p>
    </article>
  );
}

function Bar({ value, max, className, label }: { value: number; max: number; className: string; label: string }) {
  const height = value === 0 ? 0 : Math.max((value / max) * 100, 3);
  return (
    <span
      title={`${label}: ${formatMoney(value)}`}
      className={`block w-3 rounded-t-md ${className}`}
      style={{ height: `${height}%` }}
    />
  );
}

function MenuButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-paper">
      {children}
    </button>
  );
}
