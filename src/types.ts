export type Movement = {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  account: string;
  notes: string;
};

export type ExpenseCategory = {
  name: string;
  monthlyBudget: number;
};

export type AccountConfig = {
  name: string;
  openingBalance: number;
};

export type SheetConfig = {
  types: string[];
  expenseCategories: ExpenseCategory[];
  incomeCategories: string[];
  accounts: AccountConfig[];
};

export type SheetsPayload = {
  fetchedAt: string;
  movimientos: Movement[];
  config: SheetConfig;
};

export type Period = {
  year: number | "all";
  month: number | "all";
};

export type Totals = {
  income: number;
  expense: number;
  result: number;
};

export type AccountBalance = {
  name: string;
  openingBalance: number;
  income: number;
  expense: number;
  balance: number;
};

export type CategoryTotal = {
  name: string;
  amount: number;
  budget: number | null;
};
