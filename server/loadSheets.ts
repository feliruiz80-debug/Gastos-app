import { SHEET_GIDS, SHEET_ID } from "../src/config";
import type { SheetsPayload } from "../src/types";
import { parseConfig, parseMovimientos, type GvizTable } from "./parseSheet";

const GVIZ_PREFIX = "/*O_o*/\ngoogle.visualization.Query.setResponse(";

async function fetchTable(gid: string): Promise<GvizTable> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) {
    throw new Error(`Google Sheets respondió ${response.status}.`);
  }

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

export async function loadSheets(): Promise<SheetsPayload> {
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
