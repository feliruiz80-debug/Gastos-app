"use client";

export type AppTab = "home" | "investments" | "settings";

const TABS: { id: AppTab; label: string; icon: "home" | "invest" | "settings" }[] = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "investments", label: "Inversiones", icon: "invest" },
  { id: "settings", label: "Configuración", icon: "settings" },
];

export function BottomNav({ tab, onChange }: { tab: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30" aria-label="Barra de tareas">
      <div className="glass rounded-none border-x-0 border-b-0 px-2 pt-1.5 pb-[max(0.55rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onChange(item.id)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-medium sm:text-xs ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                <span className={`flex h-8 w-12 items-center justify-center rounded-full ${active ? "bg-ink text-paper" : ""}`}>
                  <TabIcon name={item.icon} />
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function TabIcon({ name }: { name: "home" | "invest" | "settings" }) {
  if (name === "home") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "invest") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7.5v9M9.2 9.4c.6-.8 1.6-1.2 2.8-1.2 1.7 0 2.8.8 2.8 2.1 0 2.6-5.6 1.3-5.6 3.8 0 1.2 1.1 2 2.8 2 1.2 0 2.2-.4 2.8-1.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
