import { defineStore } from 'pinia';
import { SPECIES_LIST } from '@penguin/game-data';

export interface DiscoveredEntry {
  speciesId: string;
  discoveredAt: number;
}

export const useCollectionStore = defineStore('collection', {
  state: () => ({
    discovered: [] as DiscoveredEntry[],
  }),
  getters: {
    totalSpeciesCount: (): number => SPECIES_LIST.length,
    discoveredCount: (state): number => state.discovered.length,
    isDiscovered: (state) => (speciesId: string): boolean => {
      return state.discovered.some((d) => d.speciesId === speciesId);
    },
    discoveryDetails: (state) => (speciesId: string): DiscoveredEntry | undefined => {
      return state.discovered.find((d) => d.speciesId === speciesId);
    },
  },
  actions: {
    setDiscovered(entries: DiscoveredEntry[]): void {
      this.discovered = entries.map((entry) => ({ ...entry }));
    },
    discoverSpecies(speciesId: string): void {
      if (!this.isDiscovered(speciesId)) {
        this.discovered.push({
          speciesId,
          discoveredAt: Date.now(),
        });
      }
    },
  },
});
