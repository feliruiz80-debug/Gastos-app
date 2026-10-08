import { useMemo, useState } from "react";
import { isIncome } from "../../server/parseSheet";
import { totals } from "../lib/aggregate";
import { formatDate, formatMoney } from "../lib/format";
import type { Movement, SheetConfig } from "../types";

type Props = {
  movements: Movement[];
  config: SheetConfig;
};

type SortKey = "date" | "amount";

export function Movimientos({ movements, config }: Props) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [account, setAccount] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "date",
    direction: "desc",
  });

  const categories = useMemo(() => {
    const names = new Set<string>([
      ...config.expenseCategories.map((item) => item.name),
      ...config.incomeCategories,
      ...movements.map((item) => item.category),
    ]);
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));
  }, [config, movements]);

  const accounts = useMemo(() => {
    const names = new Set<string>([...config.accounts.map((item) => item.name), ...movements.map((item) => item.account)]);
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));
  }, [config, movements]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    const filtered = movements.filter((movement) => {
      if (type === "ingreso" && !isIncome(movement.type)) return false;
      if (type === "gasto" && isIncome(movement.type)) return false;
      if (category !== "all" && movement.category !== category) return false;
      if (account !== "all" && movement.account !== account) return false;
      if (!text) return true;
      return [movement.id, movement.description, movement.category, movement.account, movement.notes, movement.type]
        .join(" ")
        .toLowerCase()
        .includes(text);
    });

    return filtered.sort((a, b) => {
      const factor = sort.direction === "asc" ? 1 : -1;
      if (sort.key === "amount") return (a.amount - b.amount) * factor;
      return a.date.localeCompare(b.date) * factor || a.id.localeCompare(b.id) * factor;
    });
  }, [account, category, movements, query, sort, type]);

  const visibleTotals = totals(visible);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "date" ? "desc" : "desc" },
    );
  }

  return (
    <section className="panel">
      <div className="toolbar">
        <h2>Movimientos</h2>
        <div className="inline-filters">
          <input
            className="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar descripción, cuenta o nota"
            aria-label="Buscar movimientos"
          />
          <select aria-label="Tipo" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">Todos los tipos</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
          <select aria-label="Categoría" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Todas las categorías</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select aria-label="Cuenta" value={account} onChange={(event) => setAccount(event.target.value)}>
            <option value="all">Todas las cuentas</option>
            {accounts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="meta">
        {visible.length} movimientos · ingresos {formatMoney(visibleTotals.income)} · gastos {formatMoney(visibleTotals.expense)} · resultado {formatMoney(visibleTotals.result)}
      </p>
      {visible.length === 0 ? <p className="empty">No hay movimientos con estos filtros.</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <button type="button" onClick={() => toggleSort("date")}>
                  Fecha {sort.key === "date" ? (sort.direction === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Cuenta</th>
              <th>
                <button type="button" onClick={() => toggleSort("amount")}>
                  Monto {sort.key === "amount" ? (sort.direction === "asc" ? "↑" : "↓") : ""}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((movement) => {
              const income = isIncome(movement.type);
              return (
                <tr key={`${movement.id}-${movement.date}-${movement.description}-${movement.amount}`}>
                  <td>{formatDate(movement.date)}</td>
                  <td>
                    <span className={income ? "pill income" : "pill expense"}>{movement.type}</span>
                  </td>
                  <td>{movement.category}</td>
                  <td>
                    {movement.description || "—"}
                    {movement.notes ? <div className="muted">{movement.notes}</div> : null}
                  </td>
                  <td>{movement.account}</td>
                  <td className={income ? "amount income" : "amount expense"}>{formatMoney(movement.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
