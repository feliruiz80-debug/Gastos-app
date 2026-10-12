"use client";

import { useEffect, useRef, useState } from "react";
import { sanitizeData, toBackup } from "@/lib/backup";
import { positionValue } from "@/lib/market";
import { defaultDateForMonth, formatMonth, lastMonths, toISODate } from "@/lib/dates";
import { emptyData } from "@/lib/defaults";
import { mergeSheet } from "@/lib/mergeSheet";
import { amountToInput } from "@/lib/money";
import { applySeed } from "@/lib/seed";
import type { SheetPayload } from "@/lib/sheets";
import { accountBalances, availableBalance, categoryBreakdown, inMonth, monthSeries, sumAmount } from "@/lib/stats";
import { loadData, saveData } from "@/lib/storage";
import type { Account, AppData, Category, Investment, Transaction, TxType } from "@/lib/types";
import { AccountsDialog } from "./accounts-dialog";
import { BottomNav, type AppTab } from "./bottom-nav";
import { CategoryDialog } from "./category-dialog";
import { Dashboard } from "./dashboard";
import { FlowPanel } from "./flow-panel";
import { InvestmentsView } from "./investments-view";
import { Modal } from "./modal";
import { SettingsView } from "./settings-view";
import { TransactionDialog, type Draft } from "./transaction-dialog";
import { UpdateCartel } from "./update-button";

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
  const [accountFilter, setAccountFilter] = useState("all");
  const [categoryView, setCategoryView] = useState<Exclude<TxType, "transfer">>("expense");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<AppTab>("home");
  const [flow, setFlow] = useState<"income" | "expense" | null>(null);
  const dataRef = useRef<AppData | null>(data);
  dataRef.current = data;

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
    if (
      accountFilter !== "all" &&
      transaction.accountId !== accountFilter &&
      transaction.toAccountId !== accountFilter
    ) {
      return false;
    }
    const term = query.trim().toLowerCase();
    if (!term) return true;
    const category = data.categories.find((item) => item.id === transaction.categoryId);
    const account = data.accounts.find((item) => item.id === transaction.accountId);
    const target = data.accounts.find((item) => item.id === transaction.toAccountId);
    return `${transaction.note} ${category?.name ?? ""} ${account?.name ?? ""} ${target?.name ?? ""}`
      .toLowerCase()
      .includes(term);
  });
  const chartAnchor = scope === "month" ? month : toISODate(new Date()).slice(0, 7);
  const categoryCounts = data.transactions.reduce<Record<string, number>>((map, transaction) => {
    if (!transaction.categoryId) return map;
    map[transaction.categoryId] = (map[transaction.categoryId] ?? 0) + 1;
    return map;
  }, {});
  const accountCounts = data.transactions.reduce<Record<string, number>>((map, transaction) => {
    map[transaction.accountId] = (map[transaction.accountId] ?? 0) + 1;
    if (transaction.toAccountId) map[transaction.toAccountId] = (map[transaction.toAccountId] ?? 0) + 1;
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
    const accountId =
      accountFilter !== "all" ? accountFilter : data?.accounts[0]?.id ?? "";
    const toAccountId = data?.accounts.find((account) => account.id !== accountId)?.id ?? "";
    setDraft({
      type,
      amount: "",
      categoryId:
        type === "transfer"
          ? ""
          : data?.categories.find((category) => category.type === type)?.id ?? "",
      accountId,
      toAccountId,
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
      accountId: transaction.accountId,
      toAccountId: transaction.toAccountId ?? "",
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
      categoryId: nextDraft.type === "transfer" ? "" : nextDraft.categoryId,
      accountId: nextDraft.accountId,
      toAccountId: nextDraft.type === "transfer" ? nextDraft.toAccountId : undefined,
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

  function createCategory(input: {
    name: string;
    type: Exclude<TxType, "transfer">;
    color: string;
    monthlyBudget: number;
  }): string | null {
    if (!data) return "No se pudo guardar.";
    const duplicate = data.categories.some(
      (category) => category.type === input.type && category.name.toLowerCase() === input.name.toLowerCase(),
    );
    if (duplicate) return "Ya existe una categoría con ese nombre.";
    if (data.categories.length >= 40) return "Llegaste al máximo de categorías.";
    commit({ ...data, categories: [...data.categories, { id: crypto.randomUUID(), ...input }] });
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
        item.id === category.id
          ? { ...current, name: category.name, color: category.color, monthlyBudget: category.monthlyBudget }
          : item,
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

  function createAccount(input: { name: string; color: string; openingBalance: number }): string | null {
    if (!data) return "No se pudo guardar.";
    const duplicate = data.accounts.some((account) => account.name.toLowerCase() === input.name.toLowerCase());
    if (duplicate) return "Ya existe una cuenta con ese nombre.";
    if (data.accounts.length >= 20) return "Llegaste al máximo de cuentas.";
    commit({ ...data, accounts: [...data.accounts, { id: crypto.randomUUID(), ...input }] });
    showToast("Cuenta creada");
    return null;
  }

  function updateAccount(account: Account): string | null {
    if (!data) return "No se pudo guardar.";
    const current = data.accounts.find((item) => item.id === account.id);
    if (!current) return "Esa cuenta ya no está.";
    const duplicate = data.accounts.some(
      (item) => item.id !== account.id && item.name.toLowerCase() === account.name.toLowerCase(),
    );
    if (duplicate) return "Ya existe una cuenta con ese nombre.";
    commit({
      ...data,
      accounts: data.accounts.map((item) => (item.id === account.id ? { ...current, ...account } : item)),
    });
    showToast("Cuenta actualizada");
    return null;
  }

  function deleteAccount(id: string): string | null {
    if (!data) return "No se pudo eliminar.";
    if (data.accounts.length <= 1) return "Tiene que quedar al menos una cuenta.";
    if (data.transactions.some((transaction) => transaction.accountId === id || transaction.toAccountId === id)) {
      return "Hay movimientos en esta cuenta. Pasalos a otra o eliminalos antes.";
    }
    commit({ ...data, accounts: data.accounts.filter((account) => account.id !== id) });
    if (accountFilter === id) setAccountFilter("all");
    showToast("Cuenta eliminada");
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
      body: "Esto reemplaza las categorías, las cuentas y los movimientos de este navegador.",
      confirmLabel: "Reemplazar",
      action: () => {
        commit(next);
        setConfirm(null);
        setDraft(null);
        showToast("Respaldo importado");
      },
    });
  }

  async function syncSheet() {
    if (!data || syncing) return;
    setSyncing(true);
    try {
      const response = await fetch(`/api/sheets?t=${Date.now()}`, { cache: "no-store" });
      const body = (await response.json()) as SheetPayload & { error?: string };
      if (!response.ok) throw new Error(body.error || "No se pudo leer la hoja.");
      const next = mergeSheet(data, body);
      commit(next);
      const added = body.movimientos.length;
      showToast(added === 1 ? "Llegó 1 movimiento de la hoja" : `Llegaron ${added} movimientos de la hoja`);
    } catch (cause) {
      showToast(cause instanceof Error ? cause.message : "No se pudo leer la hoja.");
    } finally {
      setSyncing(false);
    }
  }

  function saveInvestment(investment: Investment): string | null {
    if (!data) return "No se pudo guardar.";
    const investments = data.investments ?? [];
    const duplicate = investments.some(
      (item) => item.id !== investment.id && item.name.toLowerCase() === investment.name.toLowerCase(),
    );
    if (duplicate) return "Ya existe una inversión con ese nombre.";
    const exists = investments.some((item) => item.id === investment.id);
    commit({
      ...data,
      investments: exists
        ? investments.map((item) => (item.id === investment.id ? investment : item))
        : [...investments, investment],
    });
    showToast(exists ? "Inversión actualizada" : "Inversión guardada");
    return null;
  }

  function deleteInvestment(id: string) {
    if (!data) return;
    commit({ ...data, investments: (data.investments ?? []).filter((item) => item.id !== id) });
    showToast("Inversión eliminada");
  }

  function applyMarketQuotes(quotes: { symbol: string; priceArs: number }[]) {
    const current = dataRef.current;
    if (!current || quotes.length === 0) return 0;
    const prices = new Map(quotes.map((quote) => [quote.symbol.toUpperCase(), quote.priceArs]));
    let updated = 0;
    const investments = (current.investments ?? []).map((item) => {
      if (!item.symbol || !item.units) return item;
      const priceArs = prices.get(item.symbol.toUpperCase());
      if (!priceArs) return item;
      const currentValue = positionValue(item.units, priceArs);
      if (currentValue === item.currentValue) return item;
      updated += 1;
      return { ...item, currentValue };
    });
    if (updated > 0) commit({ ...current, investments });
    return updated;
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
      body: "Se reemplazan los movimientos por datos de ejemplo. Tus categorías y cuentas extra se conservan.",
      confirmLabel: "Cargar",
      action: run,
    });
  }

  const dialogsClosed = !categoriesOpen && !accountsOpen && !confirm;
  const periodLabel = scope === "month" ? formatMonth(month) : "Todo el historial";

  return (
    <>
      <UpdateCartel />
      {tab === "home" ? (
      <Dashboard
        scope={scope}
        month={month}
        balance={availableBalance(data.accounts, data.transactions)}
        income={sumAmount(period, "income")}
        expense={sumAmount(period, "expense")}
        series={monthSeries(data.transactions, lastMonths(chartAnchor, 6))}
        categoryView={categoryView}
        categoryTotals={categoryBreakdown(period, data.categories, categoryView, scope === "month" ? month : "all")}
        accountBalances={accountBalances(data.accounts, data.transactions)}
        transactions={filtered}
        categories={data.categories}
        accounts={data.accounts}
        query={query}
        typeFilter={typeFilter}
        accountFilter={accountFilter}
        hasAny={data.transactions.length > 0}
        syncing={syncing}
        onMonth={setMonth}
        onScope={setScope}
        onCategoryView={setCategoryView}
        onQuery={setQuery}
        onTypeFilter={setTypeFilter}
        onAccountFilter={setAccountFilter}
        onAdd={openNew}
        onEdit={openEdit}
        onDelete={askDelete}
        onOpenFlow={setFlow}
        onSync={() => void syncSheet()}
      />
      ) : null}
      {tab === "investments" ? (
        <InvestmentsView
          investments={data.investments ?? []}
          onSave={saveInvestment}
          onDelete={deleteInvestment}
          onApplyQuotes={applyMarketQuotes}
        />
      ) : null}
      {tab === "settings" ? (
        <SettingsView
          syncing={syncing}
          onOpenCategories={() => setCategoriesOpen(true)}
          onOpenAccounts={() => setAccountsOpen(true)}
          onSync={() => void syncSheet()}
          onExport={exportBackup}
          onImport={(file) => void importBackup(file)}
          onSeed={askSeed}
          onClear={() =>
            setConfirm({
              title: "Borrar movimientos",
              body: "Se borran todos los movimientos. Las categorías, las cuentas y los saldos iniciales quedan.",
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
              body: "Vuelve a las categorías y cuentas iniciales, y borra todos los movimientos.",
              confirmLabel: "Restablecer",
              action: () => {
                commit(emptyData());
                setConfirm(null);
                setDraft(null);
                setAccountFilter("all");
                showToast("App restablecida");
              },
            })
          }
        />
      ) : null}
      <BottomNav tab={tab} onChange={setTab} />
      {flow ? (
        <FlowPanel
          type={flow}
          periodLabel={periodLabel}
          totals={categoryBreakdown(period, data.categories, flow, scope === "month" ? month : "all")}
          transactions={period.filter((transaction) => transaction.type === flow)}
          categories={data.categories}
          accounts={data.accounts}
          onClose={() => setFlow(null)}
          onEdit={(transaction) => {
            setFlow(null);
            openEdit(transaction);
          }}
        />
      ) : null}

      {draft && dialogsClosed ? (
        <TransactionDialog
          draft={draft}
          categories={data.categories}
          accounts={data.accounts}
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
          counts={categoryCounts}
          onClose={() => setCategoriesOpen(false)}
          onCreate={createCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
        />
      ) : null}

      {accountsOpen && !confirm ? (
        <AccountsDialog
          accounts={data.accounts}
          counts={accountCounts}
          onClose={() => setAccountsOpen(false)}
          onCreate={createAccount}
          onUpdate={updateAccount}
          onDelete={deleteAccount}
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
            <button type="button" onClick={confirm.action} className="rounded-full bg-expense-solid px-4 py-2.5 text-sm font-semibold text-white">
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
