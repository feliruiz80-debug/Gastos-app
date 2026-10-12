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
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      aria-label="Barra de tareas"
    >
      <div className="glass pointer-events-auto grid w-full max-w-md grid-cols-3 gap-1 rounded-full p-1.5 shadow-[0_12px_40px_rgba(26,22,19,0.18)]">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? "page" : undefined}
              onClick={() => onChange(item.id)}
              className={`flex h-11 w-full min-w-0 items-center justify-center rounded-full transition-colors duration-200 ${
                active ? "gap-1.5 bg-[#2563eb] px-2 text-white" : "text-ink hover:bg-ink/8"
              }`}
            >
              <TabIcon name={item.icon} />
              <span className={active ? "truncate text-xs font-semibold tracking-tight" : "sr-only"}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function TabIcon({ name }: { name: "home" | "invest" | "settings" }) {
  const common = { width: 22, height: 22, viewBox: "0 0 32 32", fill: "none", "aria-hidden": true as const };
  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M5 14.2 16 5l11 9.2V27a1.4 1.4 0 0 1-1.4 1.4h-6.8v-8.2h-5.6v8.2H6.4A1.4 1.4 0 0 1 5 27V14.2Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
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
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M23.2 16.2a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4Zm.2 2.05v.9c1.15.2 1.9.85 1.9 1.7h-1.45c-.05-.4-.35-.65-.95-.65-.55 0-.9.25-.9.6s.3.55 1.15.75c1.2.28 2.2.75 2.2 1.95 0 .95-.75 1.65-1.9 1.85v.9h-1v-.9c-1.2-.22-2-.95-2.05-1.85h1.45c.05.45.4.7 1 .7.6 0 .95-.25.95-.62 0-.4-.38-.6-1.25-.82-1.15-.28-2.1-.78-2.1-1.9 0-.9.75-1.6 1.9-1.82v-.9h1.05Z"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="16" cy="16" r="3.4" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16 4.2v2.8M16 25v2.8M4.2 16h2.8M25 16h2.8M7.6 7.6l2 2M22.4 22.4l2 2M24.4 7.6l-2 2M9.6 22.4l-2 2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
