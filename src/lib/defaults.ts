import type { Account, Category } from "./types";

export const CATEGORY_COLORS = [
  "#ff5a1f",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#a3e635",
  "#06b6d4",
  "#fb7185",
] as const;

export const ACCOUNT_COLORS = [
  "#22c55e",
  "#0ea5e9",
  "#38bdf8",
  "#f97316",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#f43f5e",
] as const;

export const defaultCategories: Category[] = [
  { id: "cat-sueldo", name: "Sueldo", type: "income", color: "#22c55e", monthlyBudget: 0 },
  { id: "cat-ventas", name: "Ventas", type: "income", color: "#14b8a6", monthlyBudget: 0 },
  { id: "cat-changas", name: "Changas / Extras", type: "income", color: "#0ea5e9", monthlyBudget: 0 },
  { id: "cat-reintegros", name: "Reintegros", type: "income", color: "#3b82f6", monthlyBudget: 0 },
  { id: "cat-otros-ingresos", name: "Otros ingresos", type: "income", color: "#a3e635", monthlyBudget: 0 },
  { id: "cat-super", name: "Supermercado", type: "expense", color: "#ff5a1f", monthlyBudget: 0 },
  { id: "cat-vivienda", name: "Vivienda / Alquiler", type: "expense", color: "#a855f7", monthlyBudget: 0 },
  {
    id: "cat-servicios",
    name: "Servicios (luz, gas, agua, internet)",
    type: "expense",
    color: "#06b6d4",
    monthlyBudget: 0,
  },
  { id: "cat-transporte", name: "Transporte / Nafta", type: "expense", color: "#f59e0b", monthlyBudget: 0 },
  { id: "cat-salud", name: "Salud", type: "expense", color: "#f43f5e", monthlyBudget: 0 },
  { id: "cat-educacion", name: "Educación", type: "expense", color: "#8b5cf6", monthlyBudget: 0 },
  { id: "cat-ocio", name: "Salidas y ocio", type: "expense", color: "#fb7185", monthlyBudget: 0 },
  { id: "cat-ropa", name: "Ropa", type: "expense", color: "#ec4899", monthlyBudget: 0 },
  { id: "cat-impuestos", name: "Impuestos", type: "expense", color: "#64748b", monthlyBudget: 0 },
  { id: "cat-suscripciones", name: "Suscripciones", type: "expense", color: "#14b8a6", monthlyBudget: 0 },
  { id: "cat-deudas", name: "Deudas / Tarjeta", type: "expense", color: "#3b82f6", monthlyBudget: 0 },
  { id: "cat-otros-gastos", name: "Otros gastos", type: "expense", color: "#94a3b8", monthlyBudget: 0 },
];

export const defaultAccounts: Account[] = [
  { id: "acc-efectivo", name: "Efectivo", color: "#22c55e", openingBalance: 0 },
  { id: "acc-banco", name: "Banco", color: "#0ea5e9", openingBalance: 0 },
  { id: "acc-mp", name: "Mercado Pago", color: "#38bdf8", openingBalance: 0 },
  { id: "acc-tarjeta", name: "Tarjeta de crédito", color: "#f97316", openingBalance: 0 },
  { id: "acc-ahorro", name: "Cuenta ahorro", color: "#3b82f6", openingBalance: 0 },
];

/** Si el color sigue siendo el viejo por defecto, lo sube a la paleta prendida. */
const CATEGORY_COLOR_UPGRADES: Record<string, { from: string; to: string }> = {
  "cat-sueldo": { from: "#1b7f4e", to: "#22c55e" },
  "cat-ventas": { from: "#0f766e", to: "#14b8a6" },
  "cat-changas": { from: "#0369a1", to: "#0ea5e9" },
  "cat-reintegros": { from: "#1d4ed8", to: "#3b82f6" },
  "cat-otros-ingresos": { from: "#57534e", to: "#a3e635" },
  "cat-super": { from: "#c4491d", to: "#ff5a1f" },
  "cat-vivienda": { from: "#7c3aed", to: "#a855f7" },
  "cat-servicios": { from: "#0369a1", to: "#06b6d4" },
  "cat-transporte": { from: "#b45309", to: "#f59e0b" },
  "cat-salud": { from: "#be123c", to: "#f43f5e" },
  "cat-educacion": { from: "#4338ca", to: "#8b5cf6" },
  "cat-ocio": { from: "#a16207", to: "#fb7185" },
  "cat-ropa": { from: "#9f1239", to: "#ec4899" },
  "cat-impuestos": { from: "#57534e", to: "#64748b" },
  "cat-suscripciones": { from: "#0f766e", to: "#14b8a6" },
  "cat-deudas": { from: "#1d4ed8", to: "#3b82f6" },
  "cat-otros-gastos": { from: "#78716c", to: "#94a3b8" },
};

const ACCOUNT_COLOR_UPGRADES: Record<string, { from: string; to: string }> = {
  "acc-efectivo": { from: "#1b7f4e", to: "#22c55e" },
  "acc-banco": { from: "#0369a1", to: "#0ea5e9" },
  "acc-mp": { from: "#0284c7", to: "#38bdf8" },
  "acc-tarjeta": { from: "#9a3412", to: "#f97316" },
  "acc-ahorro": { from: "#1d4ed8", to: "#3b82f6" },
};

function upgradeColor(id: string, color: string, map: Record<string, { from: string; to: string }>): string {
  const rule = map[id];
  if (!rule) return color;
  return color.toLowerCase() === rule.from.toLowerCase() ? rule.to : color;
}

export function upgradeDefaultColors<T extends { id: string; color: string }>(
  items: T[],
  kind: "category" | "account",
): T[] {
  const map = kind === "category" ? CATEGORY_COLOR_UPGRADES : ACCOUNT_COLOR_UPGRADES;
  return items.map((item) => {
    const next = upgradeColor(item.id, item.color, map);
    return next === item.color ? item : { ...item, color: next };
  });
}

export function emptyData() {
  return {
    categories: defaultCategories.map((category) => ({ ...category })),
    accounts: defaultAccounts.map((account) => ({ ...account })),
    transactions: [],
    investments: [],
    fixedExpenses: [],
  };
}
