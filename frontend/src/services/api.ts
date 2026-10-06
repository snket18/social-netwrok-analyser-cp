import type { NetworkData, RelationshipAnalysis, UserDetails } from '../types';
import { karateClubMock } from '../data/mockData';

const API_URL = 'http://localhost:8000/api';

export const fetchNetworkData = async (datasetId: string = 'synthetic'): Promise<NetworkData> => {
  const response = await fetch(`${API_URL}/network`);
  if (!response.ok) {
    throw new Error('Failed to fetch network data');
  }
  return response.json();
};

export const fetchUserDetails = async (userId: string): Promise<UserDetails> => {
  const response = await fetch(`${API_URL}/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }
  return response.json();
};

export const analyzeRelationship = async (sourceId: string, targetId: string): Promise<RelationshipAnalysis> => {
  const response = await fetch(`${API_URL}/relationship-analysis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ source: sourceId, target: targetId }),
  });
  if (!response.ok) {
    throw new Error('Failed to analyze relationship');
  }
  return response.json();
};
