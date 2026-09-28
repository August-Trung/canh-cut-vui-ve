import { OwnedPenguin, BreedingSlot } from '@penguin/types';
import { BREEDING_CONFIG } from '@penguin/game-data';

export interface BreedingEligibilityResult {
  eligible: boolean;
  reason?:
    | 'SAME_PENGUIN'
    | 'PARENT_NOT_FOUND'
    | 'LEVEL_TOO_LOW'
    | 'ON_COOLDOWN'
    | 'STARVING'
    | 'INSUFFICIENT_FUNDS'
    | 'SLOT_OCCUPIED';
}

/**
 * Pure domain service for breeding eligibility and duration calculations.
 * Strict purity: never invokes Date.now() or uses default timestamp parameters.
 */
export function validateBreedingEligibility(
  parentA: OwnedPenguin,
  parentB: OwnedPenguin,
  coins: number,
  gems: number,
  activeBreedingSlot: BreedingSlot | null,
  now: number
): BreedingEligibilityResult {
  if (!parentA || !parentB) {
    return { eligible: false, reason: 'PARENT_NOT_FOUND' };
  }

  if (parentA.id === parentB.id) {
    return { eligible: false, reason: 'SAME_PENGUIN' };
  }

  if (parentA.level < BREEDING_CONFIG.minParentLevel || parentB.level < BREEDING_CONFIG.minParentLevel) {
    return { eligible: false, reason: 'LEVEL_TOO_LOW' };
  }

  // Cooldown validation: lastBredAt === 0 means never bred; cooldown does not apply
  const cooldownMs = BREEDING_CONFIG.cooldownMs;
  const aInCooldown = (parentA.lastBredAt ?? 0) > 0 && now - (parentA.lastBredAt ?? 0) < cooldownMs;
  const bInCooldown = (parentB.lastBredAt ?? 0) > 0 && now - (parentB.lastBredAt ?? 0) < cooldownMs;
  if (aInCooldown || bInCooldown) {
    return { eligible: false, reason: 'ON_COOLDOWN' };
  }

  if (parentA.hunger >= 80 || parentB.hunger >= 80) {
    return { eligible: false, reason: 'STARVING' };
  }

  if (coins < BREEDING_CONFIG.costCoins || gems < BREEDING_CONFIG.costGems) {
    return { eligible: false, reason: 'INSUFFICIENT_FUNDS' };
  }

  if (activeBreedingSlot && activeBreedingSlot.state !== 'EMPTY') {
    return { eligible: false, reason: 'SLOT_OCCUPIED' };
  }

  return { eligible: true };
}

export function calculateBreedingDuration(
  parentA: OwnedPenguin,
  parentB: OwnedPenguin,
  isDev: boolean = false
): number {
  const baseDuration = isDev
    ? (BREEDING_CONFIG.devDurationSeconds ?? 15)
    : BREEDING_CONFIG.durationSeconds;

  // Trait non-stacking rule: if at least one parent has 'romantic', apply 25% duration reduction once
  const hasRomantic = (parentA.traits ?? []).includes('romantic') || (parentB.traits ?? []).includes('romantic');
  if (hasRomantic) {
    return Math.floor(baseDuration * 0.75);
  }

  return baseDuration;
}
