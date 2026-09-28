import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useQuestStore } from '../questStore';
import { useGameStore } from '../gameStore';
import { useInventoryStore } from '../inventoryStore';
import { gameBridge } from '../../game/bridge/GameBridge';
import { getLocalDateString } from '../../services/QuestService';

describe('useQuestStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
  });

  afterEach(() => {
    const questStore = useQuestStore();
    questStore.cleanupListeners();
  });

  describe('Daily Login', () => {
    it('claims Day 1 on fresh save and awards Day 1 rewards (100 coins + 5 sardines)', () => {
      const gameStore = useGameStore();
      const invStore = useInventoryStore();
      const questStore = useQuestStore();

      gameStore.currencies.coins = 50;
      gameStore.dailyLogin = {
        lastClaimDate: null,
        currentStreak: 0,
      };

      const today = '2026-09-28';
      const claimed = questStore.claimDailyLogin(today, '2026-09-27');
      expect(claimed).toBe(true);

      expect(gameStore.dailyLogin.currentStreak).toBe(1);
      expect(gameStore.dailyLogin.lastClaimDate).toBe(today);
      expect(gameStore.currencies.coins).toBe(150); // 50 + 100
      expect(invStore.getItemCount('sardine')).toBe(5);
    });

    it('rejects same-day second claim', () => {
      const gameStore = useGameStore();
      const questStore = useQuestStore();

      const today = '2026-09-28';
      gameStore.dailyLogin = {
        lastClaimDate: today,
        currentStreak: 1,
      };

      const claimed = questStore.claimDailyLogin(today, '2026-09-27');
      expect(claimed).toBe(false);
    });

    it('advances streak to Day 2 on consecutive day claim', () => {
      const gameStore = useGameStore();
      const invStore = useInventoryStore();
      const questStore = useQuestStore();

      gameStore.currencies.coins = 100;
      gameStore.dailyLogin = {
        lastClaimDate: '2026-09-27',
        currentStreak: 1,
      };

      const claimed = questStore.claimDailyLogin('2026-09-28', '2026-09-27');
      expect(claimed).toBe(true);
      expect(gameStore.dailyLogin.currentStreak).toBe(2);
      expect(gameStore.dailyLogin.lastClaimDate).toBe('2026-09-28');
      expect(gameStore.currencies.coins).toBe(250); // 100 + 150
      expect(invStore.getItemCount('basic_egg')).toBe(1);
    });

    it('resets streak to Day 1 on missed day', () => {
      const gameStore = useGameStore();
      const questStore = useQuestStore();

      gameStore.dailyLogin = {
        lastClaimDate: '2026-09-20',
        currentStreak: 4,
      };

      const claimed = questStore.claimDailyLogin('2026-09-28', '2026-09-27');
      expect(claimed).toBe(true);
      expect(gameStore.dailyLogin.currentStreak).toBe(1);
      expect(gameStore.dailyLogin.lastClaimDate).toBe('2026-09-28');
    });

    it('loops back to Day 1 after claiming on Day 7', () => {
      const gameStore = useGameStore();
      const questStore = useQuestStore();

      gameStore.dailyLogin = {
        lastClaimDate: '2026-09-27',
        currentStreak: 7,
      };

      const claimed = questStore.claimDailyLogin('2026-09-28', '2026-09-27');
      expect(claimed).toBe(true);
      expect(gameStore.dailyLogin.currentStreak).toBe(1);
    });
  });

  describe('Decoupled Quest Actions Observer', () => {
    it('observes GameBridge events and increments matching quest progress', () => {
      const gameStore = useGameStore();
      const questStore = useQuestStore();

      gameStore.questState = {
        assignedDate: '2026-09-28',
        quests: [
          { questId: 'quest_pet', currentCount: 0, targetCount: 5, isCompleted: false, isClaimed: false },
          { questId: 'quest_feed', currentCount: 0, targetCount: 3, isCompleted: false, isClaimed: false },
          { questId: 'quest_hatch', currentCount: 0, targetCount: 1, isCompleted: false, isClaimed: false },
          { questId: 'quest_shop', currentCount: 0, targetCount: 2, isCompleted: false, isClaimed: false },
          { questId: 'quest_decorate', currentCount: 0, targetCount: 1, isCompleted: false, isClaimed: false },
        ],
      };

      questStore.setupListeners();

      // Emit action:pet
      gameBridge.emit('action:pet', { ownedId: 'p1', penguin: {} as any });
      expect(questStore.activeQuests.find((q) => q.questId === 'quest_pet')?.currentCount).toBe(1);

      // Emit action:feed
      gameBridge.emit('action:feed', { ownedId: 'p1', foodId: 'sardine', penguin: {} as any });
      expect(questStore.activeQuests.find((q) => q.questId === 'quest_feed')?.currentCount).toBe(1);

      // Emit action:hatch
      gameBridge.emit('action:hatch', { ownedId: 'p2', penguin: {} as any });
      const hatchQuest = questStore.activeQuests.find((q) => q.questId === 'quest_hatch');
      expect(hatchQuest?.currentCount).toBe(1);
      expect(hatchQuest?.isCompleted).toBe(true);

      // Emit action:shop_purchase
      gameBridge.emit('action:shop_purchase', { itemId: 'sardine', category: 'food', quantity: 1 });
      expect(questStore.activeQuests.find((q) => q.questId === 'quest_shop')?.currentCount).toBe(1);

      // Emit action:decorate
      gameBridge.emit('action:decorate', { plotId: 1, decorationId: 'bench_wood' });
      const decorQuest = questStore.activeQuests.find((q) => q.questId === 'quest_decorate');
      expect(decorQuest?.currentCount).toBe(1);
      expect(decorQuest?.isCompleted).toBe(true);
    });

    it('claims completed quest reward and awards coins, exp, and gems', () => {
      const gameStore = useGameStore();
      const questStore = useQuestStore();

      gameStore.currencies.coins = 100;
      gameStore.currencies.gems = 0;
      gameStore.player.exp = 0;
      gameStore.player.level = 1;

      gameStore.questState = {
        assignedDate: '2026-09-28',
        quests: [
          { questId: 'quest_hatch', currentCount: 1, targetCount: 1, isCompleted: true, isClaimed: false },
        ],
      };

      const result = questStore.claimQuestReward('quest_hatch');
      expect(result).toBe(true);

      // quest_hatch: rewardCoins: 100, rewardExp: 50, rewardGems: 1
      expect(gameStore.currencies.coins).toBe(200);
      expect(gameStore.currencies.gems).toBe(1);
      expect(gameStore.player.exp).toBe(50);
      expect(questStore.activeQuests[0].isClaimed).toBe(true);

      // Second claim should fail
      expect(questStore.claimQuestReward('quest_hatch')).toBe(false);
    });

    it('rejects claiming incomplete quest', () => {
      const gameStore = useGameStore();
      const questStore = useQuestStore();

      gameStore.questState = {
        assignedDate: '2026-09-28',
        quests: [
          { questId: 'quest_pet', currentCount: 2, targetCount: 5, isCompleted: false, isClaimed: false },
        ],
      };

      expect(questStore.claimQuestReward('quest_pet')).toBe(false);
    });
  });

  describe('initQuests', () => {
    it('initializes deterministic quests for the day if not assigned', () => {
      const gameStore = useGameStore();
      const questStore = useQuestStore();

      gameStore.questState = {
        assignedDate: '',
        quests: [],
      };

      questStore.initQuests('2026-09-28');
      expect(questStore.activeQuests).toHaveLength(3);
      expect(gameStore.questState.assignedDate).toBe('2026-09-28');
    });

    it('does not re-roll quests if date matches', () => {
      const gameStore = useGameStore();
      const questStore = useQuestStore();

      const existingQuests = [
        { questId: 'quest_pet', currentCount: 3, targetCount: 5, isCompleted: false, isClaimed: false },
      ];
      gameStore.questState = {
        assignedDate: '2026-09-28',
        quests: existingQuests,
      };

      questStore.initQuests('2026-09-28');
      expect(questStore.activeQuests).toHaveLength(1);
      expect(questStore.activeQuests[0].currentCount).toBe(3);
    });
  });
});
