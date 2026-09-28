import { defineStore } from 'pinia';
import { ActiveQuest, DailyLoginState, ItemCategory } from '@penguin/types';
import { QUEST_POOL } from '@penguin/game-data';
import {
  getLocalDateString,
  getDeterministicDailyQuests,
  evaluateLoginStreak,
  LOGIN_STREAK_REWARDS,
} from '../services/QuestService';
import { gameBridge } from '../game/bridge/GameBridge';
import { useGameStore } from './gameStore';
import { useInventoryStore } from './inventoryStore';

let bridgeUnsubscribers: (() => void)[] = [];

export const useQuestStore = defineStore('quests', {
  state: () => ({
    isListening: false,
  }),

  getters: {
    loginState(): DailyLoginState {
      const gameStore = useGameStore();
      return gameStore.dailyLogin;
    },

    activeQuests(): ActiveQuest[] {
      const gameStore = useGameStore();
      return gameStore.questState.quests;
    },

    canClaimDailyLogin(): boolean {
      const gameStore = useGameStore();
      const today = getLocalDateString();
      const yesterday = getLocalDateString(new Date(Date.now() - 86400000));
      return evaluateLoginStreak(gameStore.dailyLogin, today, yesterday).canClaim;
    },
  },

  actions: {
    initQuests(todayStr?: string): void {
      const gameStore = useGameStore();
      const today = todayStr || getLocalDateString();

      if (gameStore.questState.assignedDate !== today || gameStore.questState.quests.length === 0) {
        gameStore.questState.assignedDate = today;
        gameStore.questState.quests = getDeterministicDailyQuests(today);
        gameStore.persistSave();
      }

      this.setupListeners();
    },

    setupListeners(): void {
      if (this.isListening) {
        return;
      }

      this.cleanupListeners();

      const unsubPet = gameBridge.on('action:pet', () => {
        this.recordAction('pet');
      });

      const unsubFeed = gameBridge.on('action:feed', () => {
        this.recordAction('feed');
      });

      const unsubHatch = gameBridge.on('action:hatch', () => {
        this.recordAction('hatch');
      });

      const unsubShop = gameBridge.on('action:shop_purchase', (payload) => {
        this.recordAction('buy_shop', payload.quantity || 1);
      });

      const unsubDecor = gameBridge.on('action:decorate', () => {
        this.recordAction('place_decoration');
      });

      bridgeUnsubscribers = [unsubPet, unsubFeed, unsubHatch, unsubShop, unsubDecor];
      this.isListening = true;
    },

    cleanupListeners(): void {
      for (const unsub of bridgeUnsubscribers) {
        unsub();
      }
      bridgeUnsubscribers = [];
      this.isListening = false;
    },

    recordAction(targetType: string, amount = 1): void {
      const gameStore = useGameStore();
      let hasChanges = false;

      for (const quest of gameStore.questState.quests) {
        if (quest.isCompleted) continue;

        const template = QUEST_POOL.find((t) => t.id === quest.questId);
        if (template && template.targetType === targetType) {
          quest.currentCount = Math.min(quest.targetCount, quest.currentCount + amount);
          if (quest.currentCount >= quest.targetCount) {
            quest.isCompleted = true;
          }
          hasChanges = true;
        }
      }

      if (hasChanges) {
        gameStore.persistSave();
      }
    },

    claimDailyLogin(customToday?: string, customYesterday?: string): boolean {
      const gameStore = useGameStore();
      const invStore = useInventoryStore();

      const today = customToday || getLocalDateString();
      const yesterday = customYesterday || getLocalDateString(new Date(Date.now() - 86400000));

      const evaluation = evaluateLoginStreak(gameStore.dailyLogin, today, yesterday);
      if (!evaluation.canClaim) {
        return false;
      }

      const streakToClaim = evaluation.nextStreak;
      const reward = LOGIN_STREAK_REWARDS.find((r) => r.day === streakToClaim);

      if (reward) {
        gameStore.currencies.coins += reward.coins;
        if (reward.gems) {
          gameStore.currencies.gems += reward.gems;
        }

        for (const item of reward.items) {
          const category: ItemCategory = item.itemId.includes('egg') ? 'eggs' : 'food';
          invStore.addItem({
            itemId: item.itemId,
            category,
            name: item.itemId,
            description: '',
            quantity: item.quantity,
            stackable: true,
          });
        }
      }

      gameStore.dailyLogin.lastClaimDate = today;
      gameStore.dailyLogin.currentStreak = streakToClaim;
      gameStore.persistSave();

      return true;
    },

    claimQuestReward(questId: string): boolean {
      const gameStore = useGameStore();
      const quest = gameStore.questState.quests.find((q) => q.questId === questId);

      if (!quest || !quest.isCompleted || quest.isClaimed) {
        return false;
      }

      const template = QUEST_POOL.find((t) => t.id === questId);
      if (!template) {
        return false;
      }

      gameStore.currencies.coins += template.rewardCoins;
      if (template.rewardGems) {
        gameStore.currencies.gems += template.rewardGems;
      }
      if (template.rewardExp) {
        gameStore.addPlayerExp(template.rewardExp);
      }

      quest.isClaimed = true;
      gameStore.persistSave();

      return true;
    },
  },
});
