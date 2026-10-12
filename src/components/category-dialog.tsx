"use client";

import { useState } from "react";
import { CATEGORY_COLORS } from "@/lib/defaults";
import { formatMoney, parseBudget } from "@/lib/money";
import type { Category, TxType } from "@/lib/types";
import { Modal } from "./modal";

type CategoryDialogProps = {
  categories: Category[];
  counts: Record<string, number>;
  onClose: () => void;
  onCreate: (input: { name: string; type: Exclude<TxType, "transfer">; color: string; monthlyBudget: number }) => string | null;
  onUpdate: (category: Category) => string | null;
  onDelete: (id: string) => string | null;
};

export function CategoryDialog({
  categories,
  counts,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Exclude<TxType, "transfer">>("expense");
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [budget, setBudget] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setType("expense");
    setColor(CATEGORY_COLORS[0]);
    setBudget("");
    setEditingId(null);
    setError(null);
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setType(category.type);
    setColor(category.color);
    setBudget(category.monthlyBudget > 0 ? String(category.monthlyBudget) : "");
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Poné un nombre.");
      return;
    }
    const monthlyBudget = type === "expense" ? parseBudget(budget) : 0;
    if (monthlyBudget === null) {
      setError("El presupuesto tiene que ser un monto, o vacío si no querés tope.");
      return;
    }
    const message = editingId
      ? onUpdate({ id: editingId, name: trimmed, type, color, monthlyBudget })
      : onCreate({ name: trimmed, type, color, monthlyBudget });
    if (message) {
      setError(message);
      return;
    }
    resetForm();
  }

  return (
    <Modal title="Categorías" onClose={onClose}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="font-display text-3xl tracking-tight">Categorías</h2>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-muted">
          Cerrar
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-paper p-4">
        <p className="text-sm font-medium">{editingId ? "Editar categoría" : "Nueva categoría"}</p>
        <input
          value={name}
          maxLength={60}
          placeholder="Nombre"
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-2xl border border-line bg-card px-3 py-2.5 outline-none"
          aria-label="Nombre de la categoría"
        />
        <div className="grid grid-cols-2 rounded-full bg-card p-1">
          {(
            [
              ["expense", "Gasto"],
              ["income", "Ingreso"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={Boolean(editingId)}
              aria-pressed={type === value}
              onClick={() => setType(value)}
              className={`rounded-full px-3 py-1.5 text-sm disabled:opacity-60 ${
                type === value ? "bg-ink text-paper" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {type === "expense" ? (
          <label className="block">
            <span className="text-sm text-muted">Presupuesto mensual</span>
            <input
              value={budget}
              inputMode="decimal"
              placeholder="Sin tope"
              onChange={(event) => setBudget(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-2.5 outline-none"
              aria-label="Presupuesto mensual"
            />
          </label>
        ) : null}
        <div className="flex flex-wrap gap-2" role="listbox" aria-label="Color">
          {CATEGORY_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              aria-label={`Color ${swatch}`}
              aria-pressed={color === swatch}
              onClick={() => setColor(swatch)}
              className={`h-7 w-7 rounded-full ${color === swatch ? "ring-2 ring-ink ring-offset-2" : ""}`}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
        {error ? <p className="text-sm text-expense">{error}</p> : null}
        <div className="flex gap-2">
          {editingId ? (
            <button type="button" onClick={resetForm} className="rounded-full px-4 py-2 text-sm">
              Cancelar
            </button>
          ) : null}
          <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">
            {editingId ? "Guardar cambios" : "Agregar"}
          </button>
        </div>
      </form>

      <div className="mt-5 space-y-5">
        {(["expense", "income"] as const).map((group) => {
          const items = categories.filter((category) => category.type === group);
          return (
            <section key={group}>
              <h3 className="mb-2 text-sm font-medium text-muted">
                {group === "expense" ? "Gastos" : "Ingresos"}
              </h3>
              <ul className="space-y-2">
                {items.map((category) => {
                  const count = counts[category.id] ?? 0;
                  return (
                    <li key={category.id} className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{category.name}</span>
                        <span className="text-xs text-muted">
                          {count === 1 ? "1 movimiento" : `${count} movimientos`}
                          {category.monthlyBudget > 0 ? ` · tope ${formatMoney(category.monthlyBudget)}` : ""}
                        </span>
                      </span>
                      <button type="button" onClick={() => startEdit(category)} className="text-sm text-muted">
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const message = onDelete(category.id);
                          if (message) {
                            setError(message);
                            return;
                          }
                          setError(null);
                          if (editingId === category.id) resetForm();
                        }}
                        className="text-sm text-expense"
                      >
                        Eliminar
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
