export interface NodeData {
  id: string;
  label: string;
  community: number;
  stability: number; // 0 to 1
  alternativeCommunity?: number;
  alternativeScore?: number;
  degree: number;
  betweenness: number;
  closeness: number;
}

export interface EdgeData {
  source: string;
  target: string;
  weight: number;
  evidence?: string;
  timestamp?: number;
}

export interface NetworkMetrics {
  nodes: number;
  edges: number;
  communities: number;
  modularity: number;
  ari: number;
  nmi: number;
  runs: number;
}

export interface NetworkData {
  nodes: { data: NodeData }[];
  edges: { data: EdgeData }[];
  metrics: NetworkMetrics;
}

export interface UserDetails extends NodeData {
  connectedUsers: { id: string; weight: number }[];
  suggestedConnections: { id: string; jaccard: number }[];
}

export interface RelationshipAnalysis {
  source: string;
  target: string;
  shortestPathLength: number;
  shortestPath: string[]; // array of node IDs
  mutualFriends: string[];
  jaccardSimilarity: number;
  coAssociationScore: number; // Stability of being in the same community
}

export interface TemporalEdge extends EdgeData {
  timestamp: number;
}

export interface TemporalEvent {
  source: string;
  target: string;
  timestamp: number;
}

export interface TemporalPathAnalysis {
  source: string;
  target: string;
  events: TemporalEvent[];
  staticPath: string[];
  staticPathLength: number;
  timeRespectingPath: string[];
  timeRespectingPathLength: number;
  isTimeRespecting: boolean;
}
