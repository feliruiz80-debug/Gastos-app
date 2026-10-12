import type { TxType } from "./types";

const moneyFormat = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inputFormat = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return moneyFormat.format(value);
}

export function formatSigned(type: TxType, amount: number): string {
  const formatted = formatMoney(amount);
  return type === "expense" ? `−${formatted}` : `+${formatted}`;
}

export function amountToInput(value: number): string {
  return inputFormat.format(value);
}

/**
 * Acepta montos en formato argentino o simple:
 * 12500, 12.500, 12.500,50, 12,50, 12.5, 1.000.000
 */
export function parseAmount(input: string): number | null {
  const raw = input.trim().replace(/\s/g, "");
  if (!raw || !/^[\d.,]+$/.test(raw)) return null;

  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  let normalized: string;

  if (hasComma && hasDot) {
    const decimalSep = raw.lastIndexOf(",") > raw.lastIndexOf(".") ? "," : ".";
    const thousandsSep = decimalSep === "," ? "." : ",";
    const last = raw.lastIndexOf(decimalSep);
    const intPart = raw.slice(0, last).split(thousandsSep).join("");
    const frac = raw.slice(last + 1);
    if (!/^\d+$/.test(intPart) || !/^\d{1,2}$/.test(frac)) return null;
    normalized = `${intPart}.${frac}`;
  } else if (hasComma || hasDot) {
    const sep = hasComma ? "," : ".";
    const parts = raw.split(sep);
    if (parts.some((part) => part.length === 0)) return null;
    if (parts.length > 2) {
      if (!parts.slice(1).every((part) => part.length === 3)) return null;
      normalized = parts.join("");
    } else if (parts[1].length === 3) {
      normalized = parts.join("");
    } else if (parts[1].length <= 2) {
      normalized = `${parts[0]}.${parts[1]}`;
    } else {
      return null;
    }
  } else {
    normalized = raw;
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000_000_000) return null;
  return Math.round(value * 100) / 100;
}

/** Cantidad de acciones o cripto: 10, 0,25 o 0.004. */
export function parseUnits(input: string): number | null {
  const raw = input.trim().replace(/\s/g, "");
  if (!raw) return null;
  const normalized = raw.replace(",", ".");
  if (!/^\d+(\.\d{1,8})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000_000) return null;
  return Math.round(value * 1e8) / 1e8;
}

export function parseBudget(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed === "0") return 0;
  return parseAmount(trimmed);
}

export function parseSignedAmount(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed === "0" || trimmed === "-0") return 0;
  const negative = trimmed.startsWith("-");
  const parsed = parseAmount(negative ? trimmed.slice(1) : trimmed);
  if (parsed === null) return null;
  return negative ? -parsed : parsed;
}
