type Slice = {
  id: string;
  name: string;
  amount: number;
  color: string;
};

export function DonutChart({ slices, center }: { slices: Slice[]; center: string }) {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let cursor = 0;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[180px_1fr]">
      <div className="relative mx-auto h-44 w-44">
        <svg viewBox="0 0 160 160" className="h-full w-full" role="img" aria-label={slices.map((slice) => `${slice.name} ${slice.amount}`).join(", ")}>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--paper-deep)" strokeWidth="16" />
          {total > 0
            ? slices.map((slice) => {
                const length = (slice.amount / total) * circumference;
                const dash = `${length} ${circumference - length}`;
                const offset = -cursor;
                cursor += length;
                return (
                  <circle
                    key={slice.id}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="16"
                    strokeLinecap="butt"
                    strokeDasharray={dash}
                    strokeDashoffset={offset}
                    transform="rotate(-90 80 80)"
                  />
                );
              })
            : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center">
          <p className="font-display text-lg leading-tight tracking-tight">{center}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {slices.length === 0 ? <li className="text-sm text-muted">Todavía no hay nada para graficar.</li> : null}
        {slices.map((slice) => {
          const percent = total === 0 ? 0 : Math.round((slice.amount / total) * 100);
          return (
            <li key={slice.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                <span className="truncate">{slice.name}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted">{percent}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
