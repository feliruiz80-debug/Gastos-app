"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatGroupDate, toISODate } from "@/lib/dates";
import { formatSigned } from "@/lib/money";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/body-lock";
import type { CategoryTotal } from "@/lib/stats";
import type { Account, Category, Transaction } from "@/lib/types";
import { AnimatedMoney } from "./animated-number";
import { DonutChart, type SliceDaySummary } from "./donut-chart";

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
  const daySummaries = useMemo(() => {
    const today = toISODate(new Date());
    const dateLabel = formatGroupDate(today, today);
    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const map: Record<string, SliceDaySummary> = {};
    for (const item of totals) {
      if (item.amount <= 0) continue;
      map[item.category.id] = { amount: 0, dateLabel, lines: [] };
    }
    for (const transaction of transactions) {
      if (transaction.date !== today || transaction.type !== type) continue;
      const bucket = map[transaction.categoryId];
      if (!bucket) continue;
      bucket.amount += transaction.amount;
      bucket.lines.push({
        id: transaction.id,
        label: transaction.note || categoryNames.get(transaction.categoryId) || title,
        amount: transaction.amount,
      });
    }
    for (const bucket of Object.values(map)) {
      bucket.lines.sort((a, b) => b.amount - a.amount);
    }
    return map;
  }, [totals, transactions, categories, type, title]);
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
        aria-label={title}
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

        <div className="rounded-3xl border border-line/70 bg-card/40 p-3 sm:p-4">
          <DonutChart
            periodLabel={periodLabel}
            daySummaries={daySummaries}
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
                    {(category?.name || "M").slice(0, 1).toUpperCase()}
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
