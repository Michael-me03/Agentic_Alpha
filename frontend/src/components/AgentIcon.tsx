// ============================================================================
// SECTION: Agent Icon — Renders Lucide SVG icons by key
// ============================================================================

import {
  TrendingUp,
  Landmark,
  Shield,
  Dice5,
  Brain,
  Rocket,
  Zap,
  Target,
  Eye,
  Flame,
  type LucideIcon,
} from 'lucide-react';

// ── Icon key → Lucide component mapping ────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  'trending-up': TrendingUp,
  'landmark': Landmark,
  'shield': Shield,
  'dice': Dice5,
  'brain': Brain,
  'rocket': Rocket,
  'zap': Zap,
  'target': Target,
  'eye': Eye,
  'flame': Flame,
};

interface Props {
  icon: string;
  size?: number;
  className?: string;
  color?: string;
}

export default function AgentIcon({ icon, size = 20, className = '', color }: Props) {
  const IconComponent = ICON_MAP[icon];

  // Fallback for old emoji-based icons or unknown keys
  if (!IconComponent) {
    return <span className={className} style={{ fontSize: size * 0.9 }}>{icon}</span>;
  }

  return <IconComponent size={size} className={className} color={color} strokeWidth={2} />;
}

export const AGENT_ICON_KEYS = Object.keys(ICON_MAP);
