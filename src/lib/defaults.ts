import type { Account, Category } from "./types";

/** Colores brillantes para la dona y las categorías. */
export const CATEGORY_COLORS = [
  "#ff5c39",
  "#ffe566",
  "#22c55e",
  "#14d4c8",
  "#3b9eff",
  "#5b8cff",
  "#7b5cff",
  "#a78bff",
  "#ff4d9a",
  "#ff6b9d",
  "#ffb020",
  "#94a3b8",
] as const;

export const ACCOUNT_COLORS = [
  "#22c55e",
  "#3b9eff",
  "#38bdf8",
  "#ff7a3d",
  "#5b8cff",
  "#a78bff",
  "#ffe566",
  "#ff4d9a",
] as const;

export const defaultCategories: Category[] = [
  { id: "cat-sueldo", name: "Sueldo", type: "income", color: "#22c55e", monthlyBudget: 0 },
  { id: "cat-ventas", name: "Ventas", type: "income", color: "#14d4c8", monthlyBudget: 0 },
  { id: "cat-changas", name: "Changas / Extras", type: "income", color: "#3b9eff", monthlyBudget: 0 },
  { id: "cat-reintegros", name: "Reintegros", type: "income", color: "#5b8cff", monthlyBudget: 0 },
  { id: "cat-otros-ingresos", name: "Otros ingresos", type: "income", color: "#94a3b8", monthlyBudget: 0 },
  { id: "cat-super", name: "Supermercado", type: "expense", color: "#ff5c39", monthlyBudget: 0 },
  { id: "cat-vivienda", name: "Vivienda / Alquiler", type: "expense", color: "#7b5cff", monthlyBudget: 0 },
  {
    id: "cat-servicios",
    name: "Servicios (luz, gas, agua, internet)",
    type: "expense",
    color: "#14d4c8",
    monthlyBudget: 0,
  },
  { id: "cat-transporte", name: "Transporte / Nafta", type: "expense", color: "#ffe566", monthlyBudget: 0 },
  { id: "cat-salud", name: "Salud", type: "expense", color: "#ff4d9a", monthlyBudget: 0 },
  { id: "cat-educacion", name: "Educación", type: "expense", color: "#a78bff", monthlyBudget: 0 },
  { id: "cat-ocio", name: "Salidas y ocio", type: "expense", color: "#ffb020", monthlyBudget: 0 },
  { id: "cat-ropa", name: "Ropa", type: "expense", color: "#ff6b9d", monthlyBudget: 0 },
  { id: "cat-impuestos", name: "Impuestos", type: "expense", color: "#94a3b8", monthlyBudget: 0 },
  { id: "cat-suscripciones", name: "Suscripciones", type: "expense", color: "#2dd4bf", monthlyBudget: 0 },
  { id: "cat-deudas", name: "Deudas / Tarjeta", type: "expense", color: "#5b8cff", monthlyBudget: 0 },
  { id: "cat-otros-gastos", name: "Otros gastos", type: "expense", color: "#a8b0bc", monthlyBudget: 0 },
];

export const defaultAccounts: Account[] = [
  { id: "acc-efectivo", name: "Efectivo", color: "#22c55e", openingBalance: 0 },
  { id: "acc-banco", name: "Banco", color: "#3b9eff", openingBalance: 0 },
  { id: "acc-mp", name: "Mercado Pago", color: "#38bdf8", openingBalance: 0 },
  { id: "acc-tarjeta", name: "Tarjeta de crédito", color: "#ff7a3d", openingBalance: 0 },
  { id: "acc-ahorro", name: "Cuenta ahorro", color: "#5b8cff", openingBalance: 0 },
];

/** Actualiza colores de fábrica viejos a la paleta brillante. */
const CATEGORY_COLOR_UPGRADES: Record<string, { from: string[]; to: string }> = {
  "cat-sueldo": { from: ["#1b7f4e", "#22c55e", "#5aad78"], to: "#22c55e" },
  "cat-ventas": { from: ["#0f766e", "#14b8a6", "#4aa89a"], to: "#14d4c8" },
  "cat-changas": { from: ["#0369a1", "#0ea5e9", "#5aa8d4"], to: "#3b9eff" },
  "cat-reintegros": { from: ["#1d4ed8", "#3b82f6", "#6b93db"], to: "#5b8cff" },
  "cat-otros-ingresos": { from: ["#57534e", "#a3e635", "#8f8a84"], to: "#94a3b8" },
  "cat-super": { from: ["#c4491d", "#ff5a1f", "#e07a4f"], to: "#ff5c39" },
  "cat-vivienda": { from: ["#6d28d9", "#7c3aed", "#a855f7", "#b07fd4", "#6b5ce7"], to: "#7b5cff" },
  "cat-servicios": { from: ["#0369a1", "#06b6d4", "#5aa8d4"], to: "#14d4c8" },
  "cat-transporte": { from: ["#b45309", "#f59e0b", "#d4a04c", "#f0e08a"], to: "#ffe566" },
  "cat-salud": { from: ["#be123c", "#f43f5e", "#d46b7e"], to: "#ff4d9a" },
  "cat-educacion": { from: ["#4338ca", "#8b5cf6", "#8b84d6"], to: "#a78bff" },
  "cat-ocio": { from: ["#a16207", "#fb7185", "#c9a35a"], to: "#ffb020" },
  "cat-ropa": { from: ["#9f1239", "#ec4899", "#c45d72"], to: "#ff6b9d" },
  "cat-impuestos": { from: ["#57534e", "#64748b", "#8f8a84"], to: "#94a3b8" },
  "cat-suscripciones": { from: ["#0f766e", "#14b8a6", "#4aa89a"], to: "#2dd4bf" },
  "cat-deudas": { from: ["#1d4ed8", "#3b82f6", "#6b93db"], to: "#5b8cff" },
  "cat-otros-gastos": { from: ["#78716c", "#94a3b8", "#a39e97"], to: "#a8b0bc" },
};

const ACCOUNT_COLOR_UPGRADES: Record<string, { from: string[]; to: string }> = {
  "acc-efectivo": { from: ["#1b7f4e", "#22c55e", "#5aad78"], to: "#22c55e" },
  "acc-banco": { from: ["#0369a1", "#0ea5e9", "#5aa8d4"], to: "#3b9eff" },
  "acc-mp": { from: ["#0284c7", "#38bdf8", "#6bb8e0"], to: "#38bdf8" },
  "acc-tarjeta": { from: ["#9a3412", "#f97316", "#e08a55"], to: "#ff7a3d" },
  "acc-ahorro": { from: ["#1d4ed8", "#3b82f6", "#6b93db"], to: "#5b8cff" },
};

function upgradeColor(id: string, color: string, map: Record<string, { from: string[]; to: string }>): string {
  const rule = map[id];
  if (!rule) return color;
  const current = color.toLowerCase();
  if (current === rule.to.toLowerCase()) return color;
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
