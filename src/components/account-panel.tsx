"use client";

import { useEffect, useRef, useState } from "react";
import { formatGroupDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-lock";
import type { AccountFlow } from "@/lib/stats";
import type { Account, Category, Transaction } from "@/lib/types";
import { AnimatedMoney } from "./animated-number";

type AccountPanelProps = {
  account: Account;
  balance: number;
  periodLabel: string;
  flow: AccountFlow;
  categories: Category[];
  accounts: Account[];
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
};

function signedForAccount(transaction: Transaction, accountId: string): { amount: number; tone: "in" | "out" } {
  if (transaction.type === "income") return { amount: transaction.amount, tone: "in" };
  if (transaction.type === "expense") return { amount: transaction.amount, tone: "out" };
  if (transaction.toAccountId === accountId) return { amount: transaction.amount, tone: "in" };
  return { amount: transaction.amount, tone: "out" };
}

export function AccountPanel({
  account,
  balance,
  periodLabel,
  flow,
  categories,
  accounts,
  onClose,
  onEdit,
}: AccountPanelProps) {
  const byCategory = new Map(categories.map((category) => [category.id, category]));
  const byAccount = new Map(accounts.map((item) => [item.id, item]));
  const sorted = [...flow.transactions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
  const sheetRef = useRef<HTMLElement>(null);
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const active = useRef(false);
  const offsetRef = useRef(0);
  const [offsetY, setOffsetY] = useState(0);
  const [draggingUi, setDraggingUi] = useState(false);

  useEffect(() => {
    const snapshot = lockBodyScroll();
    return () => unlockBodyScroll(snapshot);
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const canStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      const fromHandle = Boolean(target?.closest("[data-drag-handle]"));
      return fromHandle || sheet.scrollTop <= 0;
    };

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !canStart(event)) return;
      startY.current = event.touches[0].clientY;
      startX.current = event.touches[0].clientX;
      active.current = true;
      setDraggingUi(true);
    };

    const onMove = (event: TouchEvent) => {
      if (!active.current || startY.current === null || startX.current === null) return;
      const y = event.touches[0].clientY;
      const x = event.touches[0].clientX;
      const dy = y - startY.current;
      const dx = x - startX.current;

      if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy)) {
        event.preventDefault();
        return;
      }

      if (dy > 0) {
        event.preventDefault();
        offsetRef.current = dy;
        setOffsetY(dy);
      } else if (offsetRef.current !== 0) {
        offsetRef.current = 0;
        setOffsetY(0);
      }
    };

    const onEnd = () => {
      if (!active.current) return;
      active.current = false;
      setDraggingUi(false);
      const dy = offsetRef.current;
      offsetRef.current = 0;
      startY.current = null;
      startX.current = null;
      if (dy > 110) {
        setOffsetY(0);
        onClose();
        return;
      }
      setOffsetY(0);
    };

    sheet.addEventListener("touchstart", onStart, { passive: true });
    sheet.addEventListener("touchmove", onMove, { passive: false });
    sheet.addEventListener("touchend", onEnd);
    sheet.addEventListener("touchcancel", onEnd);
    return () => {
      sheet.removeEventListener("touchstart", onStart);
      sheet.removeEventListener("touchmove", onMove);
      sheet.removeEventListener("touchend", onEnd);
      sheet.removeEventListener("touchcancel", onEnd);
    };
  }, [onClose]);

  return (
    <div className="modal-root fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6" onMouseDown={onClose}>
      <section
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={account.name}
        className="modal-sheet glass max-h-[92vh] w-full overflow-y-auto overscroll-y-contain rounded-t-3xl p-5 sm:max-w-3xl sm:rounded-3xl sm:p-6"
        style={{
          transform: offsetY > 0 ? `translate3d(0, ${offsetY}px, 0)` : undefined,
          transition: draggingUi ? "none" : "transform 220ms cubic-bezier(0.22, 1.2, 0.36, 1)",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div data-drag-handle className="modal-handle mx-auto mb-4 sm:hidden" aria-hidden="true" />
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm text-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: account.color }} />
              {periodLabel}
            </p>
            <h2 className="font-display text-4xl tracking-tight">{account.name}</h2>
            <p className={`mt-1 font-display text-2xl ${balance < 0 ? "text-expense" : "text-ink"}`}>
              <AnimatedMoney value={balance} />
            </p>
            <p className="mt-1 text-sm text-muted">Saldo actual de la cuenta</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-sm text-muted">
            Cerrar
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-3xl border border-line/70 bg-card/50 p-4">
            <p className="text-sm text-muted">Entró</p>
            <p className="mt-2 font-display text-3xl tracking-tight text-income">
              <AnimatedMoney value={flow.inflow} signed />
            </p>
            <p className="mt-2 text-sm text-muted">Ingresos y pases que llegaron</p>
          </article>
          <article className="rounded-3xl border border-line/70 bg-card/50 p-4">
            <p className="text-sm text-muted">Salió</p>
            <p className="mt-2 font-display text-3xl tracking-tight text-expense">
              <AnimatedMoney value={flow.outflow === 0 ? 0 : -flow.outflow} />
            </p>
            <p className="mt-2 text-sm text-muted">Gastos y pases que salieron</p>
          </article>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3 rounded-3xl border border-line/70 bg-card/50 px-4 py-3">
          <p className="text-sm text-muted">Neto del período</p>
          <p
            className={`font-display text-xl tracking-tight tabular-nums ${
              flow.inflow - flow.outflow >= 0 ? "text-income" : "text-expense"
            }`}
          >
            <AnimatedMoney value={flow.inflow - flow.outflow} signed />
          </p>
        </div>

        <h3 className="mt-6 font-display text-2xl tracking-tight">Movimientos</h3>
        <p className="mb-3 text-sm text-muted">
          {sorted.length === 1 ? "1 movimiento" : `${sorted.length} movimientos`}
        </p>

        <ul className="space-y-2">
          {sorted.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">No hay movimientos en esta cuenta en el período.</li>
          ) : null}
          {sorted.map((transaction) => {
            const category = byCategory.get(transaction.categoryId);
            const from = byAccount.get(transaction.accountId);
            const to = transaction.toAccountId ? byAccount.get(transaction.toAccountId) : undefined;
            const { amount, tone } = signedForAccount(transaction, account.id);
            const title =
              transaction.note ||
              (transaction.type === "transfer" ? "Pase" : category?.name) ||
              (tone === "in" ? "Entrada" : "Salida");
            const subtitle =
              transaction.type === "transfer"
                ? `${from?.name ?? "Sin cuenta"} → ${to?.name ?? "Sin cuenta"} · ${formatGroupDate(transaction.date)}`
                : `${formatGroupDate(transaction.date)} · ${category?.name ?? (transaction.type === "income" ? "Ingreso" : "Gasto")}`;
            const color = category?.color ?? (tone === "in" ? account.color : "#9a3412");
            return (
              <li key={transaction.id}>
                <button
                  type="button"
                  onClick={() => onEdit(transaction)}
                  className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-paper/70"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    {(category?.name || account.name || "M").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{title}</span>
                    <span className="block truncate text-sm text-muted">{subtitle}</span>
                  </span>
                  <span
                    className={`shrink-0 font-medium tabular-nums ${tone === "in" ? "text-income" : "text-expense"}`}
                  >
                    {tone === "in" ? `+${formatMoney(amount)}` : `−${formatMoney(amount)}`}
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
