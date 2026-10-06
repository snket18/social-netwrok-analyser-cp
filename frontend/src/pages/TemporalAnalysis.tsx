import React, { useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { Clock, Info, AlertCircle, ArrowRight } from 'lucide-react';

export const TemporalAnalysis: React.FC = () => {
  const cyRef = useRef<cytoscape.Core | null>(null);

  const elements = CytoscapeComponent.normalizeElements({
    nodes: [
      { data: { id: 'A', label: 'User A' } },
      { data: { id: 'B', label: 'User B' } },
      { data: { id: 'C', label: 'User C' } }
    ],
    edges: [
      { data: { source: 'A', target: 'B', label: 't = 5', timestamp: 5 } },
      { data: { source: 'B', target: 'C', label: 't = 3', timestamp: 3 } }
    ]
  });

  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  }, []);

  return (
    <div className="flex flex-col h-full p-8 animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Temporal Path Analysis</h2>
        <p className="text-slate-400">Understanding time-respecting paths in dynamic networks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        
        {/* Visualization Panel */}
        <div className="glass-panel rounded-xl flex flex-col overflow-hidden relative">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/30 flex items-center space-x-2">
            <Clock size={18} className="text-blue-400" />
            <h3 className="font-medium text-slate-200">Temporal Graph</h3>
          </div>
          
          <div className="flex-1">
            <CytoscapeComponent
              elements={elements}
              style={{ width: '100%', height: '100%' }}
              stylesheet={[
                {
                  selector: 'node',
                  style: {
                    'label': 'data(label)',
                    'background-color': '#3b82f6',
                    'color': '#f8fafc',
                    'text-valign': 'bottom',
                    'text-margin-y': 8,
                    'font-size': '14px',
                    'width': 40,
                    'height': 40,
                  }
                },
                {
                  selector: 'edge',
                  style: {
                    'width': 3,
                    'line-color': '#94a3b8',
                    'target-arrow-color': '#94a3b8',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': '12px',
                    'color': '#f1f5f9',
                    'text-background-opacity': 1,
                    'text-background-color': '#1e293b',
                    'text-background-padding': '4px',
                    'text-background-shape': 'roundrectangle'
                  }
                }
              ]}
              layout={{
                name: 'grid',
                rows: 1,
                padding: 50
              }}
              cy={(cy) => {
                cyRef.current = cy;
                cy.userZoomingEnabled(false);
                cy.userPanningEnabled(false);
              }}
            />
          </div>
        </div>

        {/* Explanation Panel */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <div className="flex items-start space-x-3">
              <Info className="text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-medium text-white mb-2">What is a Temporal Path?</h4>
                <p className="text-slate-300 text-sm leading-relaxed">
                  In a standard static graph, if there is a sequence of edges connecting two nodes, a path exists. 
                  However, in real social networks, relationships and interactions occur at specific times.
                </p>
                <p className="text-slate-300 text-sm leading-relaxed mt-2">
                  A <strong className="text-white">time-respecting path</strong> is a sequence of edges where the timestamp of each subsequent edge is strictly greater than (or equal to) the previous one. Information can only flow forward in time.
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl space-y-4 border border-red-500/20">
            <div className="flex items-start space-x-3">
              <AlertCircle className="text-red-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-medium text-white mb-2">The A → C Paradox</h4>
                
                <div className="bg-slate-800/80 p-4 rounded-lg my-4 font-mono text-sm">
                  <div className="flex items-center space-x-2 mb-2 text-slate-300">
                    <span className="text-blue-400">Event 1:</span>
                    <span>User B interacts with User C</span>
                    <span className="bg-slate-700 px-2 rounded text-xs">t = 3</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <span className="text-blue-400">Event 2:</span>
                    <span>User A interacts with User B</span>
                    <span className="bg-slate-700 px-2 rounded text-xs">t = 5</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-20 font-medium text-slate-400">Static View:</span>
                    <span className="flex items-center text-emerald-400">
                      Path exists (A <ArrowRight size={14} className="mx-1" /> B <ArrowRight size={14} className="mx-1" /> C)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="w-20 font-medium text-slate-400">Temporal View:</span>
                    <span className="flex items-center text-red-400 font-medium">
                      NO PATH EXISTS
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed mt-4">
                  Why? Because User A gave information to User B at time <code className="bg-slate-800 px-1 rounded text-blue-300">t=5</code>, which is 
                  <strong className="text-white"> after</strong> User B had already interacted with User C at time <code className="bg-slate-800 px-1 rounded text-blue-300">t=3</code>. 
                  Therefore, a message or influence cannot pass from A to C through B.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
