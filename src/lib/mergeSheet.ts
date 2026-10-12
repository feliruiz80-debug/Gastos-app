import { ACCOUNT_COLORS, CATEGORY_COLORS } from "./defaults";
import type { SheetPayload } from "./sheets";
import type { Account, AppData, Category, Transaction, TxType } from "./types";

function nameKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function slug(value: string): string {
  const base = nameKey(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return base || "item";
}

function nextColor(used: string[], palette: readonly string[]): string {
  return palette.find((color) => !used.includes(color)) ?? palette[used.length % palette.length];
}

function flowType(type: string): TxType {
  const value = type.trim().toLowerCase();
  if (value.startsWith("ing")) return "income";
  if (value.startsWith("trans")) return "transfer";
  return "expense";
}

function noteOf(description: string, notes: string): string {
  const main = description.trim();
  const extra = notes.trim();
  if (!main) return extra.slice(0, 140);
  if (!extra || extra.toLowerCase() === main.toLowerCase()) return main.slice(0, 140);
  const combined = `${main} — ${extra}`;
  return combined.slice(0, 140);
}

export function mergeSheet(data: AppData, payload: SheetPayload, now = new Date()): AppData {
  const categories = data.categories.map((category) => ({ ...category }));
  const accounts = data.accounts.map((account) => ({ ...account }));

  function ensureCategory(name: string, type: Exclude<TxType, "transfer">, monthlyBudget = 0): Category {
    const key = nameKey(name);
    const existing = categories.find((category) => category.type === type && nameKey(category.name) === key);
    if (existing) {
      if (type === "expense" && monthlyBudget > 0) existing.monthlyBudget = monthlyBudget;
      return existing;
    }
    const created: Category = {
      id: `sheet-cat-${type}-${slug(name)}`,
      name: name.trim(),
      type,
      color: nextColor(
        categories.map((category) => category.color),
        CATEGORY_COLORS,
      ),
      monthlyBudget: type === "expense" ? monthlyBudget : 0,
    };
    categories.push(created);
    return created;
  }

  function ensureAccount(name: string, openingBalance = 0): Account {
    const key = nameKey(name);
    const existing = accounts.find((account) => nameKey(account.name) === key);
    if (existing) {
      if (openingBalance !== 0) existing.openingBalance = openingBalance;
      return existing;
    }
    const created: Account = {
      id: `sheet-acc-${slug(name)}`,
      name: name.trim(),
      color: nextColor(
        accounts.map((account) => account.color),
        ACCOUNT_COLORS,
      ),
      openingBalance,
    };
    accounts.push(created);
    return created;
  }

  for (const category of payload.config.expenseCategories) {
    ensureCategory(category.name, "expense", category.monthlyBudget);
  }
  for (const name of payload.config.incomeCategories) ensureCategory(name, "income");
  for (const account of payload.config.accounts) ensureAccount(account.name, account.openingBalance);

  const fallbackAccount = accounts[0];
  const transactions = data.transactions.map((transaction) => ({ ...transaction }));
  const byId = new Map(transactions.map((transaction) => [transaction.id, transaction]));

  payload.movimientos.forEach((movement, index) => {
    const type = flowType(movement.type);
    const account = movement.account ? ensureAccount(movement.account) : fallbackAccount;
    if (!account) return;
    const category = type === "transfer" ? null : ensureCategory(movement.category, type);
    const id = movement.id || `sheet-${movement.date}-${slug(movement.category)}-${index}`;
    const next: Transaction = {
      id,
      type,
      amount: movement.amount,
      categoryId: category?.id ?? "",
      accountId: account.id,
      note: noteOf(movement.description, movement.notes),
      date: movement.date,
      createdAt: byId.get(id)?.createdAt ?? now.toISOString(),
    };
    const current = byId.get(id);
    if (current) {
      Object.assign(current, next);
      return;
    }
    transactions.push(next);
    byId.set(id, next);
  });

  return { categories, accounts, transactions };
}
