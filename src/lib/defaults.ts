import type { Account, Category } from "./types";

/** Paleta sobria (sin flúor) para categorías y cuentas. */
export const CATEGORY_COLORS = [
  "#c4491d",
  "#b45309",
  "#1b7f4e",
  "#0f766e",
  "#0369a1",
  "#1d4ed8",
  "#4338ca",
  "#6d28d9",
  "#be123c",
  "#9f1239",
  "#a16207",
  "#57534e",
] as const;

export const ACCOUNT_COLORS = [
  "#1b7f4e",
  "#0369a1",
  "#0284c7",
  "#9a3412",
  "#1d4ed8",
  "#6d28d9",
  "#a16207",
  "#57534e",
] as const;

export const defaultCategories: Category[] = [
  { id: "cat-sueldo", name: "Sueldo", type: "income", color: "#1b7f4e", monthlyBudget: 0 },
  { id: "cat-ventas", name: "Ventas", type: "income", color: "#0f766e", monthlyBudget: 0 },
  { id: "cat-changas", name: "Changas / Extras", type: "income", color: "#0369a1", monthlyBudget: 0 },
  { id: "cat-reintegros", name: "Reintegros", type: "income", color: "#1d4ed8", monthlyBudget: 0 },
  { id: "cat-otros-ingresos", name: "Otros ingresos", type: "income", color: "#57534e", monthlyBudget: 0 },
  { id: "cat-super", name: "Supermercado", type: "expense", color: "#c4491d", monthlyBudget: 0 },
  { id: "cat-vivienda", name: "Vivienda / Alquiler", type: "expense", color: "#6d28d9", monthlyBudget: 0 },
  {
    id: "cat-servicios",
    name: "Servicios (luz, gas, agua, internet)",
    type: "expense",
    color: "#0369a1",
    monthlyBudget: 0,
  },
  { id: "cat-transporte", name: "Transporte / Nafta", type: "expense", color: "#b45309", monthlyBudget: 0 },
  { id: "cat-salud", name: "Salud", type: "expense", color: "#be123c", monthlyBudget: 0 },
  { id: "cat-educacion", name: "Educación", type: "expense", color: "#4338ca", monthlyBudget: 0 },
  { id: "cat-ocio", name: "Salidas y ocio", type: "expense", color: "#a16207", monthlyBudget: 0 },
  { id: "cat-ropa", name: "Ropa", type: "expense", color: "#9f1239", monthlyBudget: 0 },
  { id: "cat-impuestos", name: "Impuestos", type: "expense", color: "#57534e", monthlyBudget: 0 },
  { id: "cat-suscripciones", name: "Suscripciones", type: "expense", color: "#0f766e", monthlyBudget: 0 },
  { id: "cat-deudas", name: "Deudas / Tarjeta", type: "expense", color: "#1d4ed8", monthlyBudget: 0 },
  { id: "cat-otros-gastos", name: "Otros gastos", type: "expense", color: "#78716c", monthlyBudget: 0 },
];

export const defaultAccounts: Account[] = [
  { id: "acc-efectivo", name: "Efectivo", color: "#1b7f4e", openingBalance: 0 },
  { id: "acc-banco", name: "Banco", color: "#0369a1", openingBalance: 0 },
  { id: "acc-mp", name: "Mercado Pago", color: "#0284c7", openingBalance: 0 },
  { id: "acc-tarjeta", name: "Tarjeta de crédito", color: "#9a3412", openingBalance: 0 },
  { id: "acc-ahorro", name: "Cuenta ahorro", color: "#1d4ed8", openingBalance: 0 },
];

/** Si quedó un color flúor de la paleta anterior, lo vuelve al tono sobrio. */
const CATEGORY_COLOR_UPGRADES: Record<string, { from: string[]; to: string }> = {
  "cat-sueldo": { from: ["#22c55e"], to: "#1b7f4e" },
  "cat-ventas": { from: ["#14b8a6"], to: "#0f766e" },
  "cat-changas": { from: ["#0ea5e9"], to: "#0369a1" },
  "cat-reintegros": { from: ["#3b82f6"], to: "#1d4ed8" },
  "cat-otros-ingresos": { from: ["#a3e635"], to: "#57534e" },
  "cat-super": { from: ["#ff5a1f"], to: "#c4491d" },
  "cat-vivienda": { from: ["#a855f7", "#7c3aed"], to: "#6d28d9" },
  "cat-servicios": { from: ["#06b6d4"], to: "#0369a1" },
  "cat-transporte": { from: ["#f59e0b"], to: "#b45309" },
  "cat-salud": { from: ["#f43f5e"], to: "#be123c" },
  "cat-educacion": { from: ["#8b5cf6"], to: "#4338ca" },
  "cat-ocio": { from: ["#fb7185"], to: "#a16207" },
  "cat-ropa": { from: ["#ec4899"], to: "#9f1239" },
  "cat-impuestos": { from: ["#64748b"], to: "#57534e" },
  "cat-suscripciones": { from: ["#14b8a6"], to: "#0f766e" },
  "cat-deudas": { from: ["#3b82f6"], to: "#1d4ed8" },
  "cat-otros-gastos": { from: ["#94a3b8"], to: "#78716c" },
};

const ACCOUNT_COLOR_UPGRADES: Record<string, { from: string[]; to: string }> = {
  "acc-efectivo": { from: ["#22c55e"], to: "#1b7f4e" },
  "acc-banco": { from: ["#0ea5e9"], to: "#0369a1" },
  "acc-mp": { from: ["#38bdf8"], to: "#0284c7" },
  "acc-tarjeta": { from: ["#f97316"], to: "#9a3412" },
  "acc-ahorro": { from: ["#3b82f6"], to: "#1d4ed8" },
};

function upgradeColor(id: string, color: string, map: Record<string, { from: string[]; to: string }>): string {
  const rule = map[id];
  if (!rule) return color;
  const current = color.toLowerCase();
  return rule.from.some((hex) => hex.toLowerCase() === current) ? rule.to : color;
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
