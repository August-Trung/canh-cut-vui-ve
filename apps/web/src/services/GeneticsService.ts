import { OwnedPenguin, GeneticsResult, PenguinPersonality } from '@penguin/types';
import { GENETICS_MUTATION_POOLS, TRAIT_IDS } from '@penguin/game-data';
import { IRandomService, randomService } from './RandomService';

const ALL_PERSONALITIES: PenguinPersonality[] = [
  'lazy',
  'hungry',
  'dramatic',
  'nerd',
  'rich',
  'romantic',
  'chaotic',
  'shy',
  'brave',
  'sleepy',
  'happy',
];

export class GeneticsService {
  constructor(private rng: IRandomService = randomService) {}

  deriveOffspringGenetics(parentA: OwnedPenguin, parentB: OwnedPenguin): GeneticsResult {
    // 1. Generation calculation
    const generation = Math.max(parentA.generation ?? 1, parentB.generation ?? 1) + 1;

    // 2. Species inheritance with data-driven mutation pools
    let speciesId = parentA.speciesId;
    let mutatedSpecies = false;

    if (parentA.speciesId === parentB.speciesId) {
      const roll = this.rng.nextFloat();
      if (roll < 0.85) {
        speciesId = parentA.speciesId;
      } else {
        mutatedSpecies = true;
        const pool = GENETICS_MUTATION_POOLS.sameSpeciesMutationPool[parentA.speciesId]
          ?? GENETICS_MUTATION_POOLS.crossSpeciesMutationPool['default'];
        speciesId = this.rng.rollDrop(pool);
      }
    } else {
      const roll = this.rng.nextFloat();
      if (roll < 0.425) {
        speciesId = parentA.speciesId;
      } else if (roll < 0.85) {
        speciesId = parentB.speciesId;
      } else {
        mutatedSpecies = true;
        const pool = GENETICS_MUTATION_POOLS.crossSpeciesMutationPool['default'];
        speciesId = this.rng.rollDrop(pool);
      }
    }

    // 3. Exact 8-step trait inheritance
    // Step 1: Roll inherited traits from Parent A (50% chance each)
    const inheritedA: string[] = [];
    for (const trait of parentA.traits ?? []) {
      if (this.rng.nextFloat() < 0.5) {
        inheritedA.push(trait);
      }
    }

    // Step 2: Roll inherited traits from Parent B (50% chance each)
    const inheritedB: string[] = [];
    for (const trait of parentB.traits ?? []) {
      if (this.rng.nextFloat() < 0.5) {
        inheritedB.push(trait);
      }
    }

    // Step 3: Deduplicate
    const combinedTraits = Array.from(new Set([...inheritedA, ...inheritedB]));

    // Step 4: Enforce maximum 2 active traits
    let traits = combinedTraits.slice(0, 2);

    // Step 5: Roll spontaneous mutation (10% chance)
    // Bonus from romantic trait: if at least one parent has romantic, +10% mutation chance (to 20%), non-stacking!
    const hasRomantic = (parentA.traits ?? []).includes('romantic') || (parentB.traits ?? []).includes('romantic');
    const mutationChance = hasRomantic ? 0.20 : 0.10;
    const mutationRoll = this.rng.nextFloat();

    // Step 6: Mutation may only add a trait if a slot remains available (< 2)
    if (mutationRoll < mutationChance && traits.length < 2) {
      // Step 7: Never duplicate an existing trait
      const availableTraits = TRAIT_IDS.filter((t) => !traits.includes(t));
      if (availableTraits.length > 0) {
        const pool = availableTraits.map((t) => ({ speciesId: t, weight: 1 }));
        const newTrait = this.rng.rollDrop(pool);
        traits.push(newTrait);
      }
    }

    // Step 8: Final offspring has traits.length <= 2
    traits = traits.slice(0, 2);

    // 4. Personality inheritance
    let personality: PenguinPersonality = 'happy';
    const personalityRoll = this.rng.nextFloat();
    if (personalityRoll < 0.45) {
      personality = (parentA.mood as any) ?? 'happy';
      if (!ALL_PERSONALITIES.includes(personality)) personality = 'happy';
    } else if (personalityRoll < 0.90) {
      personality = (parentB.mood as any) ?? 'happy';
      if (!ALL_PERSONALITIES.includes(personality)) personality = 'happy';
    } else {
      const idx = this.rng.randomRange(0, ALL_PERSONALITIES.length - 1);
      personality = ALL_PERSONALITIES[idx];
    }

    return {
      speciesId,
      traits,
      generation,
      parentAId: parentA.id,
      parentBId: parentB.id,
      mutatedSpecies,
      personality,
    };
  }
}

export const geneticsService = new GeneticsService();
