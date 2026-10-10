export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function currentMonth(now = new Date()): string {
  return toISODate(now).slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + delta, 1);
  return currentMonth(date);
}

export function monthStart(month: string): Date {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, monthIndex - 1, 1);
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function formatMonth(month: string): string {
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(monthStart(month));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatMonthShort(month: string, withYear: boolean): string {
  const date = monthStart(month);
  const short = new Intl.DateTimeFormat("es-AR", { month: "short" })
    .format(date)
    .replace(".", "");
  if (!withYear) return short;
  return `${short} ${String(date.getFullYear()).slice(2)}`;
}

export function lastMonths(anchor: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    shiftMonth(anchor, index - (count - 1)),
  );
}

export function defaultDateForMonth(month: string, now = new Date()): string {
  const today = toISODate(now);
  if (today.startsWith(month)) return today;
  return `${month}-01`;
}

export function formatGroupDate(iso: string, today = toISODate(new Date())): string {
  if (iso === today) return "Hoy";
  const [year, month, day] = today.split("-").map(Number);
  const yesterday = toISODate(new Date(year, month - 1, day - 1));
  if (iso === yesterday) return "Ayer";

  const [y, m, d] = iso.split("-").map(Number);
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(y, m - 1, d));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
