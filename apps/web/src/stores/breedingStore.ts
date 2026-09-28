import { defineStore } from 'pinia';
import type { OwnedPenguin, BreedingSlot, GeneticsResult } from '@penguin/types';
import { BREEDING_CONFIG } from '@penguin/game-data';
import { validateBreedingEligibility, calculateBreedingDuration } from '../services/BreedingService';
import { geneticsService } from '../services/GeneticsService';
import { gameBridge } from '../game/bridge/GameBridge';
import { useGameStore } from './gameStore';
import { useInventoryStore } from './inventoryStore';

export const useBreedingStore = defineStore('breeding', {
  state: () => ({
    selectedParentAId: null as string | null,
    selectedParentBId: null as string | null,
    isDevMode: false,
  }),

  getters: {
    breedingSlot(): BreedingSlot {
      const gameStore = useGameStore();
      return gameStore.breedingSlot;
    },

    parentA(): OwnedPenguin | null {
      const gameStore = useGameStore();
      return gameStore.ownedPenguins.find((p) => p.id === this.selectedParentAId) ?? null;
    },

    parentB(): OwnedPenguin | null {
      const gameStore = useGameStore();
      return gameStore.ownedPenguins.find((p) => p.id === this.selectedParentBId) ?? null;
    },

    canBreedCurrentSelection(): { eligible: boolean; reason?: string } {
      const gameStore = useGameStore();
      if (!this.selectedParentAId || !this.selectedParentBId) {
        return { eligible: false, reason: 'Chưa chọn đủ 2 chim bố mẹ' };
      }
      const pA = this.parentA;
      const pB = this.parentB;
      if (!pA || !pB) {
        return { eligible: false, reason: 'PARENT_NOT_FOUND' };
      }

      const res = validateBreedingEligibility(
        pA,
        pB,
        gameStore.currencies.coins,
        gameStore.currencies.gems,
        gameStore.breedingSlot,
        Date.now()
      );

      return res;
    },

    previewOffspring(): {
      generation: number;
      possibleSpecies: string[];
      possibleTraits: string[];
    } | null {
      const pA = this.parentA;
      const pB = this.parentB;
      if (!pA || !pB) return null;

      const generation = Math.max(pA.generation ?? 1, pB.generation ?? 1) + 1;
      const possibleSpecies = Array.from(new Set([pA.speciesId, pB.speciesId]));
      const possibleTraits = Array.from(new Set([...(pA.traits ?? []), ...(pB.traits ?? [])]));
      return { generation, possibleSpecies, possibleTraits };
    },
  },

  actions: {
    selectParentA(id: string | null): void {
      this.selectedParentAId = id;
    },

    selectParentB(id: string | null): void {
      this.selectedParentBId = id;
    },

    setDevMode(dev: boolean): void {
      this.isDevMode = dev;
    },

    startBreeding(parentAId?: string, parentBId?: string): { success: boolean; reason?: string } {
      const gameStore = useGameStore();
      const aId = parentAId ?? this.selectedParentAId;
      const bId = parentBId ?? this.selectedParentBId;

      if (!aId || !bId) {
        return { success: false, reason: 'Chưa chọn đủ 2 chim bố mẹ' };
      }

      const pA = gameStore.ownedPenguins.find((p) => p.id === aId);
      const pB = gameStore.ownedPenguins.find((p) => p.id === bId);
      if (!pA || !pB) {
        return { success: false, reason: 'PARENT_NOT_FOUND' };
      }

      const now = Date.now();
      const validation = validateBreedingEligibility(
        pA,
        pB,
        gameStore.currencies.coins,
        gameStore.currencies.gems,
        gameStore.breedingSlot,
        now
      );

      if (!validation.eligible) {
        return { success: false, reason: validation.reason };
      }

      // Deduct currencies atomically
      gameStore.currencies.coins -= BREEDING_CONFIG.costCoins;
      gameStore.currencies.gems -= BREEDING_CONFIG.costGems;

      // Cooldown begins at START
      pA.lastBredAt = now;
      pB.lastBredAt = now;
      pA.breedingCount = (pA.breedingCount ?? 0) + 1;
      pB.breedingCount = (pB.breedingCount ?? 0) + 1;

      // GeneticsResult generated ONCE on START and persisted in BreedingSlot
      const geneticsResult = geneticsService.deriveOffspringGenetics(pA, pB);

      const durationSec = calculateBreedingDuration(pA, pB, this.isDevMode);
      const readyAt = now + durationSec * 1000;

      gameStore.breedingSlot = {
        slotId: 1,
        state: 'BREEDING',
        parentAId: aId,
        parentBId: bId,
        startTime: now,
        durationSec,
        readyAt,
        geneticsResult,
      };

      gameStore.persistSave().catch((err) => console.error('Save failed:', err));
      return { success: true };
    },

    updateTimer(): boolean {
      const gameStore = useGameStore();
      const slot = gameStore.breedingSlot;
      if (slot.state === 'BREEDING' && slot.readyAt && Date.now() >= slot.readyAt) {
        slot.state = 'READY_TO_COLLECT';
        gameStore.persistSave().catch((err) => console.error('Save failed:', err));
        return true;
      }
      return false;
    },

    collectEgg(): { success: boolean; reason?: string } {
      const gameStore = useGameStore();
      const slot = gameStore.breedingSlot;
      this.updateTimer();

      if (slot.state !== 'READY_TO_COLLECT' || !slot.geneticsResult) {
        return { success: false, reason: 'NOT_READY' };
      }

      const invStore = useInventoryStore();
      invStore.addItem({
        itemId: 'egg_breeding',
        category: 'eggs',
        name: 'Trứng Lai Ghép',
        description: 'Trứng kết tinh tình yêu giữa hai chú cánh cụt. Có thể ấp tại Nhà Ấp!',
        quantity: 1,
        stackable: false,
        metadata: {
          geneticsResult: { ...slot.geneticsResult },
        },
      });

      const parentAId = slot.parentAId ?? '';
      const parentBId = slot.parentBId ?? '';

      // Clear breeding slot back to EMPTY
      gameStore.breedingSlot = {
        slotId: 1,
        state: 'EMPTY',
      };

      this.selectedParentAId = null;
      this.selectedParentBId = null;

      // Emit bridge action event
      gameBridge.emit('action:breed', {
        parentAId,
        parentBId,
        eggItemId: 'egg_breeding',
      });

      gameStore.persistSave().catch((err) => console.error('Save failed:', err));
      return { success: true };
    },
  },
});
