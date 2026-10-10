# Control de Gastos

Aplicación web para registrar, organizar y controlar los ingresos y gastos personales.

## Objetivo

Crear una aplicación simple, rápida y moderna que permita:

* Registrar ingresos.
* Registrar gastos.
* Clasificar gastos por categorías.
* Ver cuánto dinero ingresa y cuánto se gasta.
* Consultar el saldo disponible.
* Llevar un historial de movimientos.
* Visualizar la información de forma clara y sencilla.

## Tecnologías

* Frontend: Next.js, React y Tailwind CSS
* Datos: guardados en el navegador (localStorage), con exportación e importación JSON
* Hosting: Vercel
* Repositorio: GitHub
* Desarrollo: Cursor

## Cómo usarla

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

Desde la pantalla principal podés:

* Anotar un ingreso o un gasto.
* Cambiar de mes o ver todo el historial.
* Revisar el saldo, el balance del período y el gasto por categoría.
* Editar o borrar movimientos.
* Administrar categorías.
* Cargar datos de ejemplo, exportar un respaldo o importarlo.

Los datos quedan en este navegador. Un respaldo JSON sirve para pasarlos a otra computadora. La base de datos compartida queda para más adelante.

## Estado

La primera versión cubre el registro, las categorías, el saldo, el historial y los gráficos.

## Próximos pasos

1. Conectar una base de datos para usar la app en más de un dispositivo.
2. Publicar la versión inicial en Vercel.
