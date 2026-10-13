"use client";

export type AppTab = "home" | "fixed" | "investments" | "settings";

const TABS: { id: AppTab; label: string; icon: "home" | "fixed" | "invest" | "settings" }[] = [
  { id: "home", label: "Inicio", icon: "home" },
  { id: "fixed", label: "Fijos", icon: "fixed" },
  { id: "investments", label: "Inversiones", icon: "invest" },
  { id: "settings", label: "Ajustes", icon: "settings" },
];

export function BottomNav({ tab, onChange }: { tab: AppTab; onChange: (tab: AppTab) => void }) {
  const activeIndex = Math.max(
    0,
    TABS.findIndex((item) => item.id === tab),
  );

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label="Barra de tareas"
    >
      <div className="glass pointer-events-auto relative grid w-full max-w-lg grid-cols-4 rounded-full p-1.5 shadow-[0_12px_40px_rgba(26,22,19,0.18)]">
        <span
          aria-hidden="true"
          className="nav-pill pointer-events-none absolute inset-y-1.5 left-1.5 z-0 w-[calc((100%-0.75rem)/4)]"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        >
          <span key={tab} className="nav-pill-face absolute inset-0 rounded-full bg-[#2563eb] shadow-[0_8px_22px_rgba(37,99,235,0.45)]" />
        </span>
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`relative z-10 flex h-11 w-full min-w-0 items-center justify-center rounded-full transition-colors duration-500 ${
                active ? "gap-1 px-1.5 text-white" : "text-ink hover:bg-ink/8"
              }`}
            >
              <span
                className={`inline-flex transition-transform duration-500 ease-[cubic-bezier(0.22,1.6,0.36,1)] ${
                  active ? "scale-110" : "scale-100"
                }`}
              >
                <TabIcon name={item.icon} />
              </span>
              <span
                className={`overflow-hidden whitespace-nowrap text-[11px] font-semibold tracking-tight transition-[max-width,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1.4,0.36,1)] ${
                  active ? "max-w-20 translate-x-0 opacity-100" : "max-w-0 -translate-x-2 opacity-0"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TabIcon({ name }: { name: "home" | "fixed" | "invest" | "settings" }) {
  const common = { width: 22, height: 22, viewBox: "0 0 32 32", fill: "none", "aria-hidden": true as const };
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M5 14.2 16 5l11 9.2V27a1.4 1.4 0 0 1-1.4 1.4h-6.8v-8.2h-5.6v8.2H6.4A1.4 1.4 0 0 1 5 27V14.2Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "fixed") {
    return (
      <svg {...common}>
        <rect x="6" y="5" width="20" height="22" rx="3.2" stroke="currentColor" strokeWidth="2.2" />
        <path d="M6 11.5h20" stroke="currentColor" strokeWidth="2.2" />
        <path d="M11 5v4.2M21 5v4.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M11 17h6M11 21.5h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "invest") {
    return (
      <svg {...common}>
        <path d="M4 4v22h24" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <path fill="currentColor" d="M7 19.2h3V24H7v-4.8Zm4.4-3.4h3V24h-3v-8.2Zm4.4-3.2h3V24h-3V12.6Z" />
        <path d="M8 21.2 13.2 15l3.6 2.4 7-7.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.6 9.2H24v4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // Tuerca de Ajustes: engranaje centrado (6 dientes) con el mismo trazo que el resto.
  return (
    <svg {...common}>
      <path
        d="M13.38 8.23 13.79 5.02h4.42l.41 3.21 2.8 1.62 2.98-1.26 2.22 3.84-2.58 1.95v3.24l2.58 1.95-2.22 3.84-2.98-1.26-2.8 1.62-.41 3.21h-4.42l-.41-3.21-2.8-1.62-2.98 1.26-2.22-3.84 2.58-1.95v-3.24L5.38 12.43l2.22-3.84 2.98 1.26 2.8-1.62Z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3.5" stroke="currentColor" strokeWidth="2.1" />
    </svg>
  );
}
