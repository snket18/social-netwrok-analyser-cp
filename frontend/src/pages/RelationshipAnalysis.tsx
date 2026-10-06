import React, { useEffect, useState } from 'react';
import { fetchNetworkData, analyzeRelationship } from '../services/api';
import type { NetworkData, RelationshipAnalysis as RelAnalysisType } from '../types';
import { NetworkGraph } from '../components/NetworkGraph';
import { Route, Users, Navigation, Link as LinkIcon } from 'lucide-react';

export const RelationshipAnalysis: React.FC = () => {
  const [data, setData] = useState<NetworkData | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<RelAnalysisType | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

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
    if (selectedNodes.length === 2) {
      const performAnalysis = async () => {
        setAnalyzing(true);
        try {
          const result = await analyzeRelationship(selectedNodes[0], selectedNodes[1]);
          setAnalysis(result);
        } catch (error) {
          console.error('Analysis failed', error);
        } finally {
          setAnalyzing(false);
        }
      };
      performAnalysis();
    } else {
      setAnalysis(null);
    }
  }, [selectedNodes]);

  const handleNodeSelect = (nodeId: string | null) => {
    if (!nodeId) return;

    setSelectedNodes(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      }
      if (prev.length >= 2) {
        return [prev[1], nodeId]; // Keep the last selected and add the new one
      }
      return [...prev, nodeId];
    });
  };

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
        <div className="mb-4 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-semibold text-white">Relationship Analysis</h2>
            <p className="text-slate-400">Select exactly two nodes to analyze their relationship</p>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setSelectedNodes([])}
              className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
        
        <div className="flex-1 glass-panel rounded-xl overflow-hidden relative">
          {/* Selection indicator */}
          <div className="absolute top-4 left-4 z-10 flex space-x-2">
            {[0, 1].map(index => (
              <div 
                key={index} 
                className={`px-3 py-1 rounded text-sm font-medium border ${
                  selectedNodes[index] 
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-500'
                }`}
              >
                {selectedNodes[index] ? `Node ${selectedNodes[index]}` : `Select Node ${index + 1}`}
              </div>
            ))}
          </div>

          <NetworkGraph 
            data={data} 
            onNodeSelect={handleNodeSelect}
            selectedNodes={selectedNodes}
            highlightedPath={analysis?.shortestPath || []}
          />
        </div>
      </div>

      {/* Right Panel: Analysis Results */}
      <div className="w-96 border-l border-slate-800 bg-slate-900/80 p-6 overflow-y-auto">
        {selectedNodes.length < 2 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <Route size={48} className="opacity-20" />
            <p className="text-center">
              Select two nodes on the graph<br/>to begin analysis
            </p>
          </div>
        ) : analyzing ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p>Computing paths and metrics...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Analysis Results</h3>
              <p className="text-sm text-slate-400">Between Node {analysis.source} and Node {analysis.target}</p>
            </div>

            {/* Path Analysis */}
            <div className="glass-panel p-4 rounded-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center">
                <Navigation size={16} className="mr-2 text-amber-400" />
                Shortest Path
              </h4>
              
              <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-slate-400">Path Length (Hops)</span>
                  <span className="text-lg font-bold text-white">{analysis.shortestPathLength}</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {analysis.shortestPath.map((node, i) => (
                    <React.Fragment key={i}>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        i === 0 || i === analysis.shortestPath.length - 1 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {node}
                      </span>
                      {i < analysis.shortestPath.length - 1 && (
                        <span className="text-slate-500 text-xs">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Similarity Metrics */}
            <div className="glass-panel p-4 rounded-xl space-y-4">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center">
                <LinkIcon size={16} className="mr-2 text-emerald-400" />
                Similarity Metrics
              </h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Jaccard Similarity</span>
                    <span className="text-white font-medium">{analysis.jaccardSimilarity.toFixed(3)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${analysis.jaccardSimilarity * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Measures neighborhood overlap</p>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Co-Association Score</span>
                    <span className="text-white font-medium">{analysis.coAssociationScore.toFixed(3)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${analysis.coAssociationScore * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Stability of appearing in the same community</p>
                </div>
              </div>
            </div>

            {/* Mutual Friends */}
            <div className="glass-panel p-4 rounded-xl space-y-3">
              <h4 className="text-sm font-semibold text-slate-300 flex items-center">
                <Users size={16} className="mr-2 text-indigo-400" />
                Mutual Connections ({analysis.mutualFriends.length})
              </h4>
              
              <div className="flex flex-wrap gap-2">
                {analysis.mutualFriends.length > 0 ? (
                  analysis.mutualFriends.map(friend => (
                    <span key={friend} className="px-3 py-1 bg-slate-800/80 border border-slate-700/50 rounded-full text-xs text-slate-300">
                      Node {friend}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">No mutual connections found.</span>
                )}
              </div>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
};
