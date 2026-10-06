import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { COMMUNITY_COLORS } from './NetworkGraph';
import type { NodeData } from '../types';

const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

interface CommunitySize {
  id: number;
  name: string;
  size: number;
  share: number;
}

interface CommunitySizeChartProps {
  nodes: NodeData[];
  className?: string;
}

const CommunityTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: CommunitySize }>;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  const c = payload[0].payload;
  return (
    <div className="glass-panel rounded-md border border-slate-700/60 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-slate-400 shadow-xl">
      <p>
        community{' '}
        <span style={{ color: COMMUNITY_COLORS[c.id % COMMUNITY_COLORS.length] }}>
          C{c.id}
        </span>
      </p>
      <p>
        members <span className="text-slate-100">{c.size}</span> · {(c.share * 100).toFixed(1)}%
      </p>
    </div>
  );
};

export const CommunitySizeChart: React.FC<CommunitySizeChartProps> = ({ nodes, className }) => {
  const communities = useMemo<CommunitySize[]>(() => {
    const counts = new Map<number, number>();
    nodes.forEach((n) => counts.set(n.community, (counts.get(n.community) ?? 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([id, size]) => ({ id, name: `C${id}`, size, share: size / nodes.length }));
  }, [nodes]);

  if (communities.length === 0) {
    return (
      <section
        className={`glass-panel rounded-xl border border-slate-700/40 flex flex-col overflow-hidden ${className ?? ''}`}
      >
        <header className="px-3.5 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
            Community Sizes
          </h3>
          <span className="font-mono text-[10px] text-slate-500">k = 0</span>
        </header>
        <div className="p-3 min-h-[84px] flex items-center justify-center">
          <p className="font-mono text-[10px] text-slate-500">no data</p>
        </div>
        <footer className="px-3.5 py-2 border-t border-slate-700/30 text-[10px] leading-relaxed text-slate-500">
          membership count
        </footer>
      </section>
    );
  }

  const maxSize = Math.max(...communities.map((c) => c.size));
  const largest = communities.reduce((a, b) => (b.size > a.size ? b : a), communities[0]);
  const rowHeight = 34;

  return (
    <section
      className={`glass-panel rounded-xl border border-slate-700/40 flex flex-col overflow-hidden ${className ?? ''}`}
    >
      <header className="px-3.5 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
          Community Sizes
        </h3>
        <span className="font-mono text-[10px] text-slate-500">k = {communities.length}</span>
      </header>

      <div className="p-3 pb-1">
        <ResponsiveContainer width="100%" height={communities.length * rowHeight + 10}>
          <BarChart data={communities} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 2 }}>
            <XAxis
              type="number"
              hide
              domain={[0, maxSize + Math.max(1, Math.ceil(maxSize * 0.2))]}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={30}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: MONO_FONT }}
            />
            <Tooltip
              content={<CommunityTooltip />}
              cursor={{ fill: 'rgba(148, 163, 184, 0.07)' }}
            />
            <Bar dataKey="size" barSize={13} radius={[0, 2, 2, 0]}>
              {communities.map((c) => (
                <Cell
                  key={c.id}
                  fill={COMMUNITY_COLORS[c.id % COMMUNITY_COLORS.length]}
                  fillOpacity={0.9}
                />
              ))}
              <LabelList
                dataKey="size"
                position="right"
                offset={2}
                style={{ fill: '#cbd5e1', fontSize: 10, fontFamily: MONO_FONT }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <footer className="px-3.5 py-2 border-t border-slate-700/30 text-[10px] leading-relaxed text-slate-500">
        membership count · largest C{largest.id} = {largest.size} nodes (
        {(largest.share * 100).toFixed(1)}%)
      </footer>
    </section>
  );
};
