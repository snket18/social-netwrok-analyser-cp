import React, { useCallback, useEffect, useState } from 'react';
import { apiService, API_URL, enableMockMode } from '../services/api';
import type { NetworkData, UserDetails } from '../types';
import { NetworkGraph } from '../components/NetworkGraph';
import { User, Users, Activity, AlertTriangle, ShieldCheck, Link as LinkIcon, Share2 } from 'lucide-react';

const NotAvailable = ({ hint }: { hint?: string }) => (
  <span className="text-slate-500">
    Not available{hint ? ` — ${hint}` : ''}
  </span>
);

export const UserAnalysis: React.FC = () => {
  const [data, setData] = useState<NetworkData | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState(false);
  const [detailsRetryNonce, setDetailsRetryNonce] = useState(0);

  const loadData = useCallback(async (useMock = false) => {
    if (useMock) {
      enableMockMode();
    }
    setLoading(true);
    setPageError(null);
    try {
      const networkData = await apiService.getNetworkData('synthetic', {
        mockFallback: false,
      });
      setData(networkData);
    } catch (error) {
      console.error('Failed to load network data', error);
      setPageError(
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
      setUserDetailsLoading(false);
      return;
    }

    let ignore = false;
    setUserDetailsLoading(true);
    setUserDetailsError(false);

    const loadUserDetails = async () => {
      try {
        const details = await apiService.getUserDetails(selectedUserId, {
          mockFallback: false,
        });
        if (ignore) return;
        setUserDetails(details);
      } catch (error) {
        console.error('Failed to load user details', error);
        if (ignore) return;
        setUserDetails(null);
        setUserDetailsError(true);
      } finally {
        if (!ignore) {
          setUserDetailsLoading(false);
        }
      }
    };
    loadUserDetails();

    return () => {
      ignore = true;
    };
  }, [selectedUserId, detailsRetryNonce]);

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

  if (pageError) {
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
              <span className="font-mono text-slate-300">{API_URL}/network</span>
              . Check that the backend server is running.
            </p>
            <p className="font-mono text-[10px] text-slate-500 break-all">
              {pageError}
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

  return (
    <div className="flex h-full animate-fade-in">
      {/* Left Panel: Graph */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-white">User Analysis</h2>
          <p className="text-slate-400">Select a node to view detailed metrics and stability</p>
        </div>

        <div className="flex-1 glass-panel rounded-xl overflow-hidden">
          <NetworkGraph
            data={data}
            onNodeSelect={(id) => setSelectedUserId(id)}
            selectedNodes={selectedUserId ? [selectedUserId] : []}
          />
        </div>
      </div>

      {/* Right Panel: Details */}
      <div className="w-96 border-l border-slate-800 bg-slate-900/80 p-6 overflow-y-auto">
        {userDetailsLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p>Loading node details…</p>
          </div>
        ) : userDetailsError ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <AlertTriangle size={48} className="opacity-20" />
            <p className="text-center">
              Failed to load node details
              <br />
              <span className="font-mono text-[10px] text-slate-600">
                GET {API_URL}/users/{selectedUserId}
              </span>
            </p>
            <button
              onClick={() => setDetailsRetryNonce((n) => n + 1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !userDetails ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <User size={48} className="opacity-20" />
            <p>Select a node to analyze</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{userDetails.label}</h3>
                  <p className="text-sm text-slate-400">User ID: {userDetails.id}</p>
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

              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 flex items-center mb-1">
                  <AlertTriangle size={14} className="mr-1 text-amber-400" />
                  Alternative Assignment
                </h4>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Alternative Community</span>
                  {userDetails.alternativeCommunity !== undefined ? (
                    <span className="text-slate-200 font-medium">
                      Community {userDetails.alternativeCommunity}
                    </span>
                  ) : (
                    <NotAvailable />
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Alternative Score</span>
                  {userDetails.alternativeScore !== undefined ? (
                    <span className="text-amber-400 font-medium">
                      {(userDetails.alternativeScore * 100).toFixed(1)}%
                    </span>
                  ) : (
                    <NotAvailable />
                  )}
                </div>
              </div>
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
                  <p className="text-xs text-slate-400">Betweenness Centrality</p>
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
                Direct Connections ({userDetails.connectedUsers.length})
              </h4>
              {userDetails.connectedUsers.length === 0 ? (
                <p className="text-xs text-slate-500">No connections reported.</p>
              ) : (
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
              )}
            </div>

            {/* Mutual Friends */}
            <div className="glass-panel p-4 rounded-xl space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center">
                <Users size={16} className="mr-2 text-amber-400" />
                Mutual Friends
              </h4>
              <NotAvailable hint="computed pairwise in the Relationship Analysis view" />
            </div>

            {/* Suggested */}
            <div className="glass-panel p-4 rounded-xl space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center">
                <Share2 size={16} className="mr-2 text-indigo-400" />
                Suggested Connections
              </h4>
              {userDetails.suggestedConnections.length === 0 ? (
                <p className="text-xs text-slate-500">No suggestions available.</p>
              ) : (
                <div className="space-y-2">
                  {userDetails.suggestedConnections.map((conn) => (
                    <div
                      key={conn.id}
                      className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded border border-slate-700/30"
                    >
                      <span className="text-slate-300">Node {conn.id}</span>
                      <span className="text-xs text-indigo-400">
                        Jaccard: {conn.jaccard.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
