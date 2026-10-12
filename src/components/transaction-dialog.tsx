"use client";

import { useMemo, useState } from "react";
import { isValidISODate } from "@/lib/dates";
import { formatMoney, parseAmount } from "@/lib/money";
import type { Account, Category, TxType } from "@/lib/types";
import { Modal } from "./modal";

export type Draft = {
  id?: string;
  type: TxType;
  amount: string;
  categoryId: string;
  accountId: string;
  toAccountId: string;
  note: string;
  date: string;
};

type TransactionDialogProps = {
  draft: Draft;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onSave: (draft: Draft, amount: number) => void;
  onDelete?: () => void;
  onManageCategories: (draft: Draft) => void;
};

function firstCategory(categories: Category[], type: TxType, current: string): string {
  if (type === "transfer") return "";
  if (categories.some((category) => category.id === current && category.type === type)) return current;
  return categories.find((category) => category.type === type)?.id ?? "";
}

function firstAccount(accounts: Account[], current: string, avoid = ""): string {
  if (accounts.some((account) => account.id === current && account.id !== avoid)) return current;
  return accounts.find((account) => account.id !== avoid)?.id ?? "";
}

export function TransactionDialog({
  draft,
  categories,
  accounts,
  onClose,
  onSave,
  onDelete,
  onManageCategories,
}: TransactionDialogProps) {
  const [type, setType] = useState<TxType>(draft.type);
  const [amount, setAmount] = useState(draft.amount);
  const [categoryId, setCategoryId] = useState(draft.categoryId);
  const [accountId, setAccountId] = useState(draft.accountId);
  const [toAccountId, setToAccountId] = useState(draft.toAccountId);
  const [note, setNote] = useState(draft.note);
  const [date, setDate] = useState(draft.date);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );
  const parsed = parseAmount(amount);
  const title = draft.id
    ? "Editar movimiento"
    : type === "income"
      ? "Nuevo ingreso"
      : type === "expense"
        ? "Nuevo gasto"
        : "Pasar plata";

  function changeType(next: TxType) {
    setType(next);
    setCategoryId((current) => firstCategory(categories, next, current));
    if (next === "transfer") {
      setToAccountId((current) => firstAccount(accounts, current, accountId));
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed) {
      setError("Ingresá un monto mayor a cero. Podés escribir 12500 o 12.500,50.");
      return;
    }
    if (!accountId) {
      setError("Elegí una cuenta.");
      return;
    }
    if (type === "transfer") {
      if (!toAccountId || toAccountId === accountId) {
        setError("Elegí dos cuentas distintas.");
        return;
      }
    } else if (!categoryId) {
      setError("Elegí una categoría.");
      return;
    }
    if (!isValidISODate(date)) {
      setError("Elegí una fecha válida.");
      return;
    }
    onSave(
      {
        id: draft.id,
        type,
        amount,
        categoryId: type === "transfer" ? "" : categoryId,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : "",
        note: note.trim(),
        date,
      },
      parsed,
    );
  }

  const snapshot = (): Draft => ({
    id: draft.id,
    type,
    amount,
    categoryId,
    accountId,
    toAccountId,
    note,
    date,
  });

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-3xl tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-muted" aria-label="Cerrar">
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-3 rounded-full bg-paper p-1">
          {(
            [
              ["income", "Ingreso"],
              ["expense", "Gasto"],
              ["transfer", "Pasar"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={type === value}
              onClick={() => changeType(value)}
              className={`rounded-full px-3 py-2 text-sm font-medium ${
                type === value ? "bg-ink text-paper" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-sm text-muted">Monto</span>
          <input
            autoFocus
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setError(null);
            }}
            className="mt-1 w-full bg-transparent font-display text-5xl tracking-tight outline-none"
            aria-describedby="monto-ayuda"
          />
          <p id="monto-ayuda" className="mt-1 text-sm text-muted">
            {parsed ? `Se guarda como ${formatMoney(parsed)}` : "Ejemplo: 12500 o 12.500,50"}
          </p>
        </label>

        {type === "transfer" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <AccountField
              label="Desde"
              accounts={accounts}
              value={accountId}
              onChange={(value) => {
                setAccountId(value);
                if (value === toAccountId) setToAccountId(firstAccount(accounts, "", value));
              }}
            />
            <AccountField
              label="Hacia"
              accounts={accounts}
              value={toAccountId}
              onChange={setToAccountId}
            />
          </div>
        ) : (
          <>
            <AccountField label="Cuenta" accounts={accounts} value={accountId} onChange={setAccountId} />
            <fieldset>
              <legend className="text-sm text-muted">Categoría</legend>
              {options.length === 0 ? (
                <p className="mt-2 text-sm">
                  No hay categorías de este tipo.{" "}
                  <button type="button" className="underline" onClick={() => onManageCategories(snapshot())}>
                    Crear una
                  </button>
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {options.map((category) => {
                    const selected = category.id === categoryId;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setCategoryId(category.id)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                          selected ? "border-ink bg-white ring-2 ring-ink" : "border-line bg-paper"
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </>
        )}

        <label className="block">
          <span className="text-sm text-muted">Descripción</span>
          <input
            value={note}
            maxLength={140}
            placeholder={type === "transfer" ? "Ej: pago de la tarjeta" : "Ej: supermercado del sábado"}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm text-muted">Fecha</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none"
          />
        </label>

        {error ? <p className="text-sm text-expense">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {onDelete ? (
            <button type="button" onClick={onDelete} className="text-sm text-expense underline">
              Eliminar movimiento
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-sm">
              Cancelar
            </button>
            <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper">
              Guardar
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function AccountField({
  label,
  accounts,
  value,
  onChange,
}: {
  label: string;
  accounts: Account[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-2.5 outline-none"
      >
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </label>
  );
}
