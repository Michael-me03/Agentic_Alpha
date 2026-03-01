// ============================================================================
// SECTION: API Client
// ============================================================================

import type { SimulationRequest, SimulationResponse, AgentConfig, AssetSearchResult } from './types';

const API_BASE = '/api';

export async function fetchInitialState(): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/initial`);
  if (!res.ok) throw new Error('Failed to load initial state');
  return res.json();
}

export async function runSimulation(
  params: SimulationRequest
): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Simulation failed: ${res.statusText}`);
  }

  return res.json();
}

export interface PresetTemplate {
  name: string;
  system_prompt: string;
  icon: string;
  color: string;
  city: string;
  description: string;
}

export async function fetchPresets(): Promise<PresetTemplate[]> {
  const res = await fetch(`${API_BASE}/presets`);
  if (!res.ok) throw new Error('Failed to load presets');
  return res.json();
}

export async function searchAssets(query: string): Promise<AssetSearchResult[]> {
  if (!query || query.length < 1) return [];
  const res = await fetch(`${API_BASE}/search-assets?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  return res.json();
}
