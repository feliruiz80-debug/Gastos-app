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
  // Tuerca clásica (engranaje) para Ajustes.
  return (
    <svg {...common}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M14.2 4.2h3.6l.55 2.05c.55.2 1.07.47 1.54.8l2.05-.7 2.55 2.55-.7 2.05c.33.47.6.99.8 1.54L27.8 14.2v3.6l-2.05.55c-.2.55-.47 1.07-.8 1.54l.7 2.05-2.55 2.55-2.05-.7a7.4 7.4 0 0 1-1.54.8l-.55 2.05h-3.6l-.55-2.05a7.4 7.4 0 0 1-1.54-.8l-2.05.7-2.55-2.55.7-2.05a7.4 7.4 0 0 1-.8-1.54L4.2 17.8v-3.6l2.05-.55c.2-.55.47-1.07.8-1.54l-.7-2.05 2.55-2.55 2.05.7c.47-.33.99-.6 1.54-.8L14.2 4.2Zm1.8 7.2a4.6 4.6 0 1 0 0 9.2 4.6 4.6 0 0 0 0-9.2Zm0 2.4a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
