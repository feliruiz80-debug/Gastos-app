"use client";

import { useEffect, useState } from "react";
import { sanitizeData, toBackup } from "@/lib/backup";
import { defaultDateForMonth, lastMonths, toISODate } from "@/lib/dates";
import { amountToInput } from "@/lib/money";
import { applySeed } from "@/lib/seed";
import { balanceOf, inMonth, monthSeries, sumAmount, totalsByCategory } from "@/lib/stats";
import { emptyData } from "@/lib/defaults";
import { loadData, saveData } from "@/lib/storage";
import type { AppData, Category, Transaction, TxType } from "@/lib/types";
import { CategoryDialog } from "./category-dialog";
import { Dashboard } from "./dashboard";
import { Modal } from "./modal";
import { TransactionDialog, type Draft } from "./transaction-dialog";

type ConfirmState = {
  title: string;
  body: string;
  confirmLabel: string;
  action: () => void;
};

export function ExpenseApp() {
  const [data, setData] = useState<AppData | null>(null);
  const [month, setMonth] = useState("");
  const [scope, setScope] = useState<"month" | "all">("month");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TxType>("all");
  const [categoryView, setCategoryView] = useState<TxType>("expense");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setData(loadData());
    setMonth(toISODate(new Date()).slice(0, 7));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!data || !month) return <Skeleton />;

  const period = scope === "month" ? inMonth(data.transactions, month) : data.transactions;
  const filtered = period.filter((transaction) => {
    if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
    const term = query.trim().toLowerCase();
    if (!term) return true;
    const category = data.categories.find((item) => item.id === transaction.categoryId);
    return `${transaction.note} ${category?.name ?? ""}`.toLowerCase().includes(term);
  });
  const chartAnchor = scope === "month" ? month : toISODate(new Date()).slice(0, 7);
  const counts = data.transactions.reduce<Record<string, number>>((map, transaction) => {
    map[transaction.categoryId] = (map[transaction.categoryId] ?? 0) + 1;
    return map;
  }, {});

  function commit(next: AppData) {
    setData(next);
    saveData(next);
  }

  function showToast(message: string) {
    setToast(message);
  }

  function openNew(type: TxType) {
    setDraft({
      type,
      amount: "",
      categoryId: data?.categories.find((category) => category.type === type)?.id ?? "",
      note: "",
      date: scope === "month" ? defaultDateForMonth(month) : toISODate(new Date()),
    });
  }

  function openEdit(transaction: Transaction) {
    setDraft({
      id: transaction.id,
      type: transaction.type,
      amount: amountToInput(transaction.amount),
      categoryId: transaction.categoryId,
      note: transaction.note,
      date: transaction.date,
    });
  }

  function saveTransaction(nextDraft: Draft, amount: number) {
    if (!data) return;
    const existing = data.transactions.find((transaction) => transaction.id === nextDraft.id);
    const transaction: Transaction = {
      id: nextDraft.id ?? crypto.randomUUID(),
      type: nextDraft.type,
      amount,
      categoryId: nextDraft.categoryId,
      note: nextDraft.note,
      date: nextDraft.date,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const transactions = nextDraft.id
      ? data.transactions.map((item) => (item.id === nextDraft.id ? transaction : item))
      : [...data.transactions, transaction];
    commit({ ...data, transactions });
    setDraft(null);
    if (scope === "month" && !nextDraft.date.startsWith(month)) setMonth(nextDraft.date.slice(0, 7));
    showToast(nextDraft.id ? "Movimiento actualizado" : "Movimiento guardado");
  }

  function deleteTransaction(id: string) {
    if (!data) return;
    commit({ ...data, transactions: data.transactions.filter((transaction) => transaction.id !== id) });
    setDraft(null);
    setConfirm(null);
    showToast("Movimiento eliminado");
  }

  function askDelete(transaction: Transaction) {
    const label = transaction.note || "este movimiento";
    setConfirm({
      title: "Eliminar movimiento",
      body: `Se va a borrar “${label}” de este navegador.`,
      confirmLabel: "Eliminar",
      action: () => deleteTransaction(transaction.id),
    });
  }

  function createCategory(input: { name: string; type: TxType; color: string }): string | null {
    if (!data) return "No se pudo guardar.";
    const duplicate = data.categories.some(
      (category) => category.type === input.type && category.name.toLowerCase() === input.name.toLowerCase(),
    );
    if (duplicate) return "Ya existe una categoría con ese nombre.";
    if (data.categories.length >= 40) return "Llegaste al máximo de categorías.";
    commit({
      ...data,
      categories: [...data.categories, { id: crypto.randomUUID(), ...input }],
    });
    showToast("Categoría creada");
    return null;
  }

  function updateCategory(category: Category): string | null {
    if (!data) return "No se pudo guardar.";
    const current = data.categories.find((item) => item.id === category.id);
    if (!current) return "Esa categoría ya no está.";
    const duplicate = data.categories.some(
      (item) =>
        item.id !== category.id &&
        item.type === current.type &&
        item.name.toLowerCase() === category.name.toLowerCase(),
    );
    if (duplicate) return "Ya existe una categoría con ese nombre.";
    commit({
      ...data,
      categories: data.categories.map((item) =>
        item.id === category.id ? { ...current, name: category.name, color: category.color } : item,
      ),
    });
    showToast("Categoría actualizada");
    return null;
  }

  function deleteCategory(id: string): string | null {
    if (!data) return "No se pudo eliminar.";
    if (data.transactions.some((transaction) => transaction.categoryId === id)) {
      return "Hay movimientos con esta categoría. Cambiales la categoría o eliminalos antes.";
    }
    commit({ ...data, categories: data.categories.filter((category) => category.id !== id) });
    showToast("Categoría eliminada");
    return null;
  }

  function exportBackup() {
    if (!data) return;
    const blob = new Blob([JSON.stringify(toBackup(data), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gastos-${toISODate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Respaldo descargado");
  }

  async function importBackup(file: File) {
    if (file.size > 2_000_000) {
      showToast("Ese archivo es demasiado grande.");
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      showToast("Ese archivo no es un respaldo válido.");
      return;
    }
    const next = sanitizeData(parsed);
    if (!next) {
      showToast("Ese archivo no es un respaldo válido.");
      return;
    }
    setConfirm({
      title: "Importar respaldo",
      body: "Esto reemplaza las categorías y los movimientos de este navegador.",
      confirmLabel: "Reemplazar",
      action: () => {
        commit(next);
        setConfirm(null);
        setDraft(null);
        showToast("Respaldo importado");
      },
    });
  }

  function askSeed() {
    if (!data) return;
    const run = () => {
      commit(applySeed(data));
      setScope("month");
      setMonth(toISODate(new Date()).slice(0, 7));
      setConfirm(null);
      showToast("Ejemplos cargados");
    };
    if (data.transactions.length === 0) {
      run();
      return;
    }
    setConfirm({
      title: "Cargar ejemplos",
      body: "Se reemplazan los movimientos por datos de ejemplo. Tus categorías extra se conservan.",
      confirmLabel: "Cargar",
      action: run,
    });
  }

  return (
    <>
      <Dashboard
        scope={scope}
        month={month}
        balance={balanceOf(data.transactions)}
        income={sumAmount(period, "income")}
        expense={sumAmount(period, "expense")}
        series={monthSeries(data.transactions, lastMonths(chartAnchor, 6))}
        categoryView={categoryView}
        categoryTotals={totalsByCategory(period, data.categories, categoryView)}
        transactions={filtered}
        categories={data.categories}
        query={query}
        typeFilter={typeFilter}
        hasAny={data.transactions.length > 0}
        onMonth={setMonth}
        onScope={setScope}
        onCategoryView={setCategoryView}
        onQuery={setQuery}
        onTypeFilter={setTypeFilter}
        onAdd={openNew}
        onEdit={openEdit}
        onDelete={askDelete}
        onSeed={askSeed}
        onOpenCategories={() => setCategoriesOpen(true)}
        onExport={exportBackup}
        onImport={(file) => void importBackup(file)}
        onClear={() =>
          setConfirm({
            title: "Borrar movimientos",
            body: "Se borran todos los movimientos. Las categorías quedan.",
            confirmLabel: "Borrar",
            action: () => {
              commit({ ...data, transactions: [] });
              setConfirm(null);
              setDraft(null);
              showToast("Movimientos borrados");
            },
          })
        }
        onReset={() =>
          setConfirm({
            title: "Restablecer app",
            body: "Vuelve a las categorías iniciales y borra todos los movimientos.",
            confirmLabel: "Restablecer",
            action: () => {
              commit(emptyData());
              setConfirm(null);
              setDraft(null);
              showToast("App restablecida");
            },
          })
        }
      />

      {draft && !categoriesOpen && !confirm ? (
        <TransactionDialog
          draft={draft}
          categories={data.categories}
          onClose={() => setDraft(null)}
          onSave={saveTransaction}
          onDelete={
            draft.id
              ? () => {
                  const current = data.transactions.find((transaction) => transaction.id === draft.id);
                  if (current) askDelete(current);
                }
              : undefined
          }
          onManageCategories={(snapshot) => {
            setDraft(snapshot);
            setCategoriesOpen(true);
          }}
        />
      ) : null}

      {categoriesOpen && !confirm ? (
        <CategoryDialog
          categories={data.categories}
          counts={counts}
          onClose={() => setCategoriesOpen(false)}
          onCreate={createCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
        />
      ) : null}

      {confirm ? (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <h2 className="font-display text-3xl tracking-tight">{confirm.title}</h2>
          <p className="mt-3 text-muted">{confirm.body}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirm(null)} className="rounded-full px-4 py-2.5 text-sm">
              Cancelar
            </button>
            <button type="button" onClick={confirm.action} className="rounded-full bg-expense px-4 py-2.5 text-sm font-semibold text-white">
              {confirm.confirmLabel}
            </button>
          </div>
        </Modal>
      ) : null}

      {toast ? (
        <div role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-lg sm:bottom-6">
          {toast}
        </div>
      ) : null}
    </>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-14 w-72 animate-pulse rounded-2xl bg-paper-deep" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-3xl bg-paper-deep" />
        ))}
      </div>
    </div>
  );
}
