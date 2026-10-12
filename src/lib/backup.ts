import { defaultAccounts, defaultCategories } from "./defaults";
import { isValidISODate } from "./dates";
import type { Account, AppData, BackupFile, Category, Transaction, TxType } from "./types";

const MAX_NAME = 60;
const MAX_NOTE = 140;
const MAX_MONEY = 1_000_000_000_000;

function isFlowType(value: unknown): value is Exclude<TxType, "transfer"> {
  return value === "income" || value === "expense";
}

function isType(value: unknown): value is TxType {
  return value === "income" || value === "expense" || value === "transfer";
}

function cleanMoney(value: unknown, allowNegative: boolean): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (Math.abs(value) > MAX_MONEY) return null;
  if (!allowNegative && value < 0) return null;
  return Math.round(value * 100) / 100;
}

function cleanCategory(value: unknown): Category | null {
  if (!value || typeof value !== "object") return null;
  const category = value as Partial<Category>;
  if (typeof category.id !== "string" || category.id.trim().length === 0) return null;
  if (typeof category.name !== "string") return null;
  const name = category.name.trim();
  if (!name || name.length > MAX_NAME) return null;
  if (!isFlowType(category.type)) return null;
  if (typeof category.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(category.color)) return null;
  const monthlyBudget = cleanMoney(category.monthlyBudget ?? 0, false);
  if (monthlyBudget === null) return null;
  return { id: category.id, name, type: category.type, color: category.color, monthlyBudget };
}

function cleanAccount(value: unknown): Account | null {
  if (!value || typeof value !== "object") return null;
  const account = value as Partial<Account>;
  if (typeof account.id !== "string" || account.id.trim().length === 0) return null;
  if (typeof account.name !== "string") return null;
  const name = account.name.trim();
  if (!name || name.length > MAX_NAME) return null;
  if (typeof account.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(account.color)) return null;
  const openingBalance = cleanMoney(account.openingBalance ?? 0, true);
  if (openingBalance === null) return null;
  return { id: account.id, name, color: account.color, openingBalance };
}

function cleanTransaction(value: unknown): Transaction | null {
  if (!value || typeof value !== "object") return null;
  const transaction = value as Partial<Transaction>;
  if (typeof transaction.id !== "string" || transaction.id.trim().length === 0) return null;
  if (!isType(transaction.type)) return null;
  const amount = cleanMoney(transaction.amount, false);
  if (amount === null || amount <= 0) return null;
  if (transaction.type !== "transfer") {
    if (typeof transaction.categoryId !== "string" || transaction.categoryId.length === 0) return null;
  } else if (transaction.categoryId !== undefined && typeof transaction.categoryId !== "string") {
    return null;
  }
  if (typeof transaction.note !== "string" || transaction.note.length > MAX_NOTE) return null;
  if (typeof transaction.date !== "string" || !isValidISODate(transaction.date)) return null;
  const accountId = typeof transaction.accountId === "string" ? transaction.accountId : "";
  const toAccountId =
    typeof transaction.toAccountId === "string" && transaction.toAccountId.length > 0
      ? transaction.toAccountId
      : undefined;
  if (transaction.type === "transfer" && (!toAccountId || toAccountId === accountId)) return null;
  const createdAt =
    typeof transaction.createdAt === "string" && transaction.createdAt.length > 0
      ? transaction.createdAt
      : new Date(`${transaction.date}T12:00:00`).toISOString();
  return {
    id: transaction.id,
    type: transaction.type,
    amount,
    categoryId: transaction.type === "transfer" ? "" : transaction.categoryId!,
    accountId,
    toAccountId: transaction.type === "transfer" ? toAccountId : undefined,
    note: transaction.note.trim(),
    date: transaction.date,
    createdAt,
  };
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export function sanitizeData(input: unknown): AppData | null {
  if (!input || typeof input !== "object") return null;
  const record = input as { categories?: unknown; accounts?: unknown; transactions?: unknown };
  if (!Array.isArray(record.categories) || !Array.isArray(record.transactions)) return null;

  const categories = uniqueById(
    record.categories.map(cleanCategory).filter((category): category is Category => category !== null),
  );
  const accounts = uniqueById(
    (Array.isArray(record.accounts) ? record.accounts : [])
      .map(cleanAccount)
      .filter((account): account is Account => account !== null),
  );
  if (categories.length === 0 && record.categories.length > 0) return null;

  const safeCategories = categories.length > 0 ? categories : defaultCategories.map((category) => ({ ...category }));
  const safeAccounts = accounts.length > 0 ? accounts : defaultAccounts.map((account) => ({ ...account }));
  const knownAccounts = new Set(safeAccounts.map((account) => account.id));
  const fallbackAccount = safeAccounts[0]?.id ?? "";

  const transactions = uniqueById(
    record.transactions
      .map(cleanTransaction)
      .filter((transaction): transaction is Transaction => transaction !== null),
  )
    .map((transaction) => ({
      ...transaction,
      accountId: knownAccounts.has(transaction.accountId) ? transaction.accountId : fallbackAccount,
      toAccountId:
        transaction.toAccountId && knownAccounts.has(transaction.toAccountId)
          ? transaction.toAccountId
          : undefined,
    }))
    .filter((transaction) => transaction.type !== "transfer" || (transaction.toAccountId && transaction.toAccountId !== transaction.accountId));

  return {
    categories: safeCategories,
    accounts: safeAccounts,
    transactions,
  };
}

export function toBackup(data: AppData, now = new Date()): BackupFile {
  return {
    version: 2,
    exportedAt: now.toISOString(),
    categories: data.categories,
    accounts: data.accounts,
    transactions: data.transactions,
  };
}
