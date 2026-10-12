import { defaultAccounts, defaultCategories } from "./defaults";
import { toISODate } from "./dates";
import type { AppData, Transaction, TxType } from "./types";

type Template = {
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  type: TxType;
  note: string;
  amount: number;
  day: number;
  everyOther?: boolean;
  skipEven?: boolean;
};

const templates: Template[] = [
  { categoryId: "cat-sueldo", accountId: "acc-banco", type: "income", note: "Sueldo", amount: 1_500_000, day: 1 },
  {
    categoryId: "cat-changas",
    accountId: "acc-mp",
    type: "income",
    note: "Changa",
    amount: 80_000,
    day: 12,
    everyOther: true,
  },
  { categoryId: "cat-vivienda", accountId: "acc-banco", type: "expense", note: "Alquiler", amount: 450_000, day: 3 },
  { categoryId: "cat-super", accountId: "acc-mp", type: "expense", note: "Supermercado", amount: 145_000, day: 6 },
  { categoryId: "cat-super", accountId: "acc-efectivo", type: "expense", note: "Verdulería", amount: 18_000, day: 11 },
  { categoryId: "cat-transporte", accountId: "acc-efectivo", type: "expense", note: "Nafta", amount: 35_000, day: 4 },
  {
    categoryId: "cat-servicios",
    accountId: "acc-banco",
    type: "expense",
    note: "Luz, gas e internet",
    amount: 62_000,
    day: 8,
  },
  { categoryId: "cat-salud", accountId: "acc-mp", type: "expense", note: "Farmacia", amount: 14_000, day: 14 },
  {
    categoryId: "cat-suscripciones",
    accountId: "acc-tarjeta",
    type: "expense",
    note: "Streaming",
    amount: 12_900,
    day: 9,
  },
  {
    categoryId: "cat-ocio",
    accountId: "acc-mp",
    type: "expense",
    note: "Salida",
    amount: 28_000,
    day: 20,
    everyOther: true,
  },
  {
    categoryId: "cat-ropa",
    accountId: "acc-tarjeta",
    type: "expense",
    note: "Ropa",
    amount: 45_000,
    day: 21,
    skipEven: true,
  },
  {
    categoryId: "",
    accountId: "acc-banco",
    toAccountId: "acc-mp",
    type: "transfer",
    note: "Paso a Mercado Pago",
    amount: 200_000,
    day: 2,
  },
  {
    categoryId: "",
    accountId: "acc-banco",
    toAccountId: "acc-tarjeta",
    type: "transfer",
    note: "Pago de tarjeta",
    amount: 60_000,
    day: 15,
  },
];

function dateInMonth(monthDate: Date, day: number, today: Date): string | null {
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), safeDay);
  if (date > today) return null;
  return toISODate(date);
}

export function buildSeed(now = new Date()): Transaction[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const transactions: Transaction[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const variation = 1 + (5 - offset) * 0.015;
    for (const template of templates) {
      if (template.everyOther && offset % 2 === 1) continue;
      if (template.skipEven && offset % 2 === 0) continue;
      const date = dateInMonth(monthDate, template.day, today);
      if (!date) continue;
      const amount = Math.round(template.amount * variation);
      transactions.push({
        id: `seed-${date}-${template.type}-${template.note}`,
        type: template.type,
        amount,
        categoryId: template.categoryId,
        accountId: template.accountId,
        toAccountId: template.toAccountId,
        note: template.note,
        date,
        createdAt: new Date(`${date}T12:00:00`).toISOString(),
      });
    }
  }

  return transactions.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function applySeed(data: AppData, now = new Date()): AppData {
  const categories = [...data.categories];
  for (const category of defaultCategories) {
    if (!categories.some((item) => item.id === category.id)) categories.push({ ...category });
  }
  const accounts = [...data.accounts];
  for (const account of defaultAccounts) {
    if (!accounts.some((item) => item.id === account.id)) accounts.push({ ...account });
  }
  return { categories, accounts, transactions: buildSeed(now), investments: data.investments ?? [] };
}
