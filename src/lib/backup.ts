import { defaultCategories } from "./defaults";
import { isValidISODate } from "./dates";
import type { AppData, BackupFile, Category, Transaction, TxType } from "./types";

const MAX_NAME = 40;
const MAX_NOTE = 140;

function isType(value: unknown): value is TxType {
  return value === "income" || value === "expense";
}

function cleanCategory(value: unknown): Category | null {
  if (!value || typeof value !== "object") return null;
  const category = value as Partial<Category>;
  if (typeof category.id !== "string" || category.id.trim().length === 0) return null;
  if (typeof category.name !== "string") return null;
  const name = category.name.trim();
  if (!name || name.length > MAX_NAME) return null;
  if (!isType(category.type)) return null;
  if (typeof category.color !== "string" || !/^#[0-9a-fA-F]{6}$/.test(category.color)) {
    return null;
  }
  return { id: category.id, name, type: category.type, color: category.color };
}

function cleanTransaction(value: unknown): Transaction | null {
  if (!value || typeof value !== "object") return null;
  const transaction = value as Partial<Transaction>;
  if (typeof transaction.id !== "string" || transaction.id.trim().length === 0) return null;
  if (!isType(transaction.type)) return null;
  if (typeof transaction.amount !== "number" || !Number.isFinite(transaction.amount)) return null;
  if (transaction.amount <= 0 || transaction.amount > 1_000_000_000_000) return null;
  if (typeof transaction.categoryId !== "string" || transaction.categoryId.length === 0) {
    return null;
  }
  if (typeof transaction.note !== "string" || transaction.note.length > MAX_NOTE) return null;
  if (typeof transaction.date !== "string" || !isValidISODate(transaction.date)) return null;
  const createdAt =
    typeof transaction.createdAt === "string" && transaction.createdAt.length > 0
      ? transaction.createdAt
      : new Date(`${transaction.date}T12:00:00`).toISOString();
  return {
    id: transaction.id,
    type: transaction.type,
    amount: Math.round(transaction.amount * 100) / 100,
    categoryId: transaction.categoryId,
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
  const record = input as { categories?: unknown; transactions?: unknown };
  if (!Array.isArray(record.categories) || !Array.isArray(record.transactions)) return null;

  const categories = uniqueById(
    record.categories
      .map(cleanCategory)
      .filter((category): category is Category => category !== null),
  );
  const transactions = uniqueById(
    record.transactions
      .map(cleanTransaction)
      .filter((transaction): transaction is Transaction => transaction !== null),
  );

  if (categories.length === 0 && record.categories.length > 0) return null;

  return {
    categories: categories.length > 0 ? categories : defaultCategories.map((category) => ({ ...category })),
    transactions,
  };
}

export function toBackup(data: AppData, now = new Date()): BackupFile {
  return {
    version: 1,
    exportedAt: now.toISOString(),
    categories: data.categories,
    transactions: data.transactions,
  };
}
