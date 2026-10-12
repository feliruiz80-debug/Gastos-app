import { SHEET_GIDS, SHEET_ID } from "./sheetConfig";

export type GvizCell = { v?: unknown; f?: string } | null;
export type GvizRow = { c?: GvizCell[] | null } | null;
export type GvizTable = { rows?: GvizRow[] | null };

export type SheetMovement = {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  account: string;
  notes: string;
};

export type SheetConfig = {
  expenseCategories: { name: string; monthlyBudget: number }[];
  incomeCategories: string[];
  accounts: { name: string; openingBalance: number }[];
};

export type SheetPayload = {
  fetchedAt: string;
  movimientos: SheetMovement[];
  config: SheetConfig;
};

const GVIZ_PREFIX = "/*O_o*/\ngoogle.visualization.Query.setResponse(";

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

export function parseMovimientos(table: GvizTable): SheetMovement[] {
  const movements: SheetMovement[] = [];

  for (const row of table.rows ?? []) {
    const date = parseGvizDate(cellValue(row, 1));
    const amountValue = cellValue(row, 5);
    if (!date || typeof amountValue !== "number" || !Number.isFinite(amountValue) || amountValue === 0) {
      continue;
    }

    movements.push({
      id: asText(cellValue(row, 0)),
      date,
      type: asText(cellValue(row, 2)) || "Gasto",
      category: asText(cellValue(row, 3)) || "Sin categoría",
      description: asText(cellValue(row, 4)),
      amount: Math.abs(amountValue),
      account: asText(cellValue(row, 6)),
      notes: asText(cellValue(row, 7)),
    });
  }

  return movements;
}

export function parseConfig(table: GvizTable): SheetConfig {
  const expenseCategories: SheetConfig["expenseCategories"] = [];
  const incomeCategories: string[] = [];
  const accounts: SheetConfig["accounts"] = [];

  for (const row of table.rows ?? []) {
    const expenseName = asText(cellValue(row, 2));
    if (expenseName && expenseName.length <= 60) {
      expenseCategories.push({
        name: expenseName,
        monthlyBudget: Math.max(0, asNumber(cellValue(row, 3))),
      });
    }

    const incomeName = asText(cellValue(row, 5));
    if (incomeName && incomeName.length <= 60) incomeCategories.push(incomeName);

    const accountName = asText(cellValue(row, 7));
    if (accountName && accountName.length <= 60) {
      accounts.push({
        name: accountName,
        openingBalance: asNumber(cellValue(row, 8)),
      });
    }
  }

  return { expenseCategories, incomeCategories, accounts };
}

async function fetchTable(gid: string): Promise<GvizTable> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Google Sheets respondió ${response.status}.`);

  const raw = await response.text();
  const start = raw.indexOf(GVIZ_PREFIX);
  const jsonStart = start === -1 ? raw.indexOf("{") : start + GVIZ_PREFIX.length;
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("La respuesta de la hoja no tiene el formato esperado.");
  }

  const payload = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
    status?: string;
    table?: GvizTable;
  };
  if (payload.status && payload.status !== "ok") {
    throw new Error("Google Sheets no pudo leer la pestaña.");
  }
  return payload.table ?? { rows: [] };
}

export async function loadPublicSheet(): Promise<SheetPayload> {
  const [movimientos, config] = await Promise.all([
    fetchTable(SHEET_GIDS.movimientos),
    fetchTable(SHEET_GIDS.config),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    movimientos: parseMovimientos(movimientos),
    config: parseConfig(config),
  };
}
