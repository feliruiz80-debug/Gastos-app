# Gastos

Aplicación web para ver ingresos, gastos, cuentas y presupuestos personales. Los datos salen de una hoja pública de Google Sheets: cada vez que se abre o se toca **Actualizar**, la app vuelve a leer la hoja.

Hoja: [gastos](https://docs.google.com/spreadsheets/d/18TgchNsA-EMDeGPJdAB3WffqJ02viOL6/edit?gid=1335016283#gid=1335016283)

## Qué muestra

- Resumen del período: ingresos, gastos, resultado y saldo disponible.
- Gráfico mensual del año. Al tocar un mes se filtra el resto de la app.
- Historial de movimientos, con búsqueda y filtros por tipo, categoría y cuenta.
- Saldo por cuenta: saldo inicial de la pestaña Config, más ingresos, menos gastos.
- Categorías de gasto contra el presupuesto mensual (o el anual, si el filtro es todo el año).

Los montos se cargan en positivo en la hoja. La columna **Tipo** define si suma o resta.

## Cómo se cargan los datos

Se edita la hoja, no la app.

- `Movimientos`: ID, Fecha, Tipo, Categoría, Descripción, Monto, Cuenta, Notas.
- `Config`: tipos, categorías, presupuesto mensual y saldo inicial de cada cuenta.

Las pestañas `Resumen` y `Cuentas` de la hoja siguen sirviendo dentro de Sheets. La app recalcula esos totales a partir de Movimientos y Config.

## Desarrollo

```bash
npm install
npm test
npm run dev
```

La app queda en `http://localhost:5173`. En local, Vite responde `/api/sheets`. En Vercel, la misma ruta la resuelve `api/sheets.ts`.
