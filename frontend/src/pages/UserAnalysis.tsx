import React, { useEffect, useState } from 'react';
import { fetchNetworkData, fetchUserDetails } from '../services/api';
import type { NetworkData, UserDetails } from '../types';
import { NetworkGraph } from '../components/NetworkGraph';
import { User, Activity, AlertTriangle, ShieldCheck, Link as LinkIcon, Share2 } from 'lucide-react';

export const UserAnalysis: React.FC = () => {
  const [data, setData] = useState<NetworkData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const networkData = await fetchNetworkData();
        setData(networkData);
      } catch (error) {
        console.error('Failed to load network data', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      setUserDetails(null);
      return;
    }

    const loadUserDetails = async () => {
      try {
        const details = await fetchUserDetails(selectedUserId);
        setUserDetails(details);
      } catch (error) {
        console.error('Failed to load user details', error);
      }
    };
    loadUserDetails();
  }, [selectedUserId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
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
        {!userDetails ? (
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
                  <span className="text-white font-medium">{(userDetails.stability * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${userDetails.stability > 0.8 ? 'bg-emerald-500' : userDetails.stability > 0.5 ? 'bg-amber-500' : 'bg-red-500'}`} 
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
                    <span className="text-slate-300">Community {userDetails.alternativeCommunity}</span>
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
                  <p className="text-lg font-bold text-white">{userDetails.betweenness.toFixed(3)}</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 col-span-2">
                  <p className="text-xs text-slate-400">Closeness Centrality</p>
                  <p className="text-lg font-bold text-white">{userDetails.closeness.toFixed(3)}</p>
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
                  <div key={conn.id} className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded border border-slate-700/30">
                    <span className="text-slate-300">Node {conn.id}</span>
                    <span className="text-xs text-slate-500">Weight: {conn.weight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested */}
            <div className="glass-panel p-4 rounded-xl space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center">
                <Share2 size={16} className="mr-2 text-indigo-400" />
                Suggested Connections
              </h4>
              <div className="space-y-2">
                {userDetails.suggestedConnections.map((conn) => (
                  <div key={conn.id} className="flex justify-between items-center text-sm p-2 bg-slate-800/50 rounded border border-slate-700/30">
                    <span className="text-slate-300">Node {conn.id}</span>
                    <span className="text-xs text-indigo-400">Jaccard: {conn.jaccard.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
