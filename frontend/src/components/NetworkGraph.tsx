import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import type { NetworkData } from '../types';

interface NetworkGraphProps {
  data: NetworkData;
  onNodeSelect: (nodeId: string | null) => void;
  selectedNodes?: string[];
  highlightedPath?: string[];
  stabilityThreshold?: number;
}

export interface NetworkGraphRef {
  resetLayout: () => void;
}

// Community colors (color-blind friendly)
const COMMUNITY_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

export const NetworkGraph = forwardRef<NetworkGraphRef, NetworkGraphProps>(({ 
  data, 
  onNodeSelect,
  selectedNodes = [],
  highlightedPath = [],
  stabilityThreshold = 0
}, ref) => {
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ id: string, x: number, y: number, name: string, comm: number, stability: number } | null>(null);
  
  const [elements, setElements] = useState(() => 
    CytoscapeComponent.normalizeElements({
      nodes: data.nodes,
      edges: data.edges
    })
  );

  useEffect(() => {
    setElements(CytoscapeComponent.normalizeElements({
      nodes: data.nodes,
      edges: data.edges
    }));
  }, [data]);

  const resetLayout = () => {
    if (cyRef.current) {
      const layout = cyRef.current.layout({ 
        name: 'cose', 
        animate: true,
        animationDuration: 500,
        nodeRepulsion: () => 4000,
        idealEdgeLength: () => 60,
        padding: 40
      });
      layout.run();
    }
  };

  useImperativeHandle(ref, () => ({
    resetLayout
  }));

  useEffect(() => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    
    // Reset all highlights
    cy.elements().removeClass('selected').removeClass('path').removeClass('faded').removeClass('below-threshold');
    
    // Apply stability threshold
    if (stabilityThreshold > 0) {
      cy.nodes().forEach(node => {
        if (node.data('stability') < stabilityThreshold) {
          node.addClass('below-threshold');
          // Also fade connected edges
          node.connectedEdges().addClass('below-threshold');
        }
      });
    }

    if (selectedNodes.length > 0) {
      // Fade out non-selected
      cy.elements().addClass('faded');
      
      // Highlight selected nodes
      selectedNodes.forEach(id => {
        cy.$id(id).removeClass('faded').removeClass('below-threshold').addClass('selected');
      });
      
      // Highlight path
      if (highlightedPath.length > 0) {
        for (let i = 0; i < highlightedPath.length; i++) {
          cy.$id(highlightedPath[i]).removeClass('faded').removeClass('below-threshold').addClass('path');
          
          if (i < highlightedPath.length - 1) {
            // Highlight edge between nodes
            const edge = cy.edges(`[source = "${highlightedPath[i]}"][target = "${highlightedPath[i+1]}"], [source = "${highlightedPath[i+1]}"][target = "${highlightedPath[i]}"]`);
            edge.removeClass('faded').removeClass('below-threshold').addClass('path');
          }
        }
      }
    }
  }, [selectedNodes, highlightedPath, stabilityThreshold]);

  return (
    <div className="w-full h-full relative group">
      {/* Controls overlaid on graph */}
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={resetLayout}
          className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 p-2 rounded-lg text-xs font-medium border border-slate-600 backdrop-blur-sm shadow-lg flex items-center space-x-1 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          <span>Reset Layout</span>
        </button>
      </div>

      <CytoscapeComponent
        elements={elements}
        style={{ width: '100%', height: '100%' }}
        stylesheet={[
          {
            selector: 'node',
            style: {
              'label': 'data(label)',
              'background-color': (ele: cytoscape.NodeSingular) => {
                const comm = ele.data('community');
                return COMMUNITY_COLORS[comm % COMMUNITY_COLORS.length];
              },
              'color': '#f8fafc',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'font-size': '11px',
              'font-family': 'Inter, sans-serif',
              'text-outline-width': 2,
              'text-outline-color': '#1e293b',
              'width': (ele: cytoscape.NodeSingular) => 15 + (ele.data('degree') || 0) * 1.5,
              'height': (ele: cytoscape.NodeSingular) => 15 + (ele.data('degree') || 0) * 1.5,
              'opacity': (ele: cytoscape.NodeSingular) => {
                const s = ele.data('stability');
                return s >= 0.8 ? 1.0 : (s >= 0.6 ? 0.7 : 0.4);
              },
              'border-width': (ele: cytoscape.NodeSingular) => (ele.data('stability') < 0.8 ? 2 : 1),
              'border-style': (ele: cytoscape.NodeSingular) => (ele.data('stability') < 0.6 ? 'dashed' : 'solid'),
              'border-color': 'rgba(255, 255, 255, 0.8)'
            }
          },
          {
            selector: 'node:hover',
            style: {
              'border-width': 3,
              'border-color': '#fff'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 1.5,
              'line-color': '#475569',
              'opacity': 0.4,
              'curve-style': 'bezier'
            }
          },
          {
            selector: '.faded',
            style: {
              'opacity': 0.1,
              'text-opacity': 0
            }
          },
          {
            selector: '.below-threshold',
            style: {
              'opacity': 0.15,
              'border-width': 0,
              'text-opacity': 0
            }
          },
          {
            selector: '.selected',
            style: {
              'border-width': 4,
              'border-color': '#f8fafc',
              'border-style': 'solid',
              'opacity': 1,
              'text-outline-color': '#3b82f6',
              'text-outline-width': 3,
              'font-size': '13px'
            }
          },
          {
            selector: '.path',
            style: {
              'line-color': '#f59e0b',
              'width': 3,
              'opacity': 1,
              'border-width': 3,
              'border-color': '#f59e0b',
              'z-index': 10
            }
          }
        ]}
        layout={React.useMemo(() => ({ 
          name: 'cose', 
          animate: true,
          nodeRepulsion: () => 4000,
          idealEdgeLength: () => 60,
          padding: 40 
        }), [])}
        cy={(cy) => {
          cyRef.current = cy;
          
          cy.on('tap', 'node', (evt) => {
            onNodeSelect(evt.target.id());
          });
          
          cy.on('tap', (evt) => {
            if (evt.target === cy) {
              onNodeSelect(null);
            }
          });

          // Hover events for tooltip
          cy.on('mouseover', 'node', (evt) => {
            const node = evt.target;
            const pos = node.renderedPosition();
            setHoverInfo({
              id: node.id(),
              name: node.data('label'),
              comm: node.data('community'),
              stability: node.data('stability'),
              x: pos.x,
              y: pos.y
            });
            // Bring to front
            node.style('z-index', 10);
          });

          cy.on('mouseout', 'node', (evt) => {
            setHoverInfo(null);
            evt.target.style('z-index', 0);
          });
          
          // Update tooltip position on pan/zoom/drag
          cy.on('pan zoom drag', () => {
            if (hoverInfo) setHoverInfo(null);
          });
        }}
      />
      
      {/* Custom Tooltip */}
      {hoverInfo && (
        <div 
          className="absolute z-50 pointer-events-none bg-slate-900 border border-slate-700 shadow-xl rounded-lg p-3 text-sm animate-fade-in"
          style={{ 
            left: hoverInfo.x + 15, 
            top: hoverInfo.y - 15,
            transform: 'translate(0, -50%)'
          }}
        >
          <p className="font-bold text-white mb-1">{hoverInfo.name}</p>
          <div className="flex items-center space-x-2 mb-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COMMUNITY_COLORS[hoverInfo.comm % COMMUNITY_COLORS.length] }}
            ></span>
            <span className="text-slate-300 text-xs">Community {hoverInfo.comm}</span>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span>Stability:</span>
              <span className={`font-medium ${hoverInfo.stability >= 0.8 ? 'text-emerald-400' : hoverInfo.stability >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>
                {hoverInfo.stability >= 0.8 ? 'High' : hoverInfo.stability >= 0.6 ? 'Moderate' : 'Unstable'} ({(hoverInfo.stability * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

NetworkGraph.displayName = 'NetworkGraph';
