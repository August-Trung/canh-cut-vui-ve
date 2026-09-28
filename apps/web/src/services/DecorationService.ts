import type { PlacedDecoration, DecorationDefinition } from '@penguin/types';
import { DECORATION_CATALOG } from '@penguin/game-data';

export function calculateCozyRating(
  decorations: PlacedDecoration[],
  catalog: Record<string, DecorationDefinition> = DECORATION_CATALOG
): number {
  return decorations.reduce((sum, placed) => {
    const def = catalog[placed.decorationId];
    return sum + (def?.cozyPoints ?? 0);
  }, 0);
}

export function getCoinDropMultiplier(cozyRating: number): number {
  // +1% per 10 Cozy Points, capped at +25%
  const bonusPercent = Math.min(25, Math.floor(cozyRating / 10));
  return 1 + bonusPercent / 100;
}
