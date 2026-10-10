import type { Category, Transaction, TxType } from "./types";

export function sumAmount(transactions: Transaction[], type?: TxType): number {
  return transactions.reduce((total, transaction) => {
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
};

const missingCategory = (id: string, type: TxType): Category => ({
  id,
  name: "Sin categoría",
  type,
  color: "#a8a29e",
});

export function totalsByCategory(
  transactions: Transaction[],
  categories: Category[],
  type: TxType,
): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    totals.set(
      transaction.categoryId,
      (totals.get(transaction.categoryId) ?? 0) + transaction.amount,
    );
  }

  return [...totals.entries()]
    .map(([id, amount]) => ({
      category:
        categories.find((category) => category.id === id) ?? missingCategory(id, type),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
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
