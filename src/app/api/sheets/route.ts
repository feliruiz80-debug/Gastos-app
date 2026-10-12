import { loadPublicSheet } from "@/lib/sheets";

export async function GET() {
  try {
    const data = await loadPublicSheet();
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer la hoja.";
    return Response.json({ error: message }, { status: 502 });
  }
}
