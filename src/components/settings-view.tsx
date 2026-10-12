"use client";

import { useRef } from "react";
import { ThemeToggle } from "./theme-toggle";
import { UpdateButton } from "./update-button";

type SettingsViewProps = {
  syncing: boolean;
  onOpenCategories: () => void;
  onOpenAccounts: () => void;
  onSync: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onSeed: () => void;
  onClear: () => void;
  onReset: () => void;
};

export function SettingsView(props: SettingsViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-28 sm:px-6 sm:py-10">
      <header>
        <p className="text-sm font-medium tracking-wide text-muted">Todo lo que se configura</p>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">Configuración</h1>
      </header>

      <section className="glass mt-6 rounded-3xl p-5">
        <h2 className="font-display text-2xl tracking-tight">Apariencia</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ThemeToggle />
          <UpdateButton />
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <SettingButton title="Categorías" detail="Nombres, colores y presupuesto mensual" onClick={props.onOpenCategories} />
        <SettingButton title="Cuentas" detail="Efectivo, banco, Mercado Pago y saldos iniciales" onClick={props.onOpenAccounts} />
        <SettingButton
          title={props.syncing ? "Leyendo la hoja…" : "Traer de la hoja"}
          detail="Suma los movimientos de tu Google Sheet"
          onClick={props.onSync}
        />
        <SettingButton title="Exportar respaldo" detail="Descarga un JSON con todo" onClick={props.onExport} />
        <SettingButton title="Importar respaldo" detail="Reemplaza los datos de este navegador" onClick={() => fileRef.current?.click()} />
        <SettingButton title="Cargar ejemplos" detail="Movimientos de muestra para ver la app" onClick={props.onSeed} />
      </section>

      <section className="glass mt-4 space-y-2 rounded-3xl p-5">
        <h2 className="font-display text-2xl tracking-tight">Datos</h2>
        <button type="button" onClick={props.onClear} className="block w-full rounded-2xl px-3 py-3 text-left text-sm hover:bg-paper/70">
          Borrar movimientos
        </button>
        <button type="button" onClick={props.onReset} className="block w-full rounded-2xl px-3 py-3 text-left text-sm text-expense hover:bg-paper/70">
          Restablecer app
        </button>
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Importar respaldo"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) props.onImport(file);
        }}
      />
    </div>
  );
}

function SettingButton({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="glass rounded-3xl p-5 text-left">
      <span className="block font-medium">{title}</span>
      <span className="mt-1 block text-sm text-muted">{detail}</span>
    </button>
  );
}
