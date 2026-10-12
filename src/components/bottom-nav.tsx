"use client";

export type AppTab = "home" | "investments" | "settings";

const TABS: { id: AppTab; label: string }[] = [
  { id: "home", label: "Inicio" },
  { id: "investments", label: "Inversiones" },
  { id: "settings", label: "Configuración" },
];

export function BottomNav({ tab, onChange }: { tab: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-3 z-30 px-3" aria-label="Secciones">
      <div className="glass mx-auto flex max-w-md rounded-full p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => onChange(item.id)}
            className={`flex-1 whitespace-nowrap rounded-full px-2 py-2.5 text-xs font-medium sm:text-sm ${
              tab === item.id ? "bg-ink text-paper" : "text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
