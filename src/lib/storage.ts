import { emptyData } from "./defaults";
import { sanitizeData } from "./backup";
import type { AppData } from "./types";

export const STORAGE_KEY = "gastos-app-v1";

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return sanitizeData(JSON.parse(raw)) ?? emptyData();
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
