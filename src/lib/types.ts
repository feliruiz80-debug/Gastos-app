export type TxType = "income" | "expense" | "transfer";

export type Category = {
  id: string;
  name: string;
  type: Exclude<TxType, "transfer">;
  color: string;
  monthlyBudget: number;
};

export type Account = {
  id: string;
  name: string;
  color: string;
  openingBalance: number;
};

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  note: string;
  date: string;
  createdAt: string;
};

export type InvestmentKind = "plazo" | "acciones" | "fondo" | "cripto" | "otro";

export type Investment = {
  id: string;
  name: string;
  kind: InvestmentKind;
  invested: number;
  currentValue: number;
  note: string;
  symbol: string;
  units: number;
};

export type AppData = {
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  investments: Investment[];
};

export type BackupFile = AppData & {
  version: 2;
  exportedAt: string;
};
