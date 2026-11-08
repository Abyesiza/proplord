import { cn } from "@/lib/cn";

/** Columns scaled to the largest value; labels sit underneath. Pure CSS so text stays readable on phones. */
export function ColumnChart({
  data,
  format,
  label,
  labelStep = 1,
}: {
  data: { label: string; value: number }[];
  format: (value: number) => string;
  label: string;
  /** Show every nth axis label, for dense charts such as one column per day. */
  labelStep?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  return (
    <figure role="img" aria-label={`${label}. ${data.map((d) => `${d.label}: ${format(d.value)}`).join(", ")}`}>
      <p className="mb-2 text-xs text-muted-foreground">Highest: {format(max)}</p>
      <div className="flex h-48 items-end gap-1 border-b border-border sm:gap-2" aria-hidden>
        {data.map((d) => (
          <div
            key={d.label}
            title={`${d.label}: ${format(d.value)}`}
            className="flex h-full flex-1 flex-col justify-end"
          >
            <div
              className="w-full rounded-t-md bg-primary"
              style={{ height: max > 0 ? `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%` : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1 sm:gap-2" aria-hidden>
        {data.map((d, i) => (
          <span key={d.label} className="flex-1 text-center text-[10px] text-muted-foreground sm:text-xs">
            {i % labelStep === 0 ? d.label : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

export type Series = { name: string; values: number[]; className: string; dashed?: boolean };

/** Several trend lines on a shared scale. The SVG is stretched, so only strokes are drawn in it. */
export function LineChart({
  labels,
  series,
  label,
  format = String,
  labelStep = 1,
  describe = (s) => `${s.name}: ${s.values.reduce((a, b) => a + b, 0)} in total`,
}: {
  labels: string[];
  series: Series[];
  label: string;
  format?: (value: number) => string;
  labelStep?: number;
  /** Spoken summary of one series; defaults to its total. */
  describe?: (series: Series) => string;
}) {
  const max = Math.max(...series.flatMap((s) => s.values), 1);
  const x = (i: number) => (labels.length > 1 ? (i / (labels.length - 1)) * 100 : 50);
  const y = (v: number) => 38 - (v / max) * 36;

  return (
    <figure role="img" aria-label={`${label}. ${series.map(describe).join(", ")}`}>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        {series.map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <svg width="20" height="6" aria-hidden className={s.className}>
              <line x1="0" y1="3" x2="20" y2="3" stroke="currentColor" strokeWidth="3" strokeDasharray={s.dashed ? "4 3" : undefined} />
            </svg>
            {s.name}
          </li>
        ))}
      </ul>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-48 w-full border-b border-border" aria-hidden>
        {[10, 20, 30].map((line) => (
          <line key={line} x1="0" x2="100" y1={line} y2={line} className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
        {series.map((s) => (
          <polyline
            key={s.name}
            points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={s.dashed ? "6 5" : undefined}
            vectorEffect="non-scaling-stroke"
            className={s.className}
          />
        ))}
      </svg>
      <div className="mt-2 flex" aria-hidden>
        {labels.map((l, i) => (
          <span key={l} className="flex-1 text-center text-[10px] text-muted-foreground sm:text-xs">
            {i % labelStep === 0 ? l : ""}
          </span>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Highest: {format(max)}</p>
    </figure>
  );
}

/** Ranked rows with a bar behind each value. */
export function BarList({
  items,
  className,
}: {
  items: { label: string; value: number; text: string; hint?: string }[];
  className?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold">{item.label}</span>
            <span className="shrink-0 text-muted-foreground">{item.text}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
          {item.hint && <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>}
        </li>
      ))}
    </ul>
  );
}
