import { defaultAccounts, defaultCategories } from "./defaults";
import { isValidISODate } from "./dates";
import type {
  Account,
  AppData,
  BackupFile,
  Category,
  FixedExpense,
  Investment,
  InvestmentKind,
  Transaction,
  TxType,
} from "./types";

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
  const fixedExpenseId =
    typeof transaction.fixedExpenseId === "string" && transaction.fixedExpenseId.trim().length > 0
      ? transaction.fixedExpenseId.trim()
      : undefined;
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
    fixedExpenseId: transaction.type === "expense" ? fixedExpenseId : undefined,
  };
}

function cleanFixedExpense(value: unknown): FixedExpense | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<FixedExpense>;
  if (typeof item.id !== "string" || item.id.trim().length === 0) return null;
  if (typeof item.name !== "string") return null;
  const name = item.name.trim();
  if (!name || name.length > MAX_NAME) return null;
  const amount = cleanMoney(item.amount, false);
  if (amount === null || amount <= 0) return null;
  if (typeof item.categoryId !== "string" || item.categoryId.length === 0) return null;
  if (typeof item.accountId !== "string" || item.accountId.length === 0) return null;
  const day =
    typeof item.dayOfMonth === "number" && Number.isFinite(item.dayOfMonth)
      ? Math.floor(item.dayOfMonth)
      : NaN;
  if (!Number.isFinite(day) || day < 1 || day > 28) return null;
  const note = typeof item.note === "string" ? item.note.trim() : "";
  if (note.length > MAX_NOTE) return null;
  return {
    id: item.id,
    name,
    amount,
    categoryId: item.categoryId,
    accountId: item.accountId,
    dayOfMonth: day,
    note,
    active: item.active !== false,
  };
}

const KINDS: InvestmentKind[] = ["plazo", "acciones", "cedear", "fondo", "cripto", "otro"];

function isKind(value: unknown): value is InvestmentKind {
  return typeof value === "string" && KINDS.includes(value as InvestmentKind);
}

function cleanInvestment(value: unknown): Investment | null {
  if (!value || typeof value !== "object") return null;
  const investment = value as Partial<Investment>;
  if (typeof investment.id !== "string" || investment.id.trim().length === 0) return null;
  if (typeof investment.name !== "string") return null;
  const name = investment.name.trim();
  if (!name || name.length > MAX_NAME) return null;
  if (!isKind(investment.kind)) return null;
  const invested = cleanMoney(investment.invested, false);
  const currentValue = cleanMoney(investment.currentValue, false);
  if (invested === null || currentValue === null || invested <= 0) return null;
  const note = typeof investment.note === "string" ? investment.note.trim() : "";
  if (note.length > MAX_NOTE) return null;
  const symbol = cleanSymbol(investment.symbol);
  const units = cleanUnits(investment.units);
  if (units === null) return null;
  return { id: investment.id, name, kind: investment.kind, invested, currentValue, note, symbol, units };
}

function cleanSymbol(value: unknown): string {
  if (typeof value !== "string") return "";
  const symbol = value.trim().toUpperCase();
  if (!symbol) return "";
  if (symbol.length > 15 || !/^[A-Z0-9][A-Z0-9.-]*$/.test(symbol)) return "";
  return symbol;
}

function cleanUnits(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000_000) return null;
  return Math.round(value * 1e8) / 1e8;
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
  const record = input as {
    categories?: unknown;
    accounts?: unknown;
    transactions?: unknown;
    investments?: unknown;
    fixedExpenses?: unknown;
  };
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

  const investments = uniqueById(
    (Array.isArray(record.investments) ? record.investments : [])
      .map(cleanInvestment)
      .filter((investment): investment is Investment => investment !== null),
  );

  const knownCategories = new Set(safeCategories.map((category) => category.id));
  const fallbackCategory =
    safeCategories.find((category) => category.type === "expense")?.id ?? safeCategories[0]?.id ?? "";

  const fixedExpenses = uniqueById(
    (Array.isArray(record.fixedExpenses) ? record.fixedExpenses : [])
      .map(cleanFixedExpense)
      .filter((item): item is FixedExpense => item !== null),
  ).map((item) => ({
    ...item,
    accountId: knownAccounts.has(item.accountId) ? item.accountId : fallbackAccount,
    categoryId: knownCategories.has(item.categoryId) ? item.categoryId : fallbackCategory,
  }));

  return {
    categories: safeCategories,
    accounts: safeAccounts,
    transactions,
    investments,
    fixedExpenses,
  };
}

export function toBackup(data: AppData, now = new Date()): BackupFile {
  return {
    version: 2,
    exportedAt: now.toISOString(),
    categories: data.categories,
    accounts: data.accounts,
    transactions: data.transactions,
    investments: data.investments,
    fixedExpenses: data.fixedExpenses ?? [],
  };
}
