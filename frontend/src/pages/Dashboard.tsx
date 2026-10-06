import React, { useEffect, useState } from 'react';
import { NetworkGraph } from '../components/NetworkGraph';
import { fetchNetworkData, fetchUserDetails } from '../services/api';
import type { NetworkData, UserDetails } from '../types';
import { Users, Activity, Component, Maximize2, User, AlertTriangle, ShieldCheck, Link as LinkIcon, Share2, X } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Side panel state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  
  // Graph controls
  const [stabilityThreshold, setStabilityThreshold] = useState<number>(0);

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
    <div className="flex h-full animate-fade-in relative overflow-hidden">
      <div className={`p-8 h-full flex flex-col space-y-6 transition-all duration-300 ${selectedUserId ? 'w-[calc(100%-24rem)]' : 'w-full'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Network Overview</h2>
            <p className="text-slate-400">Synthetic Social Network Dataset</p>
          </div>
          
          <div className="flex space-x-2">
            <select defaultValue="synthetic" className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5">
              <option value="synthetic">Synthetic Planted Partition</option>
              <option value="karate">Zachary's Karate Club</option>
            </select>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Nodes / Edges</p>
              <h3 className="text-2xl font-bold text-slate-100">{data.metrics.nodes} / {data.metrics.edges}</h3>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
              <Component size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Communities</p>
              <h3 className="text-2xl font-bold text-slate-100">{data.metrics.communities}</h3>
            </div>
          </div>
          
          <div className="glass-panel p-6 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Modularity</p>
              <h3 className="text-2xl font-bold text-slate-100">{data.metrics.modularity.toFixed(3)}</h3>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl flex items-center space-x-4">
            <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400">
              <Maximize2 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400 font-medium">Louvain Runs</p>
              <h3 className="text-2xl font-bold text-slate-100">{data.metrics.runs}</h3>
            </div>
          </div>
        </div>

        {/* Graph Area */}
        <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col relative">
          <div className="p-4 border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/30 gap-4">
            <div>
              <h3 className="font-medium text-slate-200">Interactive Visualization</h3>
              <div className="flex items-center space-x-4 text-xs mt-2">
                {Array.from({ length: data.metrics.communities }).map((_, i) => {
                  const COMMUNITY_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                  return (
                    <div key={i} className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COMMUNITY_COLORS[i % COMMUNITY_COLORS.length] }}></span>
                      <span className="text-slate-400">Comm {i}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
              <label className="text-xs font-medium text-slate-300">Stability Threshold:</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={stabilityThreshold}
                onChange={(e) => setStabilityThreshold(parseFloat(e.target.value))}
                className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs text-blue-400 font-mono w-8">{stabilityThreshold > 0 ? `>${stabilityThreshold}` : 'Off'}</span>
            </div>
          </div>
          
          <div className="flex-1 p-2 relative">
            <NetworkGraph 
              data={data} 
              onNodeSelect={(id) => setSelectedUserId(id)} 
              selectedNodes={selectedUserId ? [selectedUserId] : []}
              stabilityThreshold={stabilityThreshold}
            />

            {/* Stability Legend Overlay */}
            <div className="absolute bottom-4 left-4 glass-panel p-3 text-xs rounded-lg border border-slate-700/50 space-y-2 z-10 pointer-events-none">
              <p className="text-slate-200 font-medium border-b border-slate-700/50 pb-1 mb-2">Stability Legend</p>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full border border-white bg-slate-400 opacity-100"></div>
                <span className="text-slate-300 font-medium">Highly Stable</span>
                <span className="text-slate-500">(0.8 - 1.0)</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full border border-white bg-slate-400 opacity-70"></div>
                <span className="text-slate-300 font-medium">Moderately Stable</span>
                <span className="text-slate-500">(0.6 - 0.8)</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full border border-slate-400 border-dashed bg-transparent"></div>
                <span className="text-slate-400">Potentially Unstable</span>
                <span className="text-slate-500">(&lt; 0.6)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Panel */}
      <div 
        className={`absolute top-0 right-0 h-full w-96 border-l border-slate-800 bg-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-20 ${selectedUserId ? 'translate-x-0' : 'translate-x-full'}`}
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
              {!userDetails ? (
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

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

