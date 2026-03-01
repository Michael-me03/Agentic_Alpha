// ============================================================================
// SECTION: Dynamic Agent Metadata
// ============================================================================

/**
 * Shared utility for building agent metadata from user-defined configs.
 * All arena components use this instead of hardcoded dicts.
 */

import type { AgentConfig } from './types';

export interface AgentMeta {
  color: string;
  icon: string;
  city: string;
  abbr: string;
  prompt: string;
}

function makeAbbr(name: string): string {
  if (name.length <= 3) return name.toUpperCase();
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    return words.map((w) => w[0]).join('').toUpperCase().slice(0, 3);
  }
  return name.slice(0, 3).toUpperCase();
}

export function buildAgentMetaMap(
  configs: AgentConfig[]
): Record<string, AgentMeta> {
  const map: Record<string, AgentMeta> = {};
  for (const cfg of configs) {
    map[cfg.name] = {
      color: cfg.color,
      icon: cfg.icon ?? '🤖',
      city: cfg.city ?? 'New York',
      abbr: makeAbbr(cfg.name),
      prompt: cfg.system_prompt,
    };
  }
  return map;
}

export function buildAgentColorMap(
  configs: AgentConfig[]
): Record<string, string> {
  return Object.fromEntries(configs.map((c) => [c.name, c.color]));
}
