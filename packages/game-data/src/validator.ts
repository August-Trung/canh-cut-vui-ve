import { PenguinSpecies, EggType } from '@penguin/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGameData(
  speciesList: PenguinSpecies[],
  eggTypesList: EggType[]
): ValidationResult {
  const errors: string[] = [];
  const speciesIds = new Set(speciesList.map((s) => s.id));

  for (const egg of eggTypesList) {
    if (!egg.dropPool?.length) {
      errors.push(`Egg '${egg.id}' has an empty drop pool.`);
      continue;
    }

    for (const entry of egg.dropPool) {
      if (entry.weight <= 0 || Number.isNaN(entry.weight)) {
        errors.push(`Egg '${egg.id}' has non-positive weight ${entry.weight} for species '${entry.speciesId}'.`);
      }
      if (!speciesIds.has(entry.speciesId)) {
        errors.push(`Egg '${egg.id}' references nonexistent species '${entry.speciesId}'.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
