"use client";

import { useState, type FormEvent } from "react";
import { formatMonth } from "@/lib/dates";
import { amountToInput, formatMoney, parseAmount } from "@/lib/money";
import { activeFixedTotal, fixedPaidIds, fixedPendingTotal } from "@/lib/stats";
import type { Account, Category, FixedExpense, Transaction } from "@/lib/types";
import { AnimatedMoney } from "./animated-number";

type FixedExpensesViewProps = {
  month: string;
  fixedExpenses: FixedExpense[];
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  onSave: (item: FixedExpense) => string | null;
  onDelete: (id: string) => void;
  onRegister: (id: string) => void;
  onUnregister: (id: string) => void;
  onOpenMonth: () => void;
};

export function FixedExpensesView({
  month,
  fixedExpenses,
  categories,
  accounts,
  transactions,
  onSave,
  onDelete,
  onRegister,
  onUnregister,
  onOpenMonth,
}: FixedExpensesViewProps) {
  const expenseCategories = categories.filter((category) => category.type === "expense");
  const paidIds = fixedPaidIds(transactions, month);
  const total = activeFixedTotal(fixedExpenses);
  const pending = fixedPendingTotal(fixedExpenses, paidIds);
  const paidTotal = Math.max(0, total - pending);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id ?? "");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [note, setNote] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sorted = [...fixedExpenses].sort(
    (a, b) => a.dayOfMonth - b.dayOfMonth || a.name.localeCompare(b.name, "es"),
  );

  function reset() {
    setEditingId(null);
    setName("");
    setAmount("");
    setCategoryId(expenseCategories[0]?.id ?? "");
    setAccountId(accounts[0]?.id ?? "");
    setDayOfMonth("1");
    setNote("");
    setActive(true);
    setError(null);
  }

  function startEdit(item: FixedExpense) {
    setEditingId(item.id);
    setName(item.name);
    setAmount(amountToInput(item.amount));
    setCategoryId(item.categoryId);
    setAccountId(item.accountId);
    setDayOfMonth(String(item.dayOfMonth));
    setNote(item.note);
    setActive(item.active);
    setError(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseAmount(amount);
    const day = Number(dayOfMonth);
    if (!name.trim()) {
      setError("Poné un nombre, por ejemplo Alquiler o Netflix.");
      return;
    }
    if (parsed === null) {
      setError("Revisá el monto.");
      return;
    }
    if (!Number.isFinite(day) || day < 1 || day > 28) {
      setError("El día tiene que ser entre 1 y 28.");
      return;
    }
    if (!categoryId || !accountId) {
      setError("Elegí categoría y cuenta.");
      return;
    }
    const message = onSave({
      id: editingId ?? crypto.randomUUID(),
      name: name.trim(),
      amount: parsed,
      categoryId,
      accountId,
      dayOfMonth: day,
      note: note.trim(),
      active,
    });
    if (message) {
      setError(message);
      return;
    }
    reset();
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 pb-32 sm:px-6 sm:pt-10 sm:pb-32">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">Money Manager</p>
          <h1 className="font-display text-4xl tracking-tight">Gastos fijos</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Alquiler, servicios y suscripciones. Se conectan con el mes actual y el saldo de Inicio.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenMonth}
          className="rounded-full border border-line px-4 py-2.5 text-sm font-medium"
        >
          Ver {formatMonth(month)}
        </button>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <article className="rounded-3xl bg-ink p-5 text-paper">
          <p className="text-sm text-paper/70">Total fijo del mes</p>
          <p className="mt-3 font-display text-3xl tracking-tight">
            <AnimatedMoney value={total} />
          </p>
        </article>
        <article className="glass rounded-3xl p-5">
          <p className="text-sm text-muted">Ya registrados</p>
          <p className="mt-3 font-display text-3xl tracking-tight text-income">
            <AnimatedMoney value={paidTotal} />
          </p>
        </article>
        <article className="glass rounded-3xl p-5">
          <p className="text-sm text-muted">Pendientes en {formatMonth(month)}</p>
          <p className="mt-3 font-display text-3xl tracking-tight text-expense">
            <AnimatedMoney value={pending} />
          </p>
        </article>
      </section>

      <section className="glass mt-8 rounded-3xl p-5">
        <h2 className="font-display text-2xl tracking-tight">
          {editingId ? "Editar gasto fijo" : "Nuevo gasto fijo"}
        </h2>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm text-muted">Nombre</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2.5"
              placeholder="Alquiler, Luz, Spotify…"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Monto</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2.5"
              placeholder="150.000"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Día del mes (1–28)</span>
            <input
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(event.target.value)}
              inputMode="numeric"
              className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2.5"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Categoría</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2.5"
            >
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-muted">Cuenta</span>
            <select
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2.5"
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm text-muted">Nota</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2.5"
              placeholder="Opcional"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
            Activo este mes
          </label>
          {error ? <p className="text-sm text-expense sm:col-span-2">{error}</p> : null}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className="rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper">
              {editingId ? "Guardar cambios" : "Agregar fijo"}
            </button>
            {editingId ? (
              <button type="button" onClick={reset} className="rounded-full border border-line px-4 py-2.5 text-sm">
                Cancelar
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl tracking-tight">Lista</h2>
          <p className="text-sm text-muted">
            {sorted.length === 0 ? "Sin fijos todavía" : `${sorted.length} gasto${sorted.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="grid gap-3">
          {sorted.map((item) => {
            const category = categories.find((entry) => entry.id === item.categoryId);
            const account = accounts.find((entry) => entry.id === item.accountId);
            const paid = paidIds.has(item.id);
            return (
              <article key={item.id} className={`glass rounded-3xl p-4 ${item.active ? "" : "opacity-60"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      Día {item.dayOfMonth}
                      {category ? ` · ${category.name}` : ""}
                      {account ? ` · ${account.name}` : ""}
                      {item.note ? ` · ${item.note}` : ""}
                      {!item.active ? " · pausado" : ""}
                    </p>
                  </div>
                  <p className="font-display text-2xl tracking-tight text-expense">
                    {formatMoney(item.amount)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.active ? (
                    paid ? (
                      <button
                        type="button"
                        onClick={() => onUnregister(item.id)}
                        className="rounded-full bg-income/15 px-3 py-1.5 text-sm font-medium text-income"
                      >
                        Registrado · deshacer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRegister(item.id)}
                        className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-paper"
                      >
                        Registrar en {formatMonth(month)}
                      </button>
                    )
                  ) : null}
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-full border border-line px-3 py-1.5 text-sm"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="rounded-full border border-line px-3 py-1.5 text-sm text-expense"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
