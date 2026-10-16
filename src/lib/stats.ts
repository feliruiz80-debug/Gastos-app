import type { Account, Category, FixedExpense, Transaction, TxType } from "./types";

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

export type AccountFlow = {
  accountId: string;
  inflow: number;
  outflow: number;
  transactions: Transaction[];
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Plata que entró y salió de una cuenta en el período (incluye pases). */
export function accountFlow(transactions: Transaction[], accountId: string): AccountFlow {
  let inflow = 0;
  let outflow = 0;
  const related: Transaction[] = [];

  for (const transaction of transactions) {
    if (transaction.type === "transfer") {
      if (transaction.toAccountId === accountId) {
        inflow += transaction.amount;
        related.push(transaction);
      } else if (transaction.accountId === accountId) {
        outflow += transaction.amount;
        related.push(transaction);
      }
      continue;
    }
    if (transaction.accountId !== accountId) continue;
    related.push(transaction);
    if (transaction.type === "income") inflow += transaction.amount;
    else outflow += transaction.amount;
  }

  return {
    accountId,
    inflow: roundMoney(inflow),
    outflow: roundMoney(outflow),
    transactions: related,
  };
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

export function activeFixedTotal(fixedExpenses: FixedExpense[]): number {
  return roundMoney(
    fixedExpenses.reduce((total, item) => (item.active ? total + item.amount : total), 0),
  );
}

export function fixedPaidIds(transactions: Transaction[], month: string): Set<string> {
  const paid = new Set<string>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense" || !transaction.fixedExpenseId) continue;
    if (!transaction.date.startsWith(month)) continue;
    paid.add(transaction.fixedExpenseId);
  }
  return paid;
}

export function fixedPendingTotal(fixedExpenses: FixedExpense[], paidIds: Set<string>): number {
  return roundMoney(
    fixedExpenses.reduce((total, item) => {
      if (!item.active || paidIds.has(item.id)) return total;
      return total + item.amount;
    }, 0),
  );
}
