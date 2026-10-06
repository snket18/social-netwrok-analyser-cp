import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NetworkGraph, COMMUNITY_COLORS } from '../components/NetworkGraph';
import { MetricCard } from '../components/MetricCard';
import { StabilityHistogram } from '../components/StabilityHistogram';
import { CommunitySizeChart } from '../components/CommunitySizeChart';
import {
  API_URL,
  apiService,
  enableMockMode,
  isMockForced,
} from '../services/api';
import type { NetworkData, UserDetails } from '../types';
import { User, AlertTriangle, ShieldCheck, Link as LinkIcon, Activity, X } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('api');

  // Side panel state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userDetailsError, setUserDetailsError] = useState(false);

  // Graph controls
  const [stabilityThreshold, setStabilityThreshold] = useState<number>(0);

  const loadData = useCallback(async (useMock = false) => {
    if (useMock) {
      enableMockMode();
    }
    setLoading(true);
    setLoadError(null);
    try {
      const networkData = await apiService.getNetworkData('synthetic', {
        mockFallback: false,
      });
      setData(networkData);
      setDataSource(isMockForced() ? 'mock' : 'api');
    } catch (error) {
      console.error('Failed to load network data', error);
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
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedUserId) {
      setUserDetails(null);
      setUserDetailsError(false);
      return;
    }

    const loadUserDetails = async () => {
      try {
        const details = await apiService.getUserDetails(selectedUserId, {
          mockFallback: false,
        });
        setUserDetails(details);
        setUserDetailsError(false);
      } catch (error) {
        console.error('Failed to load user details', error);
        setUserDetails(null);
        setUserDetailsError(true);
      }
    };
    loadUserDetails();
  }, [selectedUserId]);

  const density = useMemo(() => {
    if (!data) return 0;
    const n = data.metrics.nodes;
    return n > 1 ? (2 * data.metrics.edges) / (n * (n - 1)) : 0;
  }, [data]);

  const nodes = useMemo(() => data?.nodes.map((n) => n.data) ?? [], [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          <p className="text-sm">Loading network data…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full w-full p-6">
        <div className="max-w-md w-full glass-panel rounded-xl border border-slate-700/40 p-8 text-center space-y-5 animate-fade-in">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle size={22} className="text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold text-white">
              Network data unavailable
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The FastAPI backend could not be reached at{' '}
              <span className="font-mono text-slate-300">
                {API_URL}/network
              </span>
              . Check that the backend server is running.
            </p>
            <p className="font-mono text-[10px] text-slate-500 break-all">
              {loadError}
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => loadData(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Use mock data
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { metrics } = data;

  return (
    <div className="flex h-full animate-fade-in relative overflow-hidden">
      <div
        className={`h-full flex flex-col min-w-0 transition-all duration-300 ${
          selectedUserId ? 'w-[calc(100%-24rem)]' : 'w-full'
        }`}
      >
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5 min-h-full">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-white">
                  Network Overview
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-2 font-mono text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded border border-slate-700/60 bg-slate-800/40">
                    planted-partition model
                  </span>
                  <span className="px-1.5 py-0.5 rounded border border-slate-700/60 bg-slate-800/40">
                    n = {metrics.nodes}
                  </span>
                  <span className="px-1.5 py-0.5 rounded border border-slate-700/60 bg-slate-800/40">
                    k = {metrics.communities}
                  </span>
                  <span className="px-1.5 py-0.5 rounded border border-slate-700/60 bg-slate-800/40">
                    R = {metrics.runs}
                  </span>
                  {dataSource === 'mock' && (
                    <span className="px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-400">
                      mock data
                    </span>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <select
                  defaultValue="synthetic"
                  className="bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 px-2.5 py-1.5 font-mono"
                >
                  <option value="synthetic">planted-partition (synthetic)</option>
                  <option value="karate">karate club</option>
                </select>
              </div>
            </div>

            {/* Metric readouts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
              <MetricCard
                label="Nodes"
                notation="|V|"
                value={String(metrics.nodes)}
                caption="vertices"
                accent="#38bdf8"
              />
              <MetricCard
                label="Edges"
                notation="|E|"
                value={String(metrics.edges)}
                caption={`ρ = ${density.toFixed(3)}`}
                accent="#2dd4bf"
              />
              <MetricCard
                label="Communities"
                notation="k"
                value={String(metrics.communities)}
                caption="detected"
                accent="#a78bfa"
              />
              <MetricCard
                label="Modularity"
                notation="Q"
                value={metrics.modularity.toFixed(3)}
                caption="Newman"
                accent="#34d399"
                scale={metrics.modularity}
              />
              <MetricCard
                label="ARI"
                notation="ARI"
                value={metrics.ari.toFixed(3)}
                caption="vs. ground truth"
                accent="#fbbf24"
                scale={metrics.ari}
              />
              <MetricCard
                label="NMI"
                notation="NMI"
                value={metrics.nmi.toFixed(3)}
                caption="vs. ground truth"
                accent="#fb7185"
                scale={metrics.nmi}
              />
              <MetricCard
                label="Louvain Runs"
                notation="R"
                value={String(metrics.runs)}
                caption="repetitions"
                accent="#94a3b8"
              />
            </div>

            {/* Main row: graph + analysis rail */}
            <div className="flex flex-col lg:flex-row gap-4 lg:flex-1 lg:min-h-0">
              {/* Network graph — primary visual */}
              <div className="h-[440px] lg:h-auto lg:flex-1 min-w-0 glass-panel rounded-xl border border-slate-700/40 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/40 bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                      Network Topology
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {Array.from({ length: metrics.communities }).map((_, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: COMMUNITY_COLORS[i % COMMUNITY_COLORS.length],
                            }}
                          ></span>
                          <span className="font-mono text-[10px] text-slate-400">
                            C{i}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
                    <label
                      htmlFor="stability-threshold"
                      className="text-[10px] font-medium text-slate-400 uppercase tracking-wider"
                    >
                      Stability ≥
                    </label>
                    <input
                      id="stability-threshold"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={stabilityThreshold}
                      onChange={(e) => setStabilityThreshold(parseFloat(e.target.value))}
                      className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="font-mono text-[10px] text-emerald-400 w-9">
                      {stabilityThreshold > 0 ? stabilityThreshold.toFixed(1) : 'off'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 relative min-h-0 dot-grid">
                  <NetworkGraph
                    data={data}
                    onNodeSelect={(id) => setSelectedUserId(id)}
                    selectedNodes={selectedUserId ? [selectedUserId] : []}
                    stabilityThreshold={stabilityThreshold}
                  />

                  {/* Figure annotation */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none font-mono text-[10px] leading-relaxed text-slate-500 bg-slate-900/70 border border-slate-700/40 rounded px-2 py-1.5 backdrop-blur-sm">
                    <p>layout: cose · force-directed</p>
                    <p>
                      |V| = {metrics.nodes} · |E| = {metrics.edges}
                    </p>
                  </div>

                  {/* Stability legend */}
                  <div className="absolute bottom-4 left-4 z-10 pointer-events-none glass-panel rounded-md border border-slate-700/50 px-3 py-2.5 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300 border-b border-slate-700/50 pb-1.5 mb-1.5">
                      Node Stability
                    </p>

                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border border-white/70 bg-slate-400"></div>
                      <span className="text-[10px] text-slate-400">high</span>
                      <span className="font-mono text-[10px] text-slate-500">[0.8, 1.0]</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border border-white/70 bg-slate-400 opacity-60"></div>
                      <span className="text-[10px] text-slate-400">moderate</span>
                      <span className="font-mono text-[10px] text-slate-500">[0.6, 0.8)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border border-slate-400 border-dashed bg-transparent"></div>
                      <span className="text-[10px] text-slate-400">unstable</span>
                      <span className="font-mono text-[10px] text-slate-500">&lt; 0.6</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis rail */}
              <aside className="w-full lg:w-[300px] shrink-0 flex flex-col gap-4 min-w-0">
                <div className="flex-1 min-h-[240px]">
                  <StabilityHistogram nodes={nodes} runs={metrics.runs} className="h-full" />
                </div>
                <CommunitySizeChart nodes={nodes} />
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Panel */}
      <div
        className={`absolute top-0 right-0 h-full w-96 border-l border-slate-800 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-20 ${
          selectedUserId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedUserId && (
          <div className="h-full flex flex-col relative">
            <button
              onClick={() => setSelectedUserId(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-30"
            >
              <X size={20} />
            </button>

            <div className="p-6 overflow-y-auto flex-1">
              {userDetailsError ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <AlertTriangle size={28} className="opacity-40" />
                  <p className="text-sm">Failed to load node details</p>
                  <p className="font-mono text-[10px] text-slate-600">
                    the API returned an error
                  </p>
                </div>
              ) : !userDetails ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p>Loading details...</p>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in mt-4">
                  {/* Header */}
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{userDetails.label}</h3>
                        <p className="text-sm text-slate-400">ID: {userDetails.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-medium border border-slate-700">
                        Community {userDetails.community}
                      </span>
                    </div>
                  </div>

                  {/* Stability Analysis */}
                  <div className="glass-panel p-4 rounded-xl space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center">
                      <ShieldCheck size={16} className="mr-2 text-blue-400" />
                      Community Stability
                    </h4>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Empirical Stability Score</span>
                        <span className="text-white font-medium">
                          {(userDetails.stability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            userDetails.stability > 0.8
                              ? 'bg-emerald-500'
                              : userDetails.stability > 0.5
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${userDetails.stability * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Consistency across repeated Louvain algorithm runs.
                      </p>
                    </div>

                    {userDetails.alternativeCommunity !== undefined && (
                      <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <h4 className="text-xs font-semibold text-slate-400 flex items-center mb-2">
                          <AlertTriangle size={14} className="mr-1 text-amber-400" />
                          Alternative Assignment
                        </h4>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">
                            Community {userDetails.alternativeCommunity}
                          </span>
                          <span className="text-amber-400 font-medium">
                            {((userDetails.alternativeScore || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Centrality Metrics */}
                  <div className="glass-panel p-4 rounded-xl space-y-4">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center">
                      <Activity size={16} className="mr-2 text-purple-400" />
                      Network Metrics
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-400">Degree</p>
                        <p className="text-lg font-bold text-white">{userDetails.degree}</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-slate-400">Betweenness</p>
                        <p className="text-lg font-bold text-white">
                          {userDetails.betweenness.toFixed(3)}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 col-span-2">
                        <p className="text-xs text-slate-400">Closeness Centrality</p>
                        <p className="text-lg font-bold text-white">
                          {userDetails.closeness.toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connections */}
                  <div className="glass-panel p-4 rounded-xl space-y-3">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center">
                      <LinkIcon size={16} className="mr-2 text-emerald-400" />
                      Direct Connections
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                      {userDetails.connectedUsers.map((conn) => (
                        <div
                          key={conn.id}
                          className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded border border-slate-700/30"
                        >
                          <span className="text-slate-300">Node {conn.id}</span>
                          <span className="text-xs text-slate-500">Weight: {conn.weight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
