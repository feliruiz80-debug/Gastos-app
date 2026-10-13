"use client";

import { useEffect, useState } from "react";
import { positionValue, preferLocalSymbol, type MarketSnapshot } from "@/lib/market";
import { amountToInput, formatMoney, parseAmount, parseBudget, parseUnits } from "@/lib/money";
import type { Investment, InvestmentKind } from "@/lib/types";
import { AnimatedMoney } from "./animated-number";
import { DonutChart } from "./donut-chart";

const KINDS: { id: InvestmentKind; label: string; color: string }[] = [
  { id: "plazo", label: "Plazo fijo", color: "#1d4ed8" },
  { id: "acciones", label: "Acciones", color: "#157a45" },
  { id: "cedear", label: "CEDEAR", color: "#0f766e" },
  { id: "fondo", label: "Fondo", color: "#7c3aed" },
  { id: "cripto", label: "Cripto", color: "#b45309" },
  { id: "otro", label: "Otro", color: "#57534e" },
];

type InvestmentsViewProps = {
  investments: Investment[];
  onSave: (investment: Investment) => string | null;
  onDelete: (id: string) => void;
  onApplyQuotes: (quotes: { symbol: string; resolvedSymbol?: string; priceArs: number }[]) => number;
};

export function InvestmentsView({ investments, onSave, onDelete, onApplyQuotes }: InvestmentsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<InvestmentKind>("cedear");
  const [invested, setInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [note, setNote] = useState("");
  const [symbol, setSymbol] = useState("");
  const [units, setUnits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [marketNote, setMarketNote] = useState<string | null>(null);
  const [marketBusy, setMarketBusy] = useState(false);

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
    setKind("cedear");
    setInvested("");
    setCurrentValue("");
    setNote("");
    setSymbol("");
    setUnits("");
    setError(null);
  }

  function startEdit(investment: Investment) {
    setEditingId(investment.id);
    setName(investment.name);
    setKind(investment.kind);
    setInvested(String(investment.invested));
    setCurrentValue(String(investment.currentValue));
    setNote(investment.note);
    setSymbol(investment.symbol);
    setUnits(investment.units ? String(investment.units) : "");
    setError(null);
  }

  async function fetchQuotes(rawSymbols: string[]): Promise<MarketSnapshot> {
    const response = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ symbols: rawSymbols }),
    });
    const body = (await response.json()) as MarketSnapshot & { error?: string };
    if (!response.ok) throw new Error(body.error || "No se pudo leer el mercado.");
    return body;
  }

  async function refreshSaved() {
    const tracked = investments.filter((item) => item.symbol && item.units > 0);
    if (tracked.length === 0) {
      setMarketNote("Para que se actualice solo, cargá el símbolo y la cantidad.");
      return;
    }
    setMarketBusy(true);
    setMarketNote("Leyendo el mercado…");
    try {
      const snapshot = await fetchQuotes(tracked.map((item) => item.symbol));
      const updated = onApplyQuotes(
        snapshot.quotes.map((quote) => ({
          symbol: quote.symbol,
          resolvedSymbol: quote.resolvedSymbol,
          priceArs: quote.priceArs,
        })),
      );
      const missing = snapshot.missing.length ? ` Sin dato: ${snapshot.missing.join(", ")}.` : "";
      const warning = snapshot.warning ? ` ${snapshot.warning}` : "";
      setMarketNote(
        updated > 0 ? `Actualicé ${updated} con el precio de hoy.${missing}${warning}` : `No llegaron precios nuevos.${missing}${warning}`,
      );
    } catch (cause) {
      setMarketNote(cause instanceof Error ? cause.message : "No se pudo leer el mercado.");
    } finally {
      setMarketBusy(false);
    }
  }

  async function fillFromMarket() {
    const ticker = symbol.trim();
    const quantity = parseUnits(units);
    if (!ticker) {
      setError("Poné el símbolo, por ejemplo AAPL.BA, GGAL.BA o BTC.");
      return;
    }
    if (!quantity) {
      setError("Poné la cantidad para calcular el valor.");
      return;
    }
    setMarketBusy(true);
    setError(null);
    try {
      const snapshot = await fetchQuotes([ticker]);
      const quote = snapshot.quotes[0];
      if (!quote) {
        setError(snapshot.missing[0] ? `No encontré ${snapshot.missing[0]}.` : "Ese símbolo no tiene precio.");
        return;
      }
      setSymbol(quote.resolvedSymbol);
      const total = positionValue(quantity, quote.priceArs);
      setCurrentValue(amountToInput(total));
      const unit = formatMoney(quote.priceArs);
      setMarketNote(
        quote.currency === "USD" && snapshot.mep
          ? `${quote.resolvedSymbol}: ${unit} c/u (dólar × MEP ${formatMoney(snapshot.mep)}). Total ${formatMoney(total)}.`
          : `${quote.resolvedSymbol}: ${unit} c/u × ${quantity} = ${formatMoney(total)}.`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo leer el mercado.");
    } finally {
      setMarketBusy(false);
    }
  }

  useEffect(() => {
    const tracked = investments.filter((item) => item.symbol && item.units > 0);
    if (tracked.length === 0) return;
    let cancelled = false;
    setMarketBusy(true);
    void fetchQuotes(tracked.map((item) => item.symbol))
      .then((snapshot) => {
        if (cancelled) return;
        const updated = onApplyQuotes(
          snapshot.quotes.map((quote) => ({
            symbol: quote.symbol,
            resolvedSymbol: quote.resolvedSymbol,
            priceArs: quote.priceArs,
          })),
        );
        if (updated > 0) setMarketNote("Valores actualizados con el mercado.");
        else if (snapshot.warning) setMarketNote(snapshot.warning);
      })
      .catch(() => {
        if (!cancelled) setMarketNote("No pude leer el mercado ahora. Los valores guardados siguen.");
      })
      .finally(() => {
        if (!cancelled) setMarketBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // Solo al abrir la pestaña: un refresh posterior lo pide el botón.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const ticker = symbol.trim() ? preferLocalSymbol(symbol, kind) : "";
    const quantity = units.trim() ? parseUnits(units) : 0;
    if (ticker && !/^[A-Z0-9][A-Z0-9.-]*$/.test(ticker)) {
      setError("El símbolo solo puede tener letras, números, punto o guion.");
      return;
    }
    if (ticker && !quantity) {
      setError("Poné la cantidad de ese símbolo para poder actualizarla.");
      return;
    }
    if (units.trim() && quantity === null) {
      setError("La cantidad tiene que ser un número, por ejemplo 10 o 0,25.");
      return;
    }
    const message = onSave({
      id: editingId ?? crypto.randomUUID(),
      name: name.trim(),
      kind,
      invested: paid,
      currentValue: now,
      note: note.trim(),
      symbol: ticker,
      units: quantity ?? 0,
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
          <p className="text-sm font-medium tracking-wide text-muted">Lo que está puesto a trabajar</p>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Inversiones</h1>
        </div>
        <button
          type="button"
          onClick={() => void refreshSaved()}
          disabled={marketBusy}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {marketBusy ? "Actualizando…" : "Actualizar mercado"}
        </button>
      </header>
      {marketNote ? <p className="mt-3 text-sm text-muted">{marketNote}</p> : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="glass rounded-3xl p-5">
          <p className="text-sm text-muted">Invertido</p>
          <p className="mt-2 font-display text-3xl">
            <AnimatedMoney value={investedTotal} />
          </p>
        </article>
        <article className="glass rounded-3xl p-5">
          <p className="text-sm text-muted">Valor actual</p>
          <p className="mt-2 font-display text-3xl">
            <AnimatedMoney value={currentTotal} />
          </p>
        </article>
        <article className="glass rounded-3xl p-5">
          <p className="text-sm text-muted">Resultado</p>
          <p className={`mt-2 font-display text-3xl ${gain >= 0 ? "text-income" : "text-expense"}`}>
            <AnimatedMoney value={gain} signed />
          </p>
        </article>
      </section>

      <section className="glass mt-4 rounded-3xl p-5">
        <h2 className="font-display text-2xl tracking-tight">Cómo está repartido</h2>
        <div className="mt-4">
          <DonutChart slices={byKind} />
        </div>
      </section>

      <form onSubmit={submit} className="glass mt-4 space-y-3 rounded-3xl p-5">
        <p className="font-medium">{editingId ? "Editar inversión" : "Nueva inversión"}</p>
        <input
          value={name}
          maxLength={60}
          placeholder="Nombre, por ejemplo Apple CEDEAR o plazo fijo"
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
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
          <label className="block text-sm text-muted">
            Símbolo
            <input
              value={symbol}
              maxLength={15}
              placeholder="MELI.BA, GGAL.BA, BTC"
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
              className="mt-1 w-full rounded-2xl border border-line bg-card/80 px-3 py-2.5 text-ink outline-none"
            />
          </label>
          <label className="block text-sm text-muted">
            Cantidad
            <input
              value={units}
              inputMode="decimal"
              placeholder="10"
              onChange={(event) => setUnits(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-line bg-card/80 px-3 py-2.5 text-ink outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => void fillFromMarket()}
            disabled={marketBusy}
            className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Traer precio
          </button>
        </div>
        <p className="text-sm text-muted">
          CEDEAR o acción: MELI o MELI.BA (ByMA en pesos). Si ponés solo MELI, usa el precio local, no el de Wall Street. Cripto: BTC o ETH.
        </p>
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
          const unitPrice =
            investment.symbol && investment.units > 0 ? investment.currentValue / investment.units : null;
          return (
            <li key={investment.id} className="glass flex items-center gap-3 rounded-3xl px-4 py-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: kindLabel?.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{investment.name}</span>
                <span className="block truncate text-sm text-muted">
                  {kindLabel?.label}
                  {investment.symbol
                    ? ` · ${investment.symbol}${investment.units ? ` × ${investment.units}` : ""}${
                        unitPrice ? ` · ${formatMoney(unitPrice)} c/u` : ""
                      }`
                    : ""}
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
