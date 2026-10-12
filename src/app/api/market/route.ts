import { loadQuotes, normalizeSymbol } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const symbols = Array.isArray((body as { symbols?: unknown }).symbols)
    ? (body as { symbols: unknown[] }).symbols.filter((symbol): symbol is string => typeof symbol === "string")
    : [];
  const clean = symbols.map(normalizeSymbol).filter((symbol): symbol is string => symbol !== null);
  if (clean.length === 0) {
    return Response.json({ error: "Falta el símbolo." }, { status: 400 });
  }
  if (clean.length > 30) {
    return Response.json({ error: "Son demasiados símbolos juntos." }, { status: 400 });
  }

  const snapshot = await loadQuotes(clean);
  return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
