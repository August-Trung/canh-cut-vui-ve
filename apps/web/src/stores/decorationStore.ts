import { defineStore } from 'pinia';
import { PlacedDecoration, DecorationPlot } from '@penguin/types';
import { DECORATION_PLOTS, DECORATION_CATALOG } from '@penguin/game-data';
import { calculateCozyRating, getCoinDropMultiplier } from '../services/DecorationService';
import { gameBridge } from '../game/bridge/GameBridge';
import { useGameStore } from './gameStore';
import { useInventoryStore } from './inventoryStore';

export const useDecorationStore = defineStore('decorations', {
  state: () => ({
    plots: [...DECORATION_PLOTS] as DecorationPlot[],
  }),

  getters: {
    placedDecorations(): PlacedDecoration[] {
      const gameStore = useGameStore();
      return gameStore.island.decorations;
    },

    getDecorationOnPlot: () => (plotId: number): PlacedDecoration | undefined => {
      const gameStore = useGameStore();
      return gameStore.island.decorations.find((d) => d.plotId === plotId);
    },

    cozyRating(): number {
      const gameStore = useGameStore();
      return calculateCozyRating(gameStore.island.decorations);
    },

    coinDropMultiplier(): number {
      return getCoinDropMultiplier(this.cozyRating);
    },
  },

  actions: {
    placeDecoration(plotId: number, decorationId: string): boolean {
      if (!this.plots.some((p) => p.id === plotId)) {
        return false;
      }

      const gameStore = useGameStore();
      const invStore = useInventoryStore();

      if (this.getDecorationOnPlot(plotId)) {
        return false;
      }

      if (invStore.getItemCount(decorationId) < 1) {
        return false;
      }

      invStore.consumeItem(decorationId, 1);

      const placed: PlacedDecoration = {
        instanceId: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        decorationId,
        plotId,
        placedAt: Date.now(),
      };
      gameStore.island.decorations.push(placed);

      if (!gameStore.island.unlockedPlacementExpIds.includes(decorationId)) {
        gameStore.island.unlockedPlacementExpIds.push(decorationId);
        gameStore.addPlayerExp(15);
      }

      gameStore.persistSave();
      gameBridge.emit('decorations:sync', { decorations: [...gameStore.island.decorations] });
      gameBridge.emit('action:decorate', { plotId, decorationId });
      return true;
    },

    removeDecoration(plotId: number): boolean {
      if (!this.plots.some((p) => p.id === plotId)) {
        return false;
      }

      const gameStore = useGameStore();
      const invStore = useInventoryStore();

      const existingIndex = gameStore.island.decorations.findIndex((d) => d.plotId === plotId);
      if (existingIndex === -1) {
        return false;
      }

      const [removed] = gameStore.island.decorations.splice(existingIndex, 1);
      const def = DECORATION_CATALOG[removed.decorationId];

      invStore.addItem({
        itemId: removed.decorationId,
        category: 'decorations',
        name: def?.name ?? removed.decorationId,
        description: def?.description ?? '',
        quantity: 1,
        stackable: true,
      });

      gameStore.persistSave();
      gameBridge.emit('decorations:sync', { decorations: [...gameStore.island.decorations] });
      return true;
    },

    replaceDecoration(plotId: number, newDecorationId: string): boolean {
      if (!this.plots.some((p) => p.id === plotId)) {
        return false;
      }

      const gameStore = useGameStore();
      const invStore = useInventoryStore();

      const existing = gameStore.island.decorations.find((d) => d.plotId === plotId);
      if (!existing) {
        return false;
      }

      if (invStore.getItemCount(newDecorationId) < 1) {
        return false;
      }

      // Consume new decoration
      invStore.consumeItem(newDecorationId, 1);

      // Return old decoration to inventory
      const oldDef = DECORATION_CATALOG[existing.decorationId];
      invStore.addItem({
        itemId: existing.decorationId,
        category: 'decorations',
        name: oldDef?.name ?? existing.decorationId,
        description: oldDef?.description ?? '',
        quantity: 1,
        stackable: true,
      });

      // Update plot decoration
      existing.decorationId = newDecorationId;
      existing.placedAt = Date.now();

      // Check placement EXP anti-exploit
      if (!gameStore.island.unlockedPlacementExpIds.includes(newDecorationId)) {
        gameStore.island.unlockedPlacementExpIds.push(newDecorationId);
        gameStore.addPlayerExp(15);
      }

      gameStore.persistSave();
      gameBridge.emit('decorations:sync', { decorations: [...gameStore.island.decorations] });
      gameBridge.emit('action:decorate', { plotId, decorationId: newDecorationId });
      return true;
    },
  },
});
