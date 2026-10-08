import { loadSheets } from "../server/loadSheets";

type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (body: unknown) => void };
};

export default async function handler(_req: unknown, res: ApiResponse) {
  try {
    const data = await loadSheets();
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer la hoja.";
    res.status(502).json({ error: message });
  }
}
