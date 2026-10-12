const CRYPTO_IDS: Record<string, string> = {
  ADA: "cardano",
  APT: "aptos",
  ARB: "arbitrum",
  ATOM: "cosmos",
  AVAX: "avalanche-2",
  BCH: "bitcoin-cash",
  BNB: "binancecoin",
  BTC: "bitcoin",
  DAI: "dai",
  DOGE: "dogecoin",
  DOT: "polkadot",
  ETH: "ethereum",
  LINK: "chainlink",
  LTC: "litecoin",
  NEAR: "near",
  OP: "optimism",
  SHIB: "shiba-inu",
  SOL: "solana",
  SUI: "sui",
  TON: "the-open-network",
  TRX: "tron",
  UNI: "uniswap",
  USDC: "usd-coin",
  USDT: "tether",
  XLM: "stellar",
  XRP: "ripple",
};

export type MarketQuote = {
  symbol: string;
  price: number;
  currency: "ARS" | "USD";
  priceArs: number;
};

export type MarketSnapshot = {
  mep: number | null;
  quotes: MarketQuote[];
  missing: string[];
  warning: string | null;
};

export function normalizeSymbol(raw: string): string | null {
  const symbol = raw.trim().toUpperCase();
  if (!symbol || symbol.length > 15 || !/^[A-Z0-9][A-Z0-9.-]*$/.test(symbol)) return null;
  return symbol;
}

export function cryptoIdFor(symbol: string): string | null {
  if (CRYPTO_IDS[symbol]) return CRYPTO_IDS[symbol];
  const dashed = symbol.endsWith("-USD") ? symbol.slice(0, -4) : "";
  if (dashed && CRYPTO_IDS[dashed]) return CRYPTO_IDS[dashed];
  if (symbol.endsWith("USD") && symbol.length > 3) {
    const bare = symbol.slice(0, -3);
    if (CRYPTO_IDS[bare]) return CRYPTO_IDS[bare];
  }
  return null;
}

export function priceInArs(price: number, currency: string, mep: number | null): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  const code = currency.toUpperCase();
  if (code === "ARS") return price;
  if (code === "USD") {
    if (mep === null || !Number.isFinite(mep) || mep <= 0) return null;
    return price * mep;
  }
  return null;
}

export function positionValue(units: number, priceArs: number): number {
  if (!Number.isFinite(units) || !Number.isFinite(priceArs) || units <= 0 || priceArs <= 0) return 0;
  return Math.round(units * priceArs * 100) / 100;
}

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; currency?: string };
    }> | null;
  };
};

async function readMep(): Promise<number | null> {
  try {
    const response = await fetch("https://dolarapi.com/v1/dolares/bolsa", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { venta?: unknown };
    const venta = typeof body.venta === "number" ? body.venta : Number(body.venta);
    if (!Number.isFinite(venta) || venta <= 0) return null;
    return venta;
  } catch {
    return null;
  }
}

async function readYahoo(symbol: string): Promise<{ price: number; currency: "ARS" | "USD" } | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as YahooChart;
    const meta = body.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const currency = meta?.currency?.toUpperCase();
    if (typeof price !== "number" || price <= 0) return null;
    if (currency !== "ARS" && currency !== "USD") return null;
    return { price, currency };
  } catch {
    return null;
  }
}

async function readCrypto(ids: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  if (ids.length === 0) return prices;
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(","))}&vs_currencies=usd`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return prices;
    const body = (await response.json()) as Record<string, { usd?: number }>;
    for (const id of ids) {
      const usd = body[id]?.usd;
      if (typeof usd === "number" && usd > 0) prices.set(id, usd);
    }
  } catch {
    return prices;
  }
  return prices;
}

export async function loadQuotes(rawSymbols: string[]): Promise<MarketSnapshot> {
  const symbols = [...new Set(rawSymbols.map(normalizeSymbol).filter((symbol): symbol is string => symbol !== null))];
  const cryptoSymbols = symbols.filter((symbol) => cryptoIdFor(symbol));
  const equitySymbols = symbols.filter((symbol) => !cryptoIdFor(symbol));
  const cryptoIds = [...new Set(cryptoSymbols.map((symbol) => cryptoIdFor(symbol)).filter((id): id is string => id !== null))];

  const [mep, cryptoPrices, equityPrices] = await Promise.all([
    readMep(),
    readCrypto(cryptoIds),
    Promise.all(equitySymbols.map(async (symbol) => ({ symbol, quote: await readYahoo(symbol) }))),
  ]);

  const quotes: MarketQuote[] = [];
  const missing: string[] = [];

  for (const symbol of cryptoSymbols) {
    const id = cryptoIdFor(symbol);
    const usd = id ? cryptoPrices.get(id) : undefined;
    const priceArs = usd ? priceInArs(usd, "USD", mep) : null;
    if (!usd || priceArs === null) missing.push(symbol);
    else quotes.push({ symbol, price: usd, currency: "USD", priceArs });
  }

  for (const item of equityPrices) {
    const priceArs = item.quote ? priceInArs(item.quote.price, item.quote.currency, mep) : null;
    if (!item.quote || priceArs === null) missing.push(item.symbol);
    else quotes.push({ symbol: item.symbol, price: item.quote.price, currency: item.quote.currency, priceArs });
  }

  const warning = mep === null ? "No se pudo leer el dólar MEP. Los precios en dólares quedan sin actualizar." : null;
  return { mep, quotes, missing, warning };
}
