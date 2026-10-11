"use client";

import { useMemo, useState } from "react";
import { isValidISODate } from "@/lib/dates";
import { formatMoney, parseAmount } from "@/lib/money";
import type { Category, TxType } from "@/lib/types";
import { Modal } from "./modal";

export type Draft = {
  id?: string;
  type: TxType;
  amount: string;
  categoryId: string;
  note: string;
  date: string;
};

type TransactionDialogProps = {
  draft: Draft;
  categories: Category[];
  onClose: () => void;
  onSave: (draft: Draft, amount: number) => void;
  onDelete?: () => void;
  onManageCategories: (draft: Draft) => void;
};

function firstCategory(categories: Category[], type: TxType, current: string): string {
  if (categories.some((category) => category.id === current && category.type === type)) return current;
  return categories.find((category) => category.type === type)?.id ?? "";
}

export function TransactionDialog({
  draft,
  categories,
  onClose,
  onSave,
  onDelete,
  onManageCategories,
}: TransactionDialogProps) {
  const [type, setType] = useState<TxType>(draft.type);
  const [amount, setAmount] = useState(draft.amount);
  const [categoryId, setCategoryId] = useState(draft.categoryId);
  const [note, setNote] = useState(draft.note);
  const [date, setDate] = useState(draft.date);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );
  const parsed = parseAmount(amount);
  const title = draft.id ? "Editar movimiento" : type === "income" ? "Nuevo ingreso" : "Nuevo gasto";

  function changeType(next: TxType) {
    setType(next);
    setCategoryId((current) => firstCategory(categories, next, current));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed) {
      setError("Ingresá un monto mayor a cero. Podés escribir 12500 o 12.500,50.");
      return;
    }
    if (!categoryId) {
      setError("Elegí una categoría.");
      return;
    }
    if (!isValidISODate(date)) {
      setError("Elegí una fecha válida.");
      return;
    }
    onSave({ id: draft.id, type, amount, categoryId, note: note.trim(), date }, parsed);
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-3xl tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-muted" aria-label="Cerrar">
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 rounded-full bg-paper p-1">
          {([
            ["income", "Ingreso"],
            ["expense", "Gasto"],
          ] as const).map(([value, label]) => (
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

        <fieldset>
          <legend className="text-sm text-muted">Categoría</legend>
          {options.length === 0 ? (
            <p className="mt-2 text-sm">
              No hay categorías de este tipo.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => onManageCategories({ id: draft.id, type, amount, categoryId, note, date })}
              >
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

        <label className="block">
          <span className="text-sm text-muted">Descripción</span>
          <input
            value={note}
            maxLength={140}
            placeholder="Ej: supermercado del sábado"
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
