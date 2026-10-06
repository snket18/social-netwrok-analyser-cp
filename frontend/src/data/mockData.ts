import type { NetworkData } from '../types';

// Generate 32 nodes split into 4 communities (0, 1, 2, 3)
const generateSyntheticNetwork = (): NetworkData => {
  const nodes = [];
  const edges = [];
  
  const communitySizes = [9, 8, 7, 8]; // Total 32 nodes
  let nodeId = 1;
  const communityOffsets: number[] = [];
  
  for (let c = 0; c < 4; c++) {
    communityOffsets.push(nodeId);
    for (let i = 0; i < communitySizes[c]; i++) {
      const stability = 0.6 + Math.random() * 0.4; // 0.6 to 1.0
      const isHub = i === 0;
      const degree = isHub ? 8 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 4);
      
      nodes.push({
        data: {
          id: `${nodeId}`,
          label: `User ${nodeId}`,
          community: c,
          stability: stability,
          degree: degree,
          betweenness: isHub ? 0.4 + Math.random() * 0.2 : Math.random() * 0.1,
          closeness: 0.3 + Math.random() * 0.3,
        }
      });
      nodeId++;
    }
  }

  // Intra-community edges (dense)
  for (let c = 0; c < 4; c++) {
    const start = communityOffsets[c];
    const end = start + communitySizes[c] - 1;
    
    // Connect hub (first node) to almost everyone in community
    for (let i = start + 1; i <= end; i++) {
      edges.push({ data: { source: `${start}`, target: `${i}`, weight: 1 } });
    }
    
    // Add some random edges between others
    for (let i = start + 1; i < end; i++) {
      if (Math.random() > 0.4) {
        edges.push({ data: { source: `${i}`, target: `${i + 1}`, weight: 1 } });
      }
      if (i + 2 <= end && Math.random() > 0.6) {
        edges.push({ data: { source: `${i}`, target: `${i + 2}`, weight: 1 } });
      }
    }
  }

  // Inter-community edges (sparse)
  edges.push({ data: { source: `${communityOffsets[0]}`, target: `${communityOffsets[1]}`, weight: 1 } });
  edges.push({ data: { source: `${communityOffsets[1]}`, target: `${communityOffsets[2]}`, weight: 1 } });
  edges.push({ data: { source: `${communityOffsets[2]}`, target: `${communityOffsets[3]}`, weight: 1 } });
  edges.push({ data: { source: `${communityOffsets[3]}`, target: `${communityOffsets[0]}`, weight: 1 } });
  
  // Random cross-community edges
  for (let i = 0; i < 5; i++) {
    const c1 = Math.floor(Math.random() * 4);
    let c2 = Math.floor(Math.random() * 4);
    while (c1 === c2) c2 = Math.floor(Math.random() * 4);
    
    const n1 = communityOffsets[c1] + Math.floor(Math.random() * communitySizes[c1]);
    const n2 = communityOffsets[c2] + Math.floor(Math.random() * communitySizes[c2]);
    edges.push({ data: { source: `${n1}`, target: `${n2}`, weight: 1 } });
  }

  return {
    metrics: {
      nodes: nodes.length,
      edges: edges.length,
      communities: 4,
      modularity: 0.68,
      ari: 1.0,
      nmi: 1.0,
      runs: 100
    },
    nodes,
    edges
  };
};

export const syntheticNetworkMock = generateSyntheticNetwork();
export const karateClubMock = syntheticNetworkMock; // Replacing karate club with the realistic one for now
