"use client";

export type AppTab = "home" | "investments" | "settings";

const TABS: { id: AppTab; label: string; icon: "home" | "invest" | "settings" }[] = [
  { id: "home", label: "Inicio", icon: "home" },
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
      <div className="glass pointer-events-auto relative grid w-full max-w-md grid-cols-3 rounded-full p-1.5 shadow-[0_12px_40px_rgba(26,22,19,0.18)]">
        <span
          aria-hidden="true"
          className="nav-pill pointer-events-none absolute inset-y-1.5 left-1.5 z-0 w-[calc((100%-0.75rem)/3)]"
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
                active ? "gap-1.5 px-2 text-white" : "text-ink hover:bg-ink/8"
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
                className={`overflow-hidden whitespace-nowrap text-xs font-semibold tracking-tight transition-[max-width,opacity,transform] duration-500 ease-[cubic-bezier(0.22,1.4,0.36,1)] ${
                  active ? "max-w-24 translate-x-0 opacity-100" : "max-w-0 -translate-x-2 opacity-0"
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
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.76 6.76 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.93 6.93 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
      />
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}
