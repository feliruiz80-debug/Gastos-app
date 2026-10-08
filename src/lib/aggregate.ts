import { isIncome } from "../../server/parseSheet";
import type {
  AccountBalance,
  AccountConfig,
  CategoryTotal,
  ExpenseCategory,
  Movement,
  Period,
  Totals,
} from "../types";

export function movementYear(movement: Movement): number {
  return Number(movement.date.slice(0, 4));
}

export function movementMonth(movement: Movement): number {
  return Number(movement.date.slice(5, 7));
}

export function inPeriod(movement: Movement, period: Period): boolean {
  if (period.year !== "all" && movementYear(movement) !== period.year) return false;
  if (period.month !== "all" && movementMonth(movement) !== period.month) return false;
  return true;
}

export function filterPeriod(movements: Movement[], period: Period): Movement[] {
  return movements.filter((movement) => inPeriod(movement, period));
}

export function totals(movements: Movement[]): Totals {
  let income = 0;
  let expense = 0;
  for (const movement of movements) {
    if (isIncome(movement.type)) income += movement.amount;
    else expense += movement.amount;
  }
  return { income, expense, result: income - expense };
}

export function yearsIn(movements: Movement[]): number[] {
  const years = new Set<number>();
  for (const movement of movements) {
    const year = movementYear(movement);
    if (Number.isFinite(year)) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}

export function monthlySeries(movements: Movement[], year: number): Totals[] {
  const series = Array.from({ length: 12 }, () => ({ income: 0, expense: 0, result: 0 }));
  for (const movement of movements) {
    if (movementYear(movement) !== year) continue;
    const bucket = series[movementMonth(movement) - 1];
    if (!bucket) continue;
    if (isIncome(movement.type)) bucket.income += movement.amount;
    else bucket.expense += movement.amount;
  }
  for (const bucket of series) bucket.result = bucket.income - bucket.expense;
  return series;
}

export function categoryTotals(
  movements: Movement[],
  kind: "income" | "expense",
  catalog: ExpenseCategory[] | string[],
): CategoryTotal[] {
  const amounts = new Map<string, number>();
  for (const movement of movements) {
    const matches = kind === "income" ? isIncome(movement.type) : !isIncome(movement.type);
    if (!matches) continue;
    amounts.set(movement.category, (amounts.get(movement.category) ?? 0) + movement.amount);
  }

  const seen = new Set<string>();
  const rows: CategoryTotal[] = [];

  for (const entry of catalog) {
    const name = typeof entry === "string" ? entry : entry.name;
    const budget = typeof entry === "string" ? null : entry.monthlyBudget > 0 ? entry.monthlyBudget : null;
    seen.add(name);
    rows.push({ name, amount: amounts.get(name) ?? 0, budget });
  }

  for (const [name, amount] of amounts) {
    if (seen.has(name)) continue;
    rows.push({ name, amount, budget: null });
  }

  return rows.sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, "es"));
}

export function budgetForPeriod(monthlyBudget: number | null, period: Period): number | null {
  if (monthlyBudget === null || monthlyBudget <= 0 || period.year === "all") return null;
  return period.month === "all" ? monthlyBudget * 12 : monthlyBudget;
}

export function accountBalances(movements: Movement[], accounts: AccountConfig[]): AccountBalance[] {
  const byName = new Map<string, AccountBalance>();

  for (const account of accounts) {
    byName.set(account.name, {
      name: account.name,
      openingBalance: account.openingBalance,
      income: 0,
      expense: 0,
      balance: account.openingBalance,
    });
  }

  for (const movement of movements) {
    const current = byName.get(movement.account) ?? {
      name: movement.account,
      openingBalance: 0,
      income: 0,
      expense: 0,
      balance: 0,
    };
    if (isIncome(movement.type)) current.income += movement.amount;
    else current.expense += movement.amount;
    current.balance = current.openingBalance + current.income - current.expense;
    byName.set(movement.account, current);
  }

  const ordered = accounts.map((account) => byName.get(account.name)!);
  for (const [name, balance] of byName) {
    if (!accounts.some((account) => account.name === name)) ordered.push(balance);
  }
  return ordered;
}

export function sumBalances(accounts: AccountBalance[]): AccountBalance {
  return accounts.reduce(
    (total, account) => ({
      name: "Total",
      openingBalance: total.openingBalance + account.openingBalance,
      income: total.income + account.income,
      expense: total.expense + account.expense,
      balance: total.balance + account.balance,
    }),
    { name: "Total", openingBalance: 0, income: 0, expense: 0, balance: 0 },
  );
}
