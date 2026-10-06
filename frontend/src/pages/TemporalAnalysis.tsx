import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { Clock, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { apiService, enableMockMode } from '../services/api';
import type { TemporalEvent, TemporalPathAnalysis } from '../types';

const EVENT_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

export const TemporalAnalysis: React.FC = () => {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TemporalPathAnalysis | null>(null);

  const load = useCallback(async (useMock = false) => {
    if (useMock) {
      enableMockMode();
    }
    setLoading(true);
    setLoadError(null);
    try {
      // The backend selects a deterministic default pair when no IDs are given.
      const result = await apiService.analyzeTemporalPath(undefined, undefined, {
        mockFallback: false,
      });
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to load temporal analysis', error);
      setLoadError(
        error instanceof Error && error.message
          ? error.message
          : 'The FastAPI backend could not be reached.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const events = useMemo(() => analysis?.events ?? [], [analysis]);

  const elements = useMemo(
    () =>
      CytoscapeComponent.normalizeElements({
        nodes: Array.from(new Set(events.flatMap((e) => [e.source, e.target])))
          .sort()
          .map((id) => ({ data: { id, label: id } })),
        edges: events.map((e) => ({
          data: {
            source: e.source,
            target: e.target,
            label: `t = ${e.timestamp}`,
            timestamp: e.timestamp,
          },
        })),
      }),
    [events]
  );

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  }, [elements]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col h-full p-8 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white">
            Temporal Path Analysis
          </h2>
          <p className="text-slate-400">
            A demonstration of static paths versus time-respecting paths
          </p>
        </div>
        <div className="flex-1 glass-panel rounded-xl flex flex-col items-center justify-center text-slate-500 space-y-4">
          <AlertTriangle size={32} className="opacity-40" />
          <p className="text-sm">{loadError}</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => load()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => load(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Use mock data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col h-full p-8 animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white">
            Temporal Path Analysis
          </h2>
          <p className="text-slate-400">
            A demonstration of static paths versus time-respecting paths
          </p>
        </div>
        <div className="flex-1 glass-panel rounded-xl flex items-center justify-center">
          <div className="text-center text-slate-500 space-y-2">
            <Clock size={32} className="opacity-30 mx-auto" />
            <p className="text-sm">No temporal event data available</p>
            <p className="font-mono text-[10px] text-slate-600">
              the API returned an empty response
            </p>
          </div>
        </div>
      </div>
    );
  }

  const eventByPair = new Map<string, TemporalEvent>();
  for (const event of events) {
    eventByPair.set([event.source, event.target].sort().join('-'), event);
  }

  const hopTimestamp = (from: string, to: string): number | undefined =>
    eventByPair.get([from, to].sort().join('-'))?.timestamp;

  const hopTimes = (path: string[]): (number | undefined)[] =>
    path.slice(0, -1).map((node, i) => hopTimestamp(node, path[i + 1]));

  const formatTimes = (times: (number | undefined)[]) =>
    times.map((t) => (t === undefined ? '?' : `t = ${t}`)).join(' → ');

  const timestamps = events.map((e) => e.timestamp);
  const minT = Math.min(...timestamps);
  const maxT = Math.max(...timestamps);
  const span = Math.max(1, maxT - minT);

  const staticValid = (analysis?.staticPath.length ?? 0) > 0;
  const respectingValid = analysis?.isTimeRespecting ?? false;

  const staticHopTimes = analysis ? hopTimes(analysis.staticPath) : [];
  const respectingHopTimes = analysis ? hopTimes(analysis.timeRespectingPath) : [];

  const renderPath = (path: string[]) => (
    <>
      {path.map((node, i) => (
        <React.Fragment key={`${node}-${i}`}>
          {i > 0 && <ArrowRight size={18} className="mx-2 text-slate-500" />}
          {node}
        </React.Fragment>
      ))}
    </>
  );

  return (
    <div className="flex flex-col h-full p-8 animate-fade-in space-y-6 overflow-auto">
      <div>
        <h2 className="text-2xl font-semibold text-white">Temporal Path Analysis</h2>
        <p className="text-slate-400">
          A demonstration of static paths versus time-respecting paths
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Graph */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden min-h-[320px]">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center space-x-2">
            <Clock size={18} className="text-blue-400" />
            <h3 className="font-medium text-slate-200">
              Static path:{' '}
              {analysis && staticValid ? renderPath(analysis.staticPath) : 'none'}
            </h3>
          </div>
          <div className="flex-1 min-h-[260px]">
            <CytoscapeComponent
              elements={elements}
              style={{ width: '100%', height: '100%', minHeight: 260 }}
              stylesheet={[
                {
                  selector: 'node',
                  style: {
                    label: 'data(label)',
                    'background-color': '#3b82f6',
                    color: '#f8fafc',
                    'text-valign': 'bottom',
                    'text-margin-y': 10,
                    'font-size': '16px',
                    'font-weight': 600,
                    width: 48,
                    height: 48,
                  },
                },
                {
                  selector: 'edge',
                  style: {
                    width: 3,
                    'line-color': '#94a3b8',
                    'target-arrow-color': '#94a3b8',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    label: 'data(label)',
                    'font-size': '13px',
                    color: '#f1f5f9',
                    'text-background-opacity': 1,
                    'text-background-color': '#1e293b',
                    'text-background-padding': '6px',
                    'text-background-shape': 'roundrectangle',
                  },
                },
              ]}
              layout={{
                name: 'grid',
                rows: 1,
                padding: 60,
              }}
              cy={(cy) => {
                cyRef.current = cy;
                cy.userZoomingEnabled(false);
                cy.userPanningEnabled(false);
              }}
            />
          </div>
          <div className="px-4 py-3 border-t border-slate-700/50 text-xs text-slate-400 flex gap-6 flex-wrap">
            {events.map((event, i) => (
              <span key={`${event.source}-${event.target}-${event.timestamp}`}>
                {event.source}–{event.target} timestamp ={' '}
                <span
                  className="font-mono"
                  style={{ color: EVENT_COLORS[i % EVENT_COLORS.length] }}
                >
                  {event.timestamp}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden min-h-[320px]">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center space-x-2">
            <Clock size={18} className="text-amber-400" />
            <h3 className="font-medium text-slate-200">Interaction timeline</h3>
          </div>
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center gap-8">
            <div className="relative h-16 mx-8">
              <div className="absolute left-0 right-0 top-8 h-0.5 bg-slate-600" />
              <div
                className="absolute top-8 h-0.5 bg-gradient-to-r from-amber-400 to-blue-400"
                style={{ left: '14%', width: '72%' }}
              />
              {events.map((event, i) => {
                const left = `${14 + ((event.timestamp - minT) / span) * 72}%`;
                return (
                  <div
                    key={`${event.source}-${event.target}-${event.timestamp}`}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left, transform: 'translateX(-50%)' }}
                  >
                    <span className="text-xs font-mono text-slate-400 mb-1.5 whitespace-nowrap">
                      t = {event.timestamp}
                    </span>
                    <div
                      className="w-4 h-4 rounded-full border-2 border-slate-900 z-10"
                      style={{
                        backgroundColor: EVENT_COLORS[i % EVENT_COLORS.length],
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {events.map((event) => (
                <div
                  key={`${event.source}-${event.target}-${event.timestamp}`}
                  className="rounded-lg bg-slate-800/60 border border-slate-700/50 px-4 py-3"
                >
                  <p className="text-sm font-medium text-white">
                    {event.source} → {event.target}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    timestamp {event.timestamp}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {respectingValid
                ? `The interactions along the time-respecting path occur at ${formatTimes(respectingHopTimes)} — a non-decreasing sequence, so information could flow from ${analysis?.source} to ${analysis?.target}.`
                : staticValid
                  ? `The static path traverses edges at ${formatTimes(staticHopTimes)}. The timestamps are not non-decreasing, so the walk is not time-respecting even though every edge exists.`
                  : 'No path connects the selected nodes, so no sequence of interactions can carry information between them.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-xl p-6 border border-emerald-500/20">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">Static path</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium text-white flex items-center">
              {staticValid && analysis ? renderPath(analysis.staticPath) : 'none'}
            </p>
            <span
              className={`text-2xl font-semibold leading-none ${
                staticValid ? 'text-emerald-400' : 'text-red-400'
              }`}
              aria-label={staticValid ? 'valid' : 'invalid'}
            >
              {staticValid ? '✓' : '✗'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-3">
            Ignoring time, the edges form a path of length{' '}
            <span className="font-mono">{analysis?.staticPathLength ?? '—'}</span> from{' '}
            {analysis?.source ?? '—'} to {analysis?.target ?? '—'}.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6 border border-red-500/20">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">Time-respecting path</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium text-white flex items-center">
              {respectingValid && analysis
                ? renderPath(analysis.timeRespectingPath)
                : 'none'}
            </p>
            <span
              className={`text-2xl font-semibold leading-none ${
                respectingValid ? 'text-emerald-400' : 'text-red-400'
              }`}
              aria-label={respectingValid ? 'valid' : 'invalid'}
            >
              {respectingValid ? '✓' : '✗'}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-3">
            {respectingValid
              ? `The timestamps (${formatTimes(respectingHopTimes)}) are non-decreasing, so the walk is time-respecting.`
              : staticValid
                ? `The static path's timestamps (${formatTimes(staticHopTimes)}) are not non-decreasing, so no time-respecting walk follows that order.`
                : 'No time-respecting path exists between the selected nodes.'}
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-6 space-y-3">
        <p className="text-slate-200 leading-relaxed">
          {!staticValid
            ? 'No path exists between the selected nodes in the static graph.'
            : respectingValid
              ? 'The chronological order of interactions preserves the path, so a time-respecting walk exists between the two nodes.'
              : 'The static graph contains the path, but the chronological order of interactions makes the path invalid.'}
        </p>
        <div className="flex items-start gap-3 text-sm text-slate-400 pt-2 border-t border-slate-700/50">
          <AlertCircle size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
          <p>
            A time-respecting path is only a statement about edge order. Finding a valid path does
            not prove influence, information flow, or causation between nodes.
          </p>
        </div>
      </div>
    </div>
  );
};
