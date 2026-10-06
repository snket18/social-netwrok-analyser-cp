import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { NodeData } from '../types';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const BIN_WIDTH = 0.1;

export interface StabilityBin {
  label: string;
  range: string;
  lo: number;
  hi: number;
  mid: number;
  count: number;
}

interface StabilityHistogramProps {
  nodes: NodeData[];
  runs: number;
  className?: string;
}

const binColor = (mid: number): string => {
  if (mid < 0.6) return '#f87171';
  if (mid < 0.8) return '#fbbf24';
  return '#34d399';
};

const HistogramTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: StabilityBin }>;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const bin = payload[0].payload;
  return (
    <div className="glass-panel rounded-md border border-slate-700/60 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-slate-400 shadow-xl">
      <p>stability {bin.range}</p>
      <p>
        count <span className="text-slate-100">{bin.count}</span>
      </p>
    </div>
  );
};

const computeDistribution = (
  nodes: NodeData[]
): { bins: StabilityBin[]; mean: number } => {
  const values = nodes.map((n) => n.stability);
  if (values.length === 0) {
    return { bins: [], mean: 0 };
  }
  let lo = Math.floor(Math.min(...values) * 10) / 10;
  let hi = Math.ceil(Math.max(...values) * 10) / 10;
  if (hi <= lo) hi = lo + BIN_WIDTH;
  while (hi - lo < 5 * BIN_WIDTH && lo > 0) {
    lo = Math.max(0, lo - BIN_WIDTH);
  }
  const numBins = Math.round((hi - lo) / BIN_WIDTH);
  const result: StabilityBin[] = Array.from({ length: numBins }, (_, i) => {
    const binLo = lo + i * BIN_WIDTH;
    const binHi = binLo + BIN_WIDTH;
    return {
      label: binLo.toFixed(1),
      range: `[${binLo.toFixed(1)}, ${binHi.toFixed(1)}${i === numBins - 1 ? ']' : ')'}`,
      lo: binLo,
      hi: binHi,
      mid: (binLo + binHi) / 2,
      count: 0,
    };
  });
  values.forEach((v) => {
    const idx = Math.min(numBins - 1, Math.max(0, Math.floor((v - lo) / BIN_WIDTH)));
    result[idx].count += 1;
  });
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  return { bins: result, mean: m };
};

export const StabilityHistogram: React.FC<StabilityHistogramProps> = ({
  nodes,
  runs,
  className,
}) => {
  const { bins, mean } = useMemo(() => computeDistribution(nodes), [nodes]);

  if (nodes.length === 0) {
    return (
      <section
        className={`glass-panel rounded-xl border border-slate-700/40 flex flex-col overflow-hidden ${className ?? ''}`}
      >
        <header className="px-3.5 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
            Stability Distribution
          </h3>
          <span className="font-mono text-[10px] text-slate-500">n = 0</span>
        </header>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <p className="font-mono text-[10px] text-slate-500">no data</p>
        </div>
        <footer className="px-3.5 py-2 border-t border-slate-700/30 text-[10px] leading-relaxed text-slate-500">
          Empirical stability — modal assignment frequency over R = {runs} Louvain runs
        </footer>
      </section>
    );
  }

  const meanBin =
    bins[Math.min(bins.length - 1, Math.max(0, Math.floor((mean - bins[0].lo) / BIN_WIDTH)))];

  return (
    <section
      className={`glass-panel rounded-xl border border-slate-700/40 flex flex-col overflow-hidden ${className ?? ''}`}
    >
      <header className="px-3.5 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
          Stability Distribution
        </h3>
        <span className="font-mono text-[10px] text-slate-500">n = {nodes.length}</span>
      </header>

      <div className="flex-1 min-h-0 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 18, right: 4, bottom: 0, left: -26 }}>
            <CartesianGrid
              vertical={false}
              stroke="rgba(148, 163, 184, 0.12)"
              strokeDasharray="2 4"
            />
            <XAxis
              dataKey="label"
              tick={{ fill: '#64748b', fontSize: 9, fontFamily: MONO_FONT }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.25)' }}
              interval={bins.length > 8 ? 1 : 0}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: '#64748b', fontSize: 9, fontFamily: MONO_FONT }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              content={<HistogramTooltip />}
              cursor={{ fill: 'rgba(148, 163, 184, 0.07)' }}
            />
            <ReferenceLine
              x={meanBin.label}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{
                value: 'μ',
                position: 'top',
                fill: '#94a3b8',
                fontSize: 10,
                fontFamily: MONO_FONT,
              }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={34}>
              {bins.map((bin) => (
                <Cell key={bin.label} fill={binColor(bin.mid)} fillOpacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <footer className="px-3.5 py-2 border-t border-slate-700/30 text-[10px] leading-relaxed text-slate-500">
        Empirical stability — modal assignment frequency over R = {runs} Louvain runs · μ ={' '}
        {mean.toFixed(2)}
      </footer>
    </section>
  );
};
