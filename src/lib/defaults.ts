import type { Account, Category } from "./types";

export const CATEGORY_COLORS = [
  "#c4491d",
  "#b45309",
  "#1b7f4e",
  "#0f766e",
  "#0369a1",
  "#1d4ed8",
  "#4338ca",
  "#7c3aed",
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
  "#7c3aed",
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
  { id: "cat-vivienda", name: "Vivienda / Alquiler", type: "expense", color: "#7c3aed", monthlyBudget: 0 },
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

export function emptyData() {
  return {
    categories: defaultCategories.map((category) => ({ ...category })),
    accounts: defaultAccounts.map((account) => ({ ...account })),
    transactions: [],
    investments: [],
    fixedExpenses: [],
  };
}
