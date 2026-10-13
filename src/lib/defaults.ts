import type { Account, Category } from "./types";

/** Colores claros y suaves: ni flúor ni oscuros. */
export const CATEGORY_COLORS = [
  "#e07a4f",
  "#d4a04c",
  "#5aad78",
  "#4aa89a",
  "#5aa8d4",
  "#6b93db",
  "#8b84d6",
  "#b07fd4",
  "#d46b7e",
  "#c45d72",
  "#c9a35a",
  "#8f8a84",
] as const;

export const ACCOUNT_COLORS = [
  "#5aad78",
  "#5aa8d4",
  "#6bb8e0",
  "#e08a55",
  "#6b93db",
  "#b07fd4",
  "#d4a04c",
  "#d46b7e",
] as const;

export const defaultCategories: Category[] = [
  { id: "cat-sueldo", name: "Sueldo", type: "income", color: "#5aad78", monthlyBudget: 0 },
  { id: "cat-ventas", name: "Ventas", type: "income", color: "#4aa89a", monthlyBudget: 0 },
  { id: "cat-changas", name: "Changas / Extras", type: "income", color: "#5aa8d4", monthlyBudget: 0 },
  { id: "cat-reintegros", name: "Reintegros", type: "income", color: "#6b93db", monthlyBudget: 0 },
  { id: "cat-otros-ingresos", name: "Otros ingresos", type: "income", color: "#8f8a84", monthlyBudget: 0 },
  { id: "cat-super", name: "Supermercado", type: "expense", color: "#e07a4f", monthlyBudget: 0 },
  { id: "cat-vivienda", name: "Vivienda / Alquiler", type: "expense", color: "#b07fd4", monthlyBudget: 0 },
  {
    id: "cat-servicios",
    name: "Servicios (luz, gas, agua, internet)",
    type: "expense",
    color: "#5aa8d4",
    monthlyBudget: 0,
  },
  { id: "cat-transporte", name: "Transporte / Nafta", type: "expense", color: "#d4a04c", monthlyBudget: 0 },
  { id: "cat-salud", name: "Salud", type: "expense", color: "#d46b7e", monthlyBudget: 0 },
  { id: "cat-educacion", name: "Educación", type: "expense", color: "#8b84d6", monthlyBudget: 0 },
  { id: "cat-ocio", name: "Salidas y ocio", type: "expense", color: "#c9a35a", monthlyBudget: 0 },
  { id: "cat-ropa", name: "Ropa", type: "expense", color: "#c45d72", monthlyBudget: 0 },
  { id: "cat-impuestos", name: "Impuestos", type: "expense", color: "#8f8a84", monthlyBudget: 0 },
  { id: "cat-suscripciones", name: "Suscripciones", type: "expense", color: "#4aa89a", monthlyBudget: 0 },
  { id: "cat-deudas", name: "Deudas / Tarjeta", type: "expense", color: "#6b93db", monthlyBudget: 0 },
  { id: "cat-otros-gastos", name: "Otros gastos", type: "expense", color: "#a39e97", monthlyBudget: 0 },
];

export const defaultAccounts: Account[] = [
  { id: "acc-efectivo", name: "Efectivo", color: "#5aad78", openingBalance: 0 },
  { id: "acc-banco", name: "Banco", color: "#5aa8d4", openingBalance: 0 },
  { id: "acc-mp", name: "Mercado Pago", color: "#6bb8e0", openingBalance: 0 },
  { id: "acc-tarjeta", name: "Tarjeta de crédito", color: "#e08a55", openingBalance: 0 },
  { id: "acc-ahorro", name: "Cuenta ahorro", color: "#6b93db", openingBalance: 0 },
];

/** Actualiza colores de fábrica viejos (oscuros o flúor) a la paleta clara. */
const CATEGORY_COLOR_UPGRADES: Record<string, { from: string[]; to: string }> = {
  "cat-sueldo": { from: ["#1b7f4e", "#22c55e"], to: "#5aad78" },
  "cat-ventas": { from: ["#0f766e", "#14b8a6"], to: "#4aa89a" },
  "cat-changas": { from: ["#0369a1", "#0ea5e9"], to: "#5aa8d4" },
  "cat-reintegros": { from: ["#1d4ed8", "#3b82f6"], to: "#6b93db" },
  "cat-otros-ingresos": { from: ["#57534e", "#a3e635"], to: "#8f8a84" },
  "cat-super": { from: ["#c4491d", "#ff5a1f"], to: "#e07a4f" },
  "cat-vivienda": { from: ["#6d28d9", "#7c3aed", "#a855f7"], to: "#b07fd4" },
  "cat-servicios": { from: ["#0369a1", "#06b6d4"], to: "#5aa8d4" },
  "cat-transporte": { from: ["#b45309", "#f59e0b"], to: "#d4a04c" },
  "cat-salud": { from: ["#be123c", "#f43f5e"], to: "#d46b7e" },
  "cat-educacion": { from: ["#4338ca", "#8b5cf6"], to: "#8b84d6" },
  "cat-ocio": { from: ["#a16207", "#fb7185"], to: "#c9a35a" },
  "cat-ropa": { from: ["#9f1239", "#ec4899"], to: "#c45d72" },
  "cat-impuestos": { from: ["#57534e", "#64748b"], to: "#8f8a84" },
  "cat-suscripciones": { from: ["#0f766e", "#14b8a6"], to: "#4aa89a" },
  "cat-deudas": { from: ["#1d4ed8", "#3b82f6"], to: "#6b93db" },
  "cat-otros-gastos": { from: ["#78716c", "#94a3b8"], to: "#a39e97" },
};

const ACCOUNT_COLOR_UPGRADES: Record<string, { from: string[]; to: string }> = {
  "acc-efectivo": { from: ["#1b7f4e", "#22c55e"], to: "#5aad78" },
  "acc-banco": { from: ["#0369a1", "#0ea5e9"], to: "#5aa8d4" },
  "acc-mp": { from: ["#0284c7", "#38bdf8"], to: "#6bb8e0" },
  "acc-tarjeta": { from: ["#9a3412", "#f97316"], to: "#e08a55" },
  "acc-ahorro": { from: ["#1d4ed8", "#3b82f6"], to: "#6b93db" },
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
