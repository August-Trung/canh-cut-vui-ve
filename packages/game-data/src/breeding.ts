import { BreedingConfig } from '@penguin/types';

export const BREEDING_CONFIG: BreedingConfig = {
  minParentLevel: 3,
  costCoins: 200,
  costGems: 1,
  cooldownMs: 1800000, // 30 minutes
  durationSeconds: 300, // 5 minutes
  devDurationSeconds: 15,
};

export interface GeneticsMutationPools {
  sameSpeciesMutationPool: Record<string, { speciesId: string; weight: number }[]>;
  crossSpeciesMutationPool: Record<string, { speciesId: string; weight: number }[]>;
}

export const GENETICS_MUTATION_POOLS: GeneticsMutationPools = {
  sameSpeciesMutationPool: {
    snowy: [{ speciesId: 'shy', weight: 60 }, { speciesId: 'sleepy', weight: 40 }],
    sleepy: [{ speciesId: 'snowy', weight: 50 }, { speciesId: 'happy', weight: 50 }],
    shy: [{ speciesId: 'sleepy', weight: 50 }, { speciesId: 'hungry', weight: 50 }],
    happy: [{ speciesId: 'hungry', weight: 50 }, { speciesId: 'snowy', weight: 50 }],
    hungry: [{ speciesId: 'happy', weight: 60 }, { speciesId: 'shy', weight: 40 }],
  },
  crossSpeciesMutationPool: {
    default: [
      { speciesId: 'happy', weight: 40 },
      { speciesId: 'hungry', weight: 30 },
      { speciesId: 'shy', weight: 30 },
    ],
  },
};
