const STORAGE_KEY = "gastos-app-v1";

const CATEGORIES = {
  expense: ["Comida", "Transporte", "Casa", "Servicios", "Salud", "Ocio", "Compras", "Otros"],
  income: ["Sueldo", "Extra", "Otros"],
};

const form = document.querySelector("#form");
const amountInput = document.querySelector("#amount");
const categorySelect = document.querySelector("#category");
const dateInput = document.querySelector("#date");
const noteInput = document.querySelector("#note");
const formError = document.querySelector("#form-error");
const capInput = document.querySelector("#cap");
const capFill = document.querySelector("#cap-fill");
const capNote = document.querySelector("#cap-note");
const list = document.querySelector("#list");
const empty = document.querySelector("#empty");
const monthLabel = document.querySelector("#month-label");

let state = load();
let month = currentMonth();

document.querySelector("#prev-month").addEventListener("click", () => {
  month = shiftMonth(month, -1);
  dateInput.value = defaultDate(month);
  render();
});

document.querySelector("#next-month").addEventListener("click", () => {
  month = shiftMonth(month, 1);
  dateInput.value = defaultDate(month);
  render();
});

document.querySelectorAll('input[name="type"]').forEach((input) => {
  input.addEventListener("change", fillCategories);
});

capInput.addEventListener("change", () => {
  const parsed = parseLimit(capInput.value);
  if (parsed === null) {
    capInput.value = state.cap ? String(state.cap) : "";
    return;
  }
  state.cap = parsed;
  save();
  render();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = parseAmount(amountInput.value);
  if (amount === null) {
    showError("El monto tiene que ser mayor a cero.");
    return;
  }
  if (!dateInput.value) {
    showError("Elegí una fecha.");
    return;
  }

  state.movements.push({
    id: crypto.randomUUID(),
    type: selectedType(),
    amount,
    category: categorySelect.value,
    note: noteInput.value.trim(),
    date: dateInput.value,
  });
  save();
  amountInput.value = "";
  noteInput.value = "";
  showError("");
  month = dateInput.value.slice(0, 7);
  render();
  amountInput.focus();
});

fillCategories();
dateInput.value = defaultDate(month);
capInput.value = state.cap ? String(state.cap) : "";
render();

function render() {
  const inMonth = state.movements.filter((item) => item.date.startsWith(month));
  const income = sum(inMonth, "income");
  const expense = sum(inMonth, "expense");
  const totalIncome = sum(state.movements, "income");
  const totalExpense = sum(state.movements, "expense");

  monthLabel.textContent = monthName(month);
  setMoney("#income-total", income);
  setMoney("#expense-total", expense);
  setMoney("#month-balance", income - expense, true);
  document.querySelector("#available").textContent =
    "Saldo disponible: " + formatMoney(totalIncome - totalExpense);

  renderCap(expense);
  renderList(inMonth);
}

function renderCap(expense) {
  capFill.className = "";
  if (!state.cap) {
    capFill.style.width = "0%";
    capNote.textContent = "Sin tope. Escribí un monto si querés un límite mensual.";
    return;
  }

  const ratio = expense / state.cap;
  capFill.style.width = Math.min(ratio, 1) * 100 + "%";
  if (ratio > 1) capFill.classList.add("over");
  else if (ratio >= 0.8) capFill.classList.add("warn");

  const left = state.cap - expense;
  capNote.textContent =
    left >= 0
      ? "Quedan " + formatMoney(left) + " (" + Math.round(ratio * 100) + "%)."
      : "Superaste el tope por " + formatMoney(Math.abs(left)) + ".";
}

function renderList(items) {
  list.replaceChildren();
  const sorted = items.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  empty.hidden = sorted.length > 0;

  sorted.forEach((item) => {
    const row = document.createElement("li");
    row.className = "row";

    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.category;
    const meta = document.createElement("span");
    meta.textContent = [dayName(item.date), item.note].filter(Boolean).join(" · ");
    info.append(title, meta);

    const side = document.createElement("div");
    const amount = document.createElement("strong");
    amount.className = "amount " + item.type;
    amount.textContent = (item.type === "income" ? "+ " : "− ") + formatMoney(item.amount);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Borrar";
    remove.addEventListener("click", () => {
      state.movements = state.movements.filter((movement) => movement.id !== item.id);
      save();
      render();
    });
    side.append(amount, remove);
    row.append(info, side);
    list.append(row);
  });
}

function fillCategories() {
  const type = selectedType();
  const current = categorySelect.value;
  categorySelect.replaceChildren();
  CATEGORIES[type].forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    categorySelect.append(option);
  });
  if (CATEGORIES[type].includes(current)) categorySelect.value = current;
}

function selectedType() {
  return document.querySelector('input[name="type"]:checked').value;
}

function showError(message) {
  formError.hidden = !message;
  formError.textContent = message;
}

function setMoney(selector, value, color) {
  const node = document.querySelector(selector);
  node.textContent = formatMoney(value);
  node.classList.remove("positive", "negative");
  if (color) node.classList.add(value < 0 ? "negative" : "positive");
}

function sum(items, type) {
  return items.reduce((total, item) => (item.type === type ? total + item.amount : total), 0);
}

function formatMoney(value) {
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return "$ " + formatted;
}

function parseAmount(raw) {
  const cleaned = String(raw).trim().replace(/\s/g, "").replace(/\$/g, "");
  if (!cleaned) return null;
  const normalized =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "")
      : cleaned.replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 1e12) return null;
  return Math.round(value * 100) / 100;
}

function parseLimit(raw) {
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === "0") return 0;
  return parseAmount(raw);
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
    if (!parsed || !Array.isArray(parsed.movements)) return { movements: [], cap: 0 };
    return {
      movements: parsed.movements.filter(isMovement),
      cap: Number(parsed.cap) > 0 ? Number(parsed.cap) : 0,
    };
  } catch {
    return { movements: [], cap: 0 };
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isMovement(item) {
  return (
    item &&
    (item.type === "income" || item.type === "expense") &&
    typeof item.amount === "number" &&
    item.amount > 0 &&
    typeof item.category === "string" &&
    typeof item.date === "string"
  );
}

function currentMonth() {
  const now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
}

function shiftMonth(value, delta) {
  const [year, monthNumber] = value.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + delta, 1);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function defaultDate(value) {
  const today = new Date();
  const current = currentMonth();
  if (value === current) {
    return current + "-" + String(today.getDate()).padStart(2, "0");
  }
  return value + "-01";
}

function monthName(value) {
  const [year, monthNumber] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    new Date(year, monthNumber - 1, 1)
  );
}

function dayName(value) {
  const [year, monthNumber, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short" }).format(
    new Date(year, monthNumber - 1, day)
  );
}
