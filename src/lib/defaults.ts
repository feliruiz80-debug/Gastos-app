import type { Category } from "./types";

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

export const defaultCategories: Category[] = [
  { id: "cat-salario", name: "Salario", type: "income", color: "#1b7f4e" },
  { id: "cat-freelance", name: "Freelance", type: "income", color: "#0f766e" },
  { id: "cat-inversiones", name: "Inversiones", type: "income", color: "#1d4ed8" },
  { id: "cat-otros-ingresos", name: "Otros ingresos", type: "income", color: "#57534e" },
  { id: "cat-comida", name: "Comida", type: "expense", color: "#c4491d" },
  { id: "cat-transporte", name: "Transporte", type: "expense", color: "#b45309" },
  { id: "cat-vivienda", name: "Vivienda", type: "expense", color: "#7c3aed" },
  { id: "cat-servicios", name: "Servicios", type: "expense", color: "#0369a1" },
  { id: "cat-salud", name: "Salud", type: "expense", color: "#be123c" },
  { id: "cat-entretenimiento", name: "Entretenimiento", type: "expense", color: "#a16207" },
  { id: "cat-compras", name: "Compras", type: "expense", color: "#9f1239" },
  { id: "cat-educacion", name: "Educación", type: "expense", color: "#4338ca" },
  { id: "cat-otros-gastos", name: "Otros", type: "expense", color: "#57534e" },
];

export function emptyData() {
  return {
    categories: defaultCategories.map((category) => ({ ...category })),
    transactions: [],
  };
}
