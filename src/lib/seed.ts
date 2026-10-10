import { defaultCategories } from "./defaults";
import { toISODate } from "./dates";
import type { AppData, Transaction } from "./types";

type Template = {
  categoryId: string;
  type: "income" | "expense";
  note: string;
  amount: number;
  day: number;
};

const templates: Template[] = [
  { categoryId: "cat-salario", type: "income", note: "Sueldo", amount: 1500000, day: 1 },
  { categoryId: "cat-freelance", type: "income", note: "Proyecto web", amount: 280000, day: 18 },
  { categoryId: "cat-vivienda", type: "expense", note: "Alquiler", amount: 450000, day: 3 },
  { categoryId: "cat-comida", type: "expense", note: "Supermercado", amount: 128400, day: 6 },
  { categoryId: "cat-comida", type: "expense", note: "Verdulería", amount: 18600, day: 11 },
  { categoryId: "cat-transporte", type: "expense", note: "Carga SUBE", amount: 15000, day: 4 },
  { categoryId: "cat-servicios", type: "expense", note: "Luz y gas", amount: 62400, day: 8 },
  { categoryId: "cat-salud", type: "expense", note: "Farmacia", amount: 14350, day: 14 },
  { categoryId: "cat-entretenimiento", type: "expense", note: "Streaming", amount: 12900, day: 9 },
  { categoryId: "cat-compras", type: "expense", note: "Ropa", amount: 45900, day: 21 },
  { categoryId: "cat-educacion", type: "expense", note: "Curso online", amount: 22000, day: 16 },
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
      if (template.categoryId === "cat-freelance" && offset % 2 === 1) continue;
      if (template.categoryId === "cat-compras" && offset % 2 === 0) continue;
      const date = dateInMonth(monthDate, template.day, today);
      if (!date) continue;
      const amount = Math.round(template.amount * variation);
      transactions.push({
        id: `seed-${date}-${template.categoryId}-${template.note}`,
        type: template.type,
        amount,
        categoryId: template.categoryId,
        note: template.note,
        date,
        createdAt: new Date(`${date}T12:00:00`).toISOString(),
      });
    }
  }

  return transactions.sort((a, b) => a.date.localeCompare(b.date));
}

export function applySeed(data: AppData, now = new Date()): AppData {
  const categories = [...data.categories];
  for (const category of defaultCategories) {
    if (!categories.some((item) => item.id === category.id)) {
      categories.push({ ...category });
    }
  }
  return { categories, transactions: buildSeed(now) };
}
