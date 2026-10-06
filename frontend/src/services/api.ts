import { generateSyntheticNetwork } from '../data/mockData';
import type {
  NetworkData,
  NetworkMetrics,
  RelationshipAnalysis,
  TemporalEvent,
  TemporalPathAnalysis,
  UserDetails,
} from '../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;

/**
 * Base URL of the FastAPI backend (no trailing slash).
 * Configured via the VITE_API_URL environment variable, e.g.
 * VITE_API_URL=http://localhost:8000/api
 * Defaults to the relative '/api' prefix, which works unchanged
 * behind any same-origin reverse proxy.
 */
export const API_URL = (envApiUrl ?? '/api').replace(/\/+$/, '');

export type ApiMode = 'http' | 'mock';

/** Force the mock backend via VITE_MOCK_MODE=true. */
const FORCE_MOCK = import.meta.env.VITE_MOCK_MODE === 'true';

/** Runtime override, e.g. triggered by a "Use mock data" action. */
let mockOverride = false;

/** Tracks whether any request has been served from mock data. */
let hasUsedMock = FORCE_MOCK;

/**
 * Current data source: 'mock' once any request has fallen back
 * (or when mock mode is forced), 'http' otherwise.
 */
export const getApiMode = (): ApiMode => (hasUsedMock ? 'mock' : 'http');

/** True when mock data is forced via VITE_MOCK_MODE or enableMockMode(). */
export const isMockForced = (): boolean => FORCE_MOCK || mockOverride;

/** Switches the service to mock data for the rest of the session. */
export const enableMockMode = (): void => {
  mockOverride = true;
  hasUsedMock = true;
};

/** Per-request options for the service facade. */
export interface RequestOptions {
  /**
   * When false, request errors propagate to the caller instead of
   * being masked by the automatic mock fallback. Default: true.
   */
  mockFallback?: boolean;
}

// ---------------------------------------------------------------------------
// HTTP implementation — talks to the real FastAPI backend.
// The frontend only requests analysis and receives results; all
// mathematical computation (Louvain, stability, centrality, shortest
// paths, Jaccard, temporal paths) happens in Python + NetworkX.
// ---------------------------------------------------------------------------

/** Parses a response body, rejecting empty or malformed payloads. */
const expectJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) {
    throw new Error('Empty response body');
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Malformed JSON response');
  }
};

const isNetworkData = (payload: unknown): payload is NetworkData => {
  if (typeof payload !== 'object' || payload === null) return false;
  const candidate = payload as Partial<NetworkData>;
  return (
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.edges) &&
    typeof candidate.metrics === 'object' &&
    candidate.metrics !== null
  );
};

const isUserDetails = (payload: unknown): payload is UserDetails => {
  if (typeof payload !== 'object' || payload === null) return false;
  const candidate = payload as Partial<UserDetails>;
  return (
    Array.isArray(candidate.connectedUsers) &&
    Array.isArray(candidate.suggestedConnections)
  );
};

const isRelationshipAnalysis = (
  payload: unknown
): payload is RelationshipAnalysis => {
  if (typeof payload !== 'object' || payload === null) return false;
  const candidate = payload as Partial<RelationshipAnalysis>;
  return (
    Array.isArray(candidate.shortestPath) &&
    Array.isArray(candidate.mutualFriends)
  );
};

const isTemporalPathAnalysis = (
  payload: unknown
): payload is TemporalPathAnalysis => {
  if (typeof payload !== 'object' || payload === null) return false;
  const candidate = payload as Partial<TemporalPathAnalysis>;
  return (
    Array.isArray(candidate.staticPath) &&
    Array.isArray(candidate.timeRespectingPath) &&
    Array.isArray(candidate.events)
  );
};

const httpGetNetworkData = async (datasetId: string): Promise<NetworkData> => {
  const response = await fetch(
    `${API_URL}/network?dataset=${encodeURIComponent(datasetId)}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch network data (HTTP ${response.status})`);
  }
  const payload = await expectJson<unknown>(response);
  if (!isNetworkData(payload)) {
    throw new Error('Unexpected network data payload');
  }
  return payload;
};

const httpGetUserDetails = async (userId: string): Promise<UserDetails> => {
  const response = await fetch(`${API_URL}/users/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user details (HTTP ${response.status})`);
  }
  const payload = await expectJson<unknown>(response);
  if (!isUserDetails(payload)) {
    throw new Error('Unexpected user details payload');
  }
  return payload;
};

const httpAnalyzeRelationship = async (
  sourceId: string,
  targetId: string
): Promise<RelationshipAnalysis> => {
  const response = await fetch(`${API_URL}/relationship-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: sourceId, target: targetId }),
  });
  if (!response.ok) {
    throw new Error(`Relationship analysis failed (HTTP ${response.status})`);
  }
  const payload = await expectJson<unknown>(response);
  if (!isRelationshipAnalysis(payload)) {
    throw new Error('Unexpected relationship analysis payload');
  }
  return payload;
};

const httpAnalyzeTemporalPath = async (
  sourceId?: string,
  targetId?: string
): Promise<TemporalPathAnalysis> => {
  const response = await fetch(`${API_URL}/temporal-path`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: sourceId, target: targetId }),
  });
  if (!response.ok) {
    throw new Error(`Temporal path analysis failed (HTTP ${response.status})`);
  }
  const payload = await expectJson<unknown>(response);
  if (!isTemporalPathAnalysis(payload)) {
    throw new Error('Unexpected temporal path analysis payload');
  }
  return payload;
};

// ---------------------------------------------------------------------------
// Mock implementation — static canned fixtures for development.
// No analysis algorithms are re-implemented here: Louvain, stability,
// centrality, shortest paths, Jaccard and temporal-path computation
// all remain the responsibility of the Python + NetworkX backend.
// ---------------------------------------------------------------------------

const delay = (ms = 200) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Stable for the session so every page observes the same mock network. */
const mockNetwork: NetworkData = generateSyntheticNetwork();

/** Demo event stream for the A → B → C example graph. */
const DEMO_TEMPORAL_EVENTS: TemporalEvent[] = [
  { source: 'B', target: 'C', timestamp: 3 },
  { source: 'A', target: 'B', timestamp: 5 },
];

/** Canned analysis result for the demo pair A → C. */
const DEMO_TEMPORAL_PATH: Omit<TemporalPathAnalysis, 'source' | 'target'> = {
  events: DEMO_TEMPORAL_EVENTS,
  staticPath: ['A', 'B', 'C'],
  staticPathLength: 2,
  timeRespectingPath: [],
  timeRespectingPathLength: 0,
  isTimeRespecting: false,
};

const emptyRelationship = (
  sourceId: string,
  targetId: string
): RelationshipAnalysis => ({
  source: sourceId,
  target: targetId,
  shortestPathLength: -1,
  shortestPath: [],
  mutualFriends: [],
  jaccardSimilarity: 0,
  coAssociationScore: 0,
});

const emptyTemporalPath = (
  sourceId: string,
  targetId: string
): TemporalPathAnalysis => ({
  source: sourceId,
  target: targetId,
  events: [],
  staticPath: [],
  staticPathLength: 0,
  timeRespectingPath: [],
  timeRespectingPathLength: 0,
  isTimeRespecting: false,
});

const mockGetNetworkData = async (_datasetId: string): Promise<NetworkData> => {
  await delay();
  return mockNetwork;
};

const mockGetUserDetails = async (userId: string): Promise<UserDetails> => {
  await delay();
  const node = mockNetwork.nodes.find((n) => n.data.id === userId);
  if (!node) {
    throw new Error('User not found');
  }
  // Direct connections are read straight from the fixture edges.
  // Suggested connections (Jaccard coefficient) are computed by the
  // backend, so the mock returns an empty list.
  const connectedUsers = mockNetwork.edges
    .filter((e) => e.data.source === userId || e.data.target === userId)
    .map((e) => ({
      id: e.data.source === userId ? e.data.target : e.data.source,
      weight: e.data.weight,
    }));
  return {
    ...node.data,
    connectedUsers,
    suggestedConnections: [],
  };
};

const mockAnalyzeRelationship = async (
  sourceId: string,
  targetId: string
): Promise<RelationshipAnalysis> => {
  await delay();
  // Shortest paths, mutual friends and Jaccard similarity are
  // computed by the Python backend — the mock serves an empty result.
  return emptyRelationship(sourceId, targetId);
};

const mockAnalyzeTemporalPath = async (
  sourceId?: string,
  targetId?: string
): Promise<TemporalPathAnalysis> => {
  await delay();
  // Mirror the backend: omitting the pair selects the default demo pair.
  const source = sourceId ?? 'A';
  const target = targetId ?? 'C';
  if (source === 'A' && target === 'C') {
    return { source, target, ...DEMO_TEMPORAL_PATH };
  }
  return emptyTemporalPath(source, target);
};

// ---------------------------------------------------------------------------
// Facade — single entry point with automatic per-request fallback to mock
// ---------------------------------------------------------------------------

const withFallback = async <T>(
  request: () => Promise<T>,
  fallback: () => Promise<T>,
  allowFallback = true
): Promise<T> => {
  if (isMockForced()) {
    return fallback();
  }
  try {
    return await request();
  } catch (error) {
    if (!allowFallback) {
      throw error;
    }
    console.warn('[api] Request failed — serving mock data instead.', error);
    hasUsedMock = true;
    return fallback();
  }
};

export const apiService = {
  getNetworkData: (datasetId = 'synthetic', options: RequestOptions = {}) =>
    withFallback(
      () => httpGetNetworkData(datasetId),
      () => mockGetNetworkData(datasetId),
      options.mockFallback !== false
    ),

  getMetrics: async (
    datasetId = 'synthetic',
    options: RequestOptions = {}
  ): Promise<NetworkMetrics> => {
    const data = await apiService.getNetworkData(datasetId, options);
    return data.metrics;
  },

  getUserDetails: (userId: string, options: RequestOptions = {}) =>
    withFallback(
      () => httpGetUserDetails(userId),
      () => mockGetUserDetails(userId),
      options.mockFallback !== false
    ),

  analyzeRelationship: (
    sourceId: string,
    targetId: string,
    options: RequestOptions = {}
  ) =>
    withFallback(
      () => httpAnalyzeRelationship(sourceId, targetId),
      () => mockAnalyzeRelationship(sourceId, targetId),
      options.mockFallback !== false
    ),

  analyzeTemporalPath: (
    sourceId?: string,
    targetId?: string,
    options: RequestOptions = {}
  ) =>
    withFallback(
      () => httpAnalyzeTemporalPath(sourceId, targetId),
      () => mockAnalyzeTemporalPath(sourceId, targetId),
      options.mockFallback !== false
    ),
};
