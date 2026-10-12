"use client";

export type AppTab = "home" | "investments" | "settings";

const TABS: { id: AppTab; label: string; icon: "home" | "invest" | "settings" }[] = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "investments", label: "Inversiones", icon: "invest" },
  { id: "settings", label: "Ajustes", icon: "settings" },
];

export function BottomNav({ tab, onChange }: { tab: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
      aria-label="Barra de tareas"
    >
      <div className="glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5 shadow-[0_12px_40px_rgba(26,22,19,0.18)]">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`flex h-11 items-center justify-center rounded-full transition-all duration-300 ease-out ${
                active
                  ? "gap-2 bg-[#2563eb] px-4 text-white shadow-[0_6px_16px_rgba(37,99,235,0.4)]"
                  : "w-11 text-ink hover:bg-ink/8"
              }`}
            >
              <TabIcon name={item.icon} />
              <span className={active ? "text-sm font-semibold tracking-tight" : "sr-only"}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TabIcon({ name }: { name: "home" | "invest" | "settings" }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M4 10.6 12 4l8 6.6V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "invest") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7.2v9.6M9.1 9.5c.6-.9 1.6-1.4 3-1.4 1.8 0 3 .9 3 2.2 0 2.8-6 1.4-6 4 0 1.3 1.2 2.2 3 2.2 1.3 0 2.3-.5 2.9-1.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.2v2.1M12 18.7v2.1M3.2 12h2.1M18.7 12h2.1M5.8 5.8l1.5 1.5M16.7 16.7l1.5 1.5M18.2 5.8l-1.5 1.5M7.3 16.7 5.8 18.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
