import type { EggType } from '@penguin/types';
import { EGG_TYPES_MAP } from '@penguin/game-data';
import { IRandomService, randomService } from './RandomService';

export class HatchService {
  constructor(
    private random: IRandomService = randomService,
    private eggMap: Map<string, EggType> = EGG_TYPES_MAP
  ) {}

  rollSpeciesForEgg(eggTypeId: string): string {
    const egg = this.eggMap.get(eggTypeId);
    if (!egg || !egg.dropPool?.length) {
      return 'snowy';
    }
    return this.random.rollDrop(egg.dropPool);
  }
}

export const hatchService = new HatchService();

export function rollSpeciesForEgg(
  eggTypeId: string,
  random: IRandomService = randomService,
  eggMap: Map<string, EggType> = EGG_TYPES_MAP
): string {
  const egg = eggMap.get(eggTypeId);
  if (!egg || !egg.dropPool?.length) {
    return 'snowy';
  }
  return random.rollDrop(egg.dropPool);
}
