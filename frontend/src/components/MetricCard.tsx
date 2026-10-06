import React from 'react';

interface MetricCardProps {
  label: string;
  notation?: string;
  value: string;
  caption?: string;
  accent: string;
  scale?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  notation,
  value,
  caption,
  accent,
  scale,
}) => {
  const position = scale === undefined ? undefined : Math.min(1, Math.max(0, scale));

  return (
    <div className="glass-panel rounded-lg border border-slate-700/40 px-3.5 py-3 min-h-[92px] flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: accent }}
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 truncate">
            {label}
          </span>
        </div>
        {notation && (
          <span className="font-mono text-[10px] text-slate-500 shrink-0">{notation}</span>
        )}
      </div>

      <div className="mt-1 flex items-baseline gap-2 min-w-0">
        <span className="font-mono text-[22px] leading-none font-semibold tracking-tight text-slate-100">
          {value}
        </span>
        {caption && <span className="text-[10px] text-slate-500 truncate">{caption}</span>}
      </div>

      {position !== undefined ? (
        <div className="mt-auto pt-2.5">
          <div className="relative h-[3px] rounded-full bg-slate-700/50">
            <div
              className="absolute top-1/2 w-2 h-2 rounded-full border border-slate-900 -translate-y-1/2"
              style={{
                left: `calc(${(position * 100).toFixed(1)}% - 4px)`,
                backgroundColor: accent,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-auto" />
      )}
    </div>
  );
};
