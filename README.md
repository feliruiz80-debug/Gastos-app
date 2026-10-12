# Gastos

App personal para anotar ingresos, gastos y pases entre cuentas, ver el saldo de cada una y seguir el presupuesto del mes.

## Qué hace

- Ingreso, gasto o pase entre cuentas (efectivo, banco, Mercado Pago, tarjeta y ahorro).
- Categorías de uso diario: sueldo, super, alquiler, servicios, nafta, tarjeta y el resto.
- Presupuesto mensual por categoría de gasto.
- Saldo de cada cuenta, con saldo inicial.
- Historial con búsqueda y filtro por mes, tipo y cuenta.
- Gráfico de los últimos 6 meses.
- Los datos quedan en el navegador. Se pueden exportar e importar en JSON.
- Se puede traer lo cargado en la [hoja pública](https://docs.google.com/spreadsheets/d/18TgchNsA-EMDeGPJdAB3WffqJ02viOL6/edit?gid=1335016283#gid=1335016283).

## Cómo usarla

```bash
npm install
npm test
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

En la hoja, `Movimientos` tiene ID, Fecha, Tipo, Categoría, Descripción, Monto, Cuenta y Notas. `Config` tiene las categorías, el presupuesto mensual y el saldo inicial de cada cuenta. **Traer de la hoja** suma esos movimientos y, si el presupuesto o el saldo inicial es distinto de cero, actualiza ese número. Lo que cargues solo en la app no se borra.

## Tecnologías

- Next.js, React y Tailwind CSS
- Datos en el navegador
- Hosting previsto: Vercel
