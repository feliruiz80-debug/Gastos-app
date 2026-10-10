export type TxType = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  type: TxType;
  color: string;
};

export type Transaction = {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  note: string;
  date: string;
  createdAt: string;
};

export type AppData = {
  categories: Category[];
  transactions: Transaction[];
};

export type BackupFile = AppData & {
  version: 1;
  exportedAt: string;
};
