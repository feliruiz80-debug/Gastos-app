import type { Movement, SheetConfig } from "../src/types";

export type GvizCell = { v?: unknown; f?: string } | null;
export type GvizRow = { c?: GvizCell[] | null } | null;
export type GvizTable = { rows?: GvizRow[] | null };

function cellValue(row: GvizRow, index: number): unknown {
  const cell = row?.c?.[index];
  if (!cell || cell.v === undefined || cell.v === null || cell.v === "") return null;
  return cell.v;
}

function asText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function parseGvizDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^Date\((\d+),(\d+),(\d+)\)$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) + 1;
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isIncome(type: string): boolean {
  return type.trim().toLowerCase().startsWith("ing");
}

export function parseMovimientos(table: GvizTable): Movement[] {
  const movements: Movement[] = [];

  for (const row of table.rows ?? []) {
    const date = parseGvizDate(cellValue(row, 1));
    const amountValue = cellValue(row, 5);
    if (!date || typeof amountValue !== "number" || !Number.isFinite(amountValue)) continue;

    const type = asText(cellValue(row, 2)) || "Gasto";
    movements.push({
      id: asText(cellValue(row, 0)),
      date,
      type,
      category: asText(cellValue(row, 3)) || "Sin categoría",
      description: asText(cellValue(row, 4)),
      amount: Math.abs(amountValue),
      account: asText(cellValue(row, 6)) || "Sin cuenta",
      notes: asText(cellValue(row, 7)),
    });
  }

  return movements;
}

export function parseConfig(table: GvizTable): SheetConfig {
  const types: string[] = [];
  const expenseCategories: SheetConfig["expenseCategories"] = [];
  const incomeCategories: string[] = [];
  const accounts: SheetConfig["accounts"] = [];

  for (const row of table.rows ?? []) {
    const type = asText(cellValue(row, 0));
    if (type && type.length <= 40 && !type.includes(":")) types.push(type);

    const expenseName = asText(cellValue(row, 2));
    if (expenseName) {
      expenseCategories.push({
        name: expenseName,
        monthlyBudget: Math.max(0, asNumber(cellValue(row, 3))),
      });
    }

    const incomeName = asText(cellValue(row, 5));
    if (incomeName) incomeCategories.push(incomeName);

    const accountName = asText(cellValue(row, 7));
    if (accountName) {
      accounts.push({
        name: accountName,
        openingBalance: asNumber(cellValue(row, 8)),
      });
    }
  }

  return {
    types: types.length > 0 ? types : ["Ingreso", "Gasto"],
    expenseCategories,
    incomeCategories,
    accounts,
  };
}
