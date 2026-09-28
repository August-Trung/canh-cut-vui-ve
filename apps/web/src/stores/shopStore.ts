import { defineStore } from 'pinia';
import {
  FOOD_CATALOG,
  EGG_CATALOG,
  DECORATION_CATALOG,
} from '@penguin/game-data';
import type { FoodItemDefinition, EggShopDefinition, DecorationDefinition } from '@penguin/types';
import { useGameStore } from './gameStore';
import { useInventoryStore } from './inventoryStore';
import { gameBridge } from '../game/bridge/GameBridge';

export interface PurchaseResult {
  success: boolean;
  reason?: 'INVALID_QUANTITY' | 'NOT_FOUND' | 'LEVEL_LOCKED' | 'INSUFFICIENT_FUNDS';
}

export const useShopStore = defineStore('shop', {
  state: () => ({
    activeTab: 'food' as 'food' | 'eggs' | 'decorations',
  }),

  getters: {
    availableFoods: (): FoodItemDefinition[] => {
      return Object.values(FOOD_CATALOG);
    },
    availableEggs: (): EggShopDefinition[] => {
      return Object.values(EGG_CATALOG);
    },
    availableDecorations: (): DecorationDefinition[] => {
      return Object.values(DECORATION_CATALOG);
    },
  },

  actions: {
    setActiveTab(tab: 'food' | 'eggs' | 'decorations'): void {
      this.activeTab = tab;
    },

    buyFood(foodId: string, quantity: number = 1): PurchaseResult {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return { success: false, reason: 'INVALID_QUANTITY' };
      }

      const food = FOOD_CATALOG[foodId];
      if (!food) {
        return { success: false, reason: 'NOT_FOUND' };
      }

      const gameStore = useGameStore();
      if (gameStore.player.level < food.playerLevelRequired) {
        return { success: false, reason: 'LEVEL_LOCKED' };
      }

      const totalCoins = food.coinPrice * quantity;
      if (gameStore.currencies.coins < totalCoins) {
        return { success: false, reason: 'INSUFFICIENT_FUNDS' };
      }

      // Atomic mutation: deduct currency and add inventory
      gameStore.currencies.coins -= totalCoins;
      const invStore = useInventoryStore();
      invStore.addItem({
        itemId: food.id,
        category: 'food',
        name: food.name,
        description: food.description,
        quantity,
        stackable: true,
      });

      gameStore.persistSave().catch((err) => console.error('Save failed:', err));
      gameBridge.emit('action:shop_purchase', {
        itemId: food.id,
        category: 'food',
        quantity,
      });

      return { success: true };
    },

    buyEgg(eggId: string, quantity: number = 1): PurchaseResult {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return { success: false, reason: 'INVALID_QUANTITY' };
      }

      const egg = EGG_CATALOG[eggId];
      if (!egg) {
        return { success: false, reason: 'NOT_FOUND' };
      }

      const gameStore = useGameStore();
      if (gameStore.player.level < egg.playerLevelRequired) {
        return { success: false, reason: 'LEVEL_LOCKED' };
      }

      const totalCoins = egg.priceCoins * quantity;
      const totalGems = (egg.priceGems ?? 0) * quantity;
      if (gameStore.currencies.coins < totalCoins || gameStore.currencies.gems < totalGems) {
        return { success: false, reason: 'INSUFFICIENT_FUNDS' };
      }

      // Atomic mutation
      gameStore.currencies.coins -= totalCoins;
      gameStore.currencies.gems -= totalGems;
      const invStore = useInventoryStore();
      invStore.addItem({
        itemId: egg.id,
        category: 'eggs',
        name: egg.name,
        description: egg.description,
        quantity,
        stackable: true,
      });

      gameStore.persistSave().catch((err) => console.error('Save failed:', err));
      gameBridge.emit('action:shop_purchase', {
        itemId: egg.id,
        category: 'eggs',
        quantity,
      });

      return { success: true };
    },

    buyDecoration(decorationId: string, quantity: number = 1): PurchaseResult {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return { success: false, reason: 'INVALID_QUANTITY' };
      }

      const dec = DECORATION_CATALOG[decorationId];
      if (!dec) {
        return { success: false, reason: 'NOT_FOUND' };
      }

      const gameStore = useGameStore();
      if (gameStore.player.level < dec.playerLevelRequired) {
        return { success: false, reason: 'LEVEL_LOCKED' };
      }

      const totalCoins = dec.priceCoins * quantity;
      const totalGems = (dec.priceGems ?? 0) * quantity;
      if (gameStore.currencies.coins < totalCoins || gameStore.currencies.gems < totalGems) {
        return { success: false, reason: 'INSUFFICIENT_FUNDS' };
      }

      // Atomic mutation
      gameStore.currencies.coins -= totalCoins;
      gameStore.currencies.gems -= totalGems;
      const invStore = useInventoryStore();
      invStore.addItem({
        itemId: dec.id,
        category: 'decorations',
        name: dec.name,
        description: dec.description,
        quantity,
        stackable: true,
      });

      gameStore.persistSave().catch((err) => console.error('Save failed:', err));
      gameBridge.emit('action:shop_purchase', {
        itemId: dec.id,
        category: 'decorations',
        quantity,
      });

      return { success: true };
    },
  },
});
