"use client";

import { useState } from "react";
import { ACCOUNT_COLORS } from "@/lib/defaults";
import { formatMoney, parseSignedAmount } from "@/lib/money";
import type { Account } from "@/lib/types";
import { Modal } from "./modal";

type AccountsDialogProps = {
  accounts: Account[];
  counts: Record<string, number>;
  onClose: () => void;
  onCreate: (input: { name: string; color: string; openingBalance: number }) => string | null;
  onUpdate: (account: Account) => string | null;
  onDelete: (id: string) => string | null;
};

export function AccountsDialog({
  accounts,
  counts,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: AccountsDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(ACCOUNT_COLORS[0]);
  const [opening, setOpening] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setColor(ACCOUNT_COLORS[0]);
    setOpening("");
    setEditingId(null);
    setError(null);
  }

  function startEdit(account: Account) {
    setEditingId(account.id);
    setName(account.name);
    setColor(account.color);
    setOpening(account.openingBalance === 0 ? "" : String(account.openingBalance));
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Poné un nombre.");
      return;
    }
    const openingBalance = parseSignedAmount(opening);
    if (openingBalance === null) {
      setError("El saldo inicial tiene que ser un monto. Usá un signo menos si debés.");
      return;
    }
    const message = editingId
      ? onUpdate({ id: editingId, name: trimmed, color, openingBalance })
      : onCreate({ name: trimmed, color, openingBalance });
    if (message) {
      setError(message);
      return;
    }
    resetForm();
  }

  return (
    <Modal title="Cuentas" onClose={onClose}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl tracking-tight">Cuentas</h2>
          <p className="mt-1 text-sm text-muted">Efectivo, banco, Mercado Pago, tarjeta o ahorro.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-muted">
          Cerrar
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-paper p-4">
        <p className="text-sm font-medium">{editingId ? "Editar cuenta" : "Nueva cuenta"}</p>
        <input
          value={name}
          maxLength={60}
          placeholder="Nombre"
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-2xl border border-line bg-card px-3 py-2.5 outline-none"
          aria-label="Nombre de la cuenta"
        />
        <label className="block">
          <span className="text-sm text-muted">Saldo inicial</span>
          <input
            value={opening}
            inputMode="decimal"
            placeholder="0"
            onChange={(event) => setOpening(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-line bg-card px-3 py-2.5 outline-none"
            aria-label="Saldo inicial"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="listbox" aria-label="Color de la cuenta">
          {ACCOUNT_COLORS.map((swatch) => (
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

      <ul className="mt-5 space-y-2">
        {accounts.map((account) => {
          const count = counts[account.id] ?? 0;
          return (
            <li key={account.id} className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: account.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{account.name}</span>
                <span className="text-xs text-muted">
                  Inicial {formatMoney(account.openingBalance)}
                  {" · "}
                  {count === 1 ? "1 movimiento" : `${count} movimientos`}
                </span>
              </span>
              <button type="button" onClick={() => startEdit(account)} className="text-sm text-muted">
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  const message = onDelete(account.id);
                  if (message) {
                    setError(message);
                    return;
                  }
                  setError(null);
                  if (editingId === account.id) resetForm();
                }}
                className="text-sm text-expense"
              >
                Eliminar
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
