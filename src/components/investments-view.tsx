"use client";

import { useState } from "react";
import { formatMoney, parseAmount, parseBudget } from "@/lib/money";
import type { Investment, InvestmentKind } from "@/lib/types";
import { DonutChart } from "./donut-chart";

const KINDS: { id: InvestmentKind; label: string; color: string }[] = [
  { id: "plazo", label: "Plazo fijo", color: "#1d4ed8" },
  { id: "acciones", label: "Acciones", color: "#157a45" },
  { id: "fondo", label: "Fondo", color: "#7c3aed" },
  { id: "cripto", label: "Cripto", color: "#b45309" },
  { id: "otro", label: "Otro", color: "#57534e" },
];

type InvestmentsViewProps = {
  investments: Investment[];
  onSave: (investment: Investment) => string | null;
  onDelete: (id: string) => void;
};

export function InvestmentsView({ investments, onSave, onDelete }: InvestmentsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<InvestmentKind>("acciones");
  const [invested, setInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const investedTotal = investments.reduce((sum, item) => sum + item.invested, 0);
  const currentTotal = investments.reduce((sum, item) => sum + item.currentValue, 0);
  const gain = currentTotal - investedTotal;
  const byKind = KINDS.map((item) => ({
    id: item.id,
    name: item.label,
    color: item.color,
    amount: investments.filter((investment) => investment.kind === item.id).reduce((sum, investment) => sum + investment.currentValue, 0),
  })).filter((item) => item.amount > 0);

  function reset() {
    setEditingId(null);
    setName("");
    setKind("acciones");
    setInvested("");
    setCurrentValue("");
    setNote("");
    setError(null);
  }

  function startEdit(investment: Investment) {
    setEditingId(investment.id);
    setName(investment.name);
    setKind(investment.kind);
    setInvested(String(investment.invested));
    setCurrentValue(String(investment.currentValue));
    setNote(investment.note);
    setError(null);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const paid = parseAmount(invested);
    const now = parseBudget(currentValue);
    if (!name.trim()) {
      setError("Poné un nombre.");
      return;
    }
    if (!paid) {
      setError("El monto invertido tiene que ser mayor a cero.");
      return;
    }
    if (now === null) {
      setError("El valor actual tiene que ser un monto.");
      return;
    }
    const message = onSave({
      id: editingId ?? crypto.randomUUID(),
      name: name.trim(),
      kind,
      invested: paid,
      currentValue: now,
      note: note.trim(),
    });
    if (message) {
      setError(message);
      return;
    }
    reset();
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 pb-32 sm:px-6 sm:pt-10 sm:pb-32">
      <header>
        <p className="text-sm font-medium tracking-wide text-muted">Lo que está puesto a trabajar</p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Inversiones</h1>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="glass rounded-3xl p-5">
          <p className="text-sm text-muted">Invertido</p>
          <p className="mt-2 font-display text-3xl tabular-nums">{formatMoney(investedTotal)}</p>
        </article>
        <article className="glass rounded-3xl p-5">
          <p className="text-sm text-muted">Valor actual</p>
          <p className="mt-2 font-display text-3xl tabular-nums">{formatMoney(currentTotal)}</p>
        </article>
        <article className="glass rounded-3xl p-5">
          <p className="text-sm text-muted">Resultado</p>
          <p className={`mt-2 font-display text-3xl tabular-nums ${gain >= 0 ? "text-income" : "text-expense"}`}>
            {gain < 0 ? "−" : "+"}
            {formatMoney(Math.abs(gain))}
          </p>
        </article>
      </section>

      <section className="glass mt-4 rounded-3xl p-5">
        <h2 className="font-display text-2xl tracking-tight">Cómo está repartido</h2>
        <div className="mt-4">
          <DonutChart center={formatMoney(currentTotal)} slices={byKind} />
        </div>
      </section>

      <form onSubmit={submit} className="glass mt-4 space-y-3 rounded-3xl p-5">
        <p className="font-medium">{editingId ? "Editar inversión" : "Nueva inversión"}</p>
        <input
          value={name}
          maxLength={60}
          placeholder="Nombre, por ejemplo GGAL o plazo fijo"
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-2xl border border-line bg-card/80 px-3 py-2.5 outline-none"
          aria-label="Nombre de la inversión"
        />
        <div className="flex flex-wrap gap-2">
          {KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={kind === item.id}
              onClick={() => setKind(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${kind === item.id ? "bg-ink text-paper" : "border border-line text-muted"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-muted">
            Invertido
            <input
              value={invested}
              inputMode="decimal"
              placeholder="150000"
              onChange={(event) => setInvested(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-card/80 px-3 py-2.5 text-ink outline-none"
            />
          </label>
          <label className="block text-sm text-muted">
            Valor actual
            <input
              value={currentValue}
              inputMode="decimal"
              placeholder="180000"
              onChange={(event) => setCurrentValue(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-card/80 px-3 py-2.5 text-ink outline-none"
            />
          </label>
        </div>
        <input
          value={note}
          maxLength={140}
          placeholder="Nota"
          onChange={(event) => setNote(event.target.value)}
          className="w-full rounded-2xl border border-line bg-card/80 px-3 py-2.5 outline-none"
          aria-label="Nota"
        />
        {error ? <p className="text-sm text-expense">{error}</p> : null}
        <div className="flex gap-2">
          {editingId ? (
            <button type="button" onClick={reset} className="rounded-full px-4 py-2 text-sm">
              Cancelar
            </button>
          ) : null}
          <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">
            {editingId ? "Guardar" : "Agregar"}
          </button>
        </div>
      </form>

      <ul className="mt-4 space-y-2">
        {investments.length === 0 ? (
          <li className="glass rounded-3xl px-5 py-10 text-center text-muted">Todavía no cargaste inversiones.</li>
        ) : null}
        {investments.map((investment) => {
          const kindLabel = KINDS.find((item) => item.id === investment.kind);
          const result = investment.currentValue - investment.invested;
          return (
            <li key={investment.id} className="glass flex items-center gap-3 rounded-3xl px-4 py-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: kindLabel?.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{investment.name}</span>
                <span className="block truncate text-sm text-muted">
                  {kindLabel?.label}
                  {investment.note ? ` · ${investment.note}` : ""} · puesto {formatMoney(investment.invested)}
                </span>
              </span>
              <span className="text-right">
                <span className="block font-medium tabular-nums">{formatMoney(investment.currentValue)}</span>
                <span className={`block text-sm tabular-nums ${result >= 0 ? "text-income" : "text-expense"}`}>
                  {result < 0 ? "−" : "+"}
                  {formatMoney(Math.abs(result))}
                </span>
              </span>
              <button type="button" onClick={() => startEdit(investment)} className="text-sm text-muted">
                Editar
              </button>
              <button type="button" onClick={() => onDelete(investment.id)} className="text-sm text-expense">
                Borrar
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
