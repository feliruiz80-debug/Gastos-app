import type { Account, Category, Transaction, TxType } from "./types";

export function sumAmount(transactions: Transaction[], type?: Exclude<TxType, "transfer">): number {
  return transactions.reduce((total, transaction) => {
    if (transaction.type === "transfer") return total;
    if (type && transaction.type !== type) return total;
    return total + transaction.amount;
  }, 0);
}

export function balanceOf(transactions: Transaction[]): number {
  return sumAmount(transactions, "income") - sumAmount(transactions, "expense");
}

export function inMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((transaction) => transaction.date.startsWith(month));
}

export type CategoryTotal = {
  category: Category;
  amount: number;
  budget: number | null;
};

const missingCategory = (id: string, type: Exclude<TxType, "transfer">): Category => ({
  id,
  name: "Sin categoría",
  type,
  color: "#a8a29e",
  monthlyBudget: 0,
});

export function categoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: Exclude<TxType, "transfer">,
  month: string | "all",
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
  }

  const seen = new Set<string>();
  const rows: CategoryTotal[] = [];
  for (const [id, amount] of totals) {
    seen.add(id);
    const category = categories.find((item) => item.id === id) ?? missingCategory(id, type);
    rows.push({
      category,
      amount,
      budget: month !== "all" && category.monthlyBudget > 0 ? category.monthlyBudget : null,
    });
  }

  if (type === "expense" && month !== "all") {
    for (const category of categories) {
      if (category.type !== "expense" || category.monthlyBudget <= 0 || seen.has(category.id)) continue;
      rows.push({ category, amount: 0, budget: category.monthlyBudget });
    }
  }

  return rows.sort(
    (a, b) => b.amount - a.amount || a.category.name.localeCompare(b.category.name, "es"),
  );
}

export function monthSeries(
  transactions: Transaction[],
  months: string[],
): { month: string; income: number; expense: number }[] {
  return months.map((month) => {
    const items = inMonth(transactions, month);
    return {
      month,
      income: sumAmount(items, "income"),
      expense: sumAmount(items, "expense"),
    };
  });
}

export type AccountBalance = {
  account: Account;
  balance: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function accountBalances(accounts: Account[], transactions: Transaction[]): AccountBalance[] {
  const totals = new Map(accounts.map((account) => [account.id, account.openingBalance]));

  for (const transaction of transactions) {
    const current = totals.get(transaction.accountId) ?? 0;
    if (transaction.type === "income") {
      totals.set(transaction.accountId, current + transaction.amount);
      continue;
    }
    totals.set(transaction.accountId, current - transaction.amount);
    if (transaction.type === "transfer" && transaction.toAccountId) {
      totals.set(
        transaction.toAccountId,
        (totals.get(transaction.toAccountId) ?? 0) + transaction.amount,
      );
    }
  }

  return accounts.map((account) => ({
    account,
    balance: roundMoney(totals.get(account.id) ?? account.openingBalance),
  }));
}

export function availableBalance(accounts: Account[], transactions: Transaction[]): number {
  return roundMoney(
    accountBalances(accounts, transactions).reduce((total, item) => total + item.balance, 0),
  );
}
