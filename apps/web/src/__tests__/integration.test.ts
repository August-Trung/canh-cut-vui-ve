// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../App.vue';
import { useGameStore } from '../stores/gameStore';
import { useInventoryStore } from '../stores/inventoryStore';
import { useCollectionStore } from '../stores/collectionStore';
import { gameStorage } from '../services/StorageService';

vi.mock('../components/canvas/IslandCanvas.vue', () => ({
  default: {
    name: 'IslandCanvas',
    template: '<div id="mock-island-canvas"></div>',
  },
}));

describe('Phase 1 Integration - Complete Player Journey', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await gameStorage.clear();
  });

  it('completes the entire Phase 1 gameplay loop with save persistence and collection unlock', async () => {
    const game = useGameStore();
    await game.initGame();

    const inventory = useInventoryStore();
    const collection = useCollectionStore();

    // 1. Initial island loads default save with Snowy starter penguin
    expect(game.isLoaded).toBe(true);
    expect(game.ownedPenguins.length).toBe(1);
    const starterPenguin = game.ownedPenguins[0];
    expect(starterPenguin.speciesId).toBe('snowy');
    expect(starterPenguin.nickname).toBe('Snowy');
    expect(collection.discoveredCount).toBe(1);
    expect(collection.isDiscovered('snowy')).toBe(true);

    // Initial resources: 50 sardines, 1 basic egg
    expect(inventory.getItemCount('sardine')).toBe(50);
    expect(inventory.getItemCount('basic_egg')).toBe(1);
    expect(game.currencies.fish).toBe(0);

    // 2. Interact with penguin (Pet increases happiness/excitement, Feed consumes 1 sardine)
    const initialHappiness = starterPenguin.happiness;
    const petSuccess = game.petPenguin(starterPenguin.id);
    expect(petSuccess).toBe(true);
    expect(starterPenguin.happiness).toBe(Math.min(100, initialHappiness + 8));
    expect(starterPenguin.mood).toBe('happy');

    const feedSuccess = game.feedPenguin(starterPenguin.id);
    expect(feedSuccess).toBe(true);
    expect(inventory.getItemCount('sardine')).toBe(49);
    expect(game.currencies.fish).toBe(0);
    expect(starterPenguin.mood).toBe('happy');

    // 3. Place Basic Egg into Incubator Slot 1
    const slot1 = game.getSlotById(1);
    expect(slot1).toBeDefined();
    expect(slot1?.state).toBe('EMPTY');

    const placeSuccess = game.placeEggInIncubator(1, 'basic_egg');
    expect(placeSuccess).toBe(true);
    expect(slot1?.state).toBe('INCUBATING');
    expect(slot1?.eggTypeId).toBe('basic_egg');
    expect(inventory.getItemCount('basic_egg')).toBe(0);

    // 4. Timer elapses -> slot state transitions to READY_TO_HATCH
    // Set slot readyAt to the past and update incubator timers
    slot1!.readyAt = Date.now() - 1000;
    const timerChanged = game.updateIncubatorTimers();
    expect(timerChanged).toBe(true);
    expect(slot1?.state).toBe('READY_TO_HATCH');

    // 5. Hatch Egg with custom nickname
    const customNickname = 'Bé Cánh Cụt Nhỏ';
    const hatchedPenguin = game.hatchEgg(1, customNickname);
    expect(hatchedPenguin).toBeDefined();
    expect(hatchedPenguin?.nickname).toBe(customNickname);
    expect(hatchedPenguin?.speciesId).toBeDefined();
    expect(game.ownedPenguins.length).toBe(2);
    expect(slot1?.state).toBe('EMPTY');

    // 6. Verify newly hatched species is unlocked in collection book
    expect(collection.isDiscovered(hatchedPenguin!.speciesId)).toBe(true);
    expect(collection.discoveredCount).toBeGreaterThanOrEqual(1);

    // 7. Verify save persistence roundtrip through StorageService
    await game.persistSave();

    // Create fresh Pinia & new store instance to simulate reloading from storage
    setActivePinia(createPinia());
    const reloadedGame = useGameStore();
    await reloadedGame.initGame();

    const reloadedInventory = useInventoryStore();
    const reloadedCollection = useCollectionStore();

    expect(reloadedGame.isLoaded).toBe(true);
    expect(reloadedGame.ownedPenguins.length).toBe(2);
    const reloadedHatched = reloadedGame.ownedPenguins.find((p) => p.id === hatchedPenguin?.id);
    expect(reloadedHatched).toBeDefined();
    expect(reloadedHatched?.nickname).toBe(customNickname);
    expect(reloadedHatched?.speciesId).toBe(hatchedPenguin?.speciesId);

    expect(reloadedInventory.getItemCount('sardine')).toBe(49);
    expect(reloadedInventory.getItemCount('basic_egg')).toBe(0);
    expect(reloadedGame.currencies.fish).toBe(0);
    expect(reloadedCollection.isDiscovered(hatchedPenguin!.speciesId)).toBe(true);
    expect(reloadedGame.getSlotById(1)?.state).toBe('EMPTY');
  });

  it('verifies UI and GameBridge event integration across complete player journey with audio synthesis', async () => {
    const { soundService } = await import('../services/SoundService');
    const popSpy = vi.spyOn(soundService, 'playPop').mockImplementation(() => {});
    const chirpSpy = vi.spyOn(soundService, 'playChirp').mockImplementation(() => {});
    const eatSpy = vi.spyOn(soundService, 'playEat').mockImplementation(() => {});
    const fanfareSpy = vi.spyOn(soundService, 'playHatchFanfare').mockImplementation(() => {});

    const game = useGameStore();
    await game.initGame();

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    const { gameBridge } = await import('../game/bridge/GameBridge');
    const starterId = game.ownedPenguins[0].id;

    // 1. Establish canvas ready and verify world:sync emits initial penguins
    const syncHandler = vi.fn();
    gameBridge.on('world:sync', syncHandler);
    gameBridge.emit('canvas:ready');
    expect(syncHandler).toHaveBeenCalledWith({ penguins: game.ownedPenguins });

    // 2. Petting penguin triggers chirp audio chime
    game.petPenguin(starterId);
    gameBridge.emit('penguin:action', { ownedId: starterId, action: 'pet' });
    expect(chirpSpy).toHaveBeenCalled();

    // 3. Feeding penguin triggers eat audio chime and updates inventory
    game.feedPenguin(starterId);
    gameBridge.emit('penguin:action', { ownedId: starterId, action: 'feed' });
    expect(eatSpy).toHaveBeenCalled();
    expect(game.currencies.fish).toBe(0);

    // 4. Placing egg & readying
    game.placeEggInIncubator(1, 'basic_egg');
    const slot = game.getSlotById(1)!;
    slot.readyAt = Date.now() - 1000;
    game.updateIncubatorTimers();
    expect(slot.state).toBe('READY_TO_HATCH');

    // 5. Hatching via HatchModal triggers celebratory fanfare upon reveal
    const vm = wrapper.vm as unknown as { openHatchModal: (slotId: number) => void };
    vm.openHatchModal(1);
    await wrapper.vm.$nextTick();

    const hatchModal = wrapper.findComponent({ name: 'HatchModal' });
    expect(hatchModal.exists()).toBe(true);

    // Advance egg to reveal stage (wobble -> crack -> burst -> reveal)
    const egg = hatchModal.find('[data-testid="interactive-egg"]');
    await egg.trigger('click'); // crack
    await egg.trigger('click'); // burst
    await egg.trigger('click'); // reveal
    expect(fanfareSpy).toHaveBeenCalled();

    // Confirm hatch and welcome penguin to island
    const confirmBtn = hatchModal.find('[data-testid="hatch-confirm-btn"]');
    await confirmBtn.trigger('click');
    await wrapper.vm.$nextTick();

    // 6. Total penguin count is 2 and both exist on island
    expect(game.ownedPenguins.length).toBe(2);
  });
});

describe('Phase 2 Integration - Core Game Loop & Island Life', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await gameStorage.clear();
    const { gameBridge } = await import('../game/bridge/GameBridge');
    gameBridge.clear();
  });

  it('verifies the complete Phase 2 end-to-end player journey across all progression systems', async () => {
    const { useShopStore } = await import('../stores/shopStore');
    const { useDecorationStore } = await import('../stores/decorationStore');
    const { useQuestStore } = await import('../stores/questStore');
    const { getMaxFlockCapacity } = await import('../services/ProgressionService');

    // 1. Starter island with Snowy (Level 1, max capacity 2)
    const game = useGameStore();
    await game.initGame();
    const inv = useInventoryStore();
    const col = useCollectionStore();
    const shop = useShopStore();
    const decor = useDecorationStore();
    const quests = useQuestStore();
    quests.initQuests();

    expect(game.player.level).toBe(1);
    expect(getMaxFlockCapacity(game.player.level)).toBe(2);
    expect(game.ownedPenguins.length).toBe(1);
    const snowy = game.ownedPenguins[0];
    expect(snowy.speciesId).toBe('snowy');

    // 2. Pet Snowy -> grants Player EXP, happiness, strictly 0 Coins
    const initialCoins = game.currencies.coins;
    const initialPlayerExp = game.player.exp;
    const petRes = game.petPenguin(snowy.id);
    expect(petRes).toBe(true);
    expect(game.currencies.coins).toBe(initialCoins);
    expect(game.player.exp).toBe(initialPlayerExp + 2);

    // 3. Feed Snowy with Small Sardine (favorite food) -> hunger drops, happiness boosts, bonus Penguin EXP + coins
    snowy.hunger = 60;
    const initialPenguinExp = snowy.exp;
    const feedRes = game.feedPenguin(snowy.id, 'sardine');
    expect(feedRes).toBe(true);
    expect(snowy.hunger).toBeLessThan(60);
    expect(snowy.exp).toBe(initialPenguinExp + 15);
    expect(game.currencies.coins).toBe(initialCoins + 15);

    // 4. Purchase in Shop -> coins deducted, inventory updated atomically; failed purchase leaves currency and inventory unchanged
    game.currencies.coins = 1;
    const failPurchaseFunds = shop.buyFood('sardine', 1);
    expect(failPurchaseFunds.success).toBe(false);
    expect(failPurchaseFunds.reason).toBe('INSUFFICIENT_FUNDS');
    expect(game.currencies.coins).toBe(1);

    const failPurchaseLevel = shop.buyDecoration('bench_wood', 1);
    expect(failPurchaseLevel.success).toBe(false);
    expect(failPurchaseLevel.reason).toBe('LEVEL_LOCKED');

    game.currencies.coins = 1000;
    const buySardine = shop.buyFood('sardine', 2);
    expect(buySardine.success).toBe(true);
    expect(inv.getItemCount('sardine')).toBeGreaterThanOrEqual(2);
    expect(game.currencies.coins).toBe(1000 - 30);

    // 5. Place Wooden Bench on Plot 1 -> grants +15 Player EXP once, Cozy rating increases, coin multiplier applies. Removing and re-placing grants 0 EXP.
    inv.addItem({
      itemId: 'bench_wood',
      category: 'decorations',
      name: 'Ghế Gỗ Mùa Đông',
      description: '',
      quantity: 1,
      stackable: true,
    });
    const expBeforeDecor = game.player.exp;
    const placeRes = decor.placeDecoration(1, 'bench_wood');
    expect(placeRes).toBe(true);
    expect(game.player.exp).toBe(expBeforeDecor + 15);
    expect(decor.cozyRating).toBeGreaterThan(0);
    expect(decor.coinDropMultiplier).toBeGreaterThan(1.0);

    decor.removeDecoration(1);
    const expBeforeReplace = game.player.exp;
    const replaceRes = decor.placeDecoration(1, 'bench_wood');
    expect(replaceRes).toBe(true);
    expect(game.player.exp).toBe(expBeforeReplace); // Anti-exploit: +0 EXP

    // 6. Incubate Basic Egg -> Nurture speed-up decreases timer by 30s
    inv.addItem({ itemId: 'basic_egg', category: 'eggs', name: 'Basic Egg', description: '', quantity: 1, stackable: true });
    const placeEggRes = game.placeEggInIncubator(1, 'basic_egg');
    expect(placeEggRes).toBe(true);
    const slot1 = game.getSlotById(1)!;
    slot1.readyAt = Date.now() + 60000;
    slot1.targetHatchTime = slot1.readyAt;
    const originalReadyAt = slot1.targetHatchTime;
    const nurtureRes = game.nurtureEgg(1);
    expect(nurtureRes).toBe(true);
    expect(slot1.targetHatchTime ?? slot1.readyAt).toBe(originalReadyAt - 30000);

    // 7. Hatch egg -> checks flock capacity (now 2 penguins). Attempting to hatch a 3rd egg at Lv1 is blocked by flock capacity. Species is determined authoritatively without caller providing speciesId. pendingSpeciesId is properly cleared.
    slot1.readyAt = Date.now() - 1000;
    slot1.targetHatchTime = Date.now() - 1000;
    game.updateIncubatorTimers();
    expect(slot1.state).toBe('READY_TO_HATCH');

    const prep = game.prepareHatch(1);
    expect(prep.success).toBe(true);
    expect(slot1.pendingSpeciesId).toBeDefined();

    const penguin2 = game.hatchEgg(1, 'Penguin Two');
    expect(penguin2).not.toBeNull();
    expect(game.ownedPenguins.length).toBe(2);
    expect(slot1.pendingSpeciesId).toBeUndefined();

    // Now flock is full at Lv 1 (capacity = 2). Attempting to hatch 3rd egg is blocked:
    inv.addItem({ itemId: 'basic_egg', category: 'eggs', name: 'Basic Egg', description: '', quantity: 1, stackable: true });
    game.placeEggInIncubator(1, 'basic_egg');
    slot1.readyAt = Date.now() - 1000;
    slot1.targetHatchTime = Date.now() - 1000;
    game.updateIncubatorTimers();
    expect(slot1.state).toBe('READY_TO_HATCH');
    const blockedHatch = game.hatchEgg(1, 'Blocked Penguin');
    expect(blockedHatch).toBeNull();
    expect(game.ownedPenguins.length).toBe(2);

    // 8. Player earns EXP -> Level up to Level 2 -> capacity expands to 3, rewards granted.
    const rewards = game.addPlayerExp(100);
    expect(game.player.level).toBe(2);
    expect(getMaxFlockCapacity(game.player.level)).toBe(3);
    expect(rewards.length).toBeGreaterThan(0);

    // Player is now Level 2 -> can purchase Krill!
    const buyKrill = shop.buyFood('krill', 1);
    expect(buyKrill.success).toBe(true);
    expect(inv.getItemCount('krill')).toBeGreaterThanOrEqual(1);

    // Now 3rd penguin can hatch:
    const penguin3 = game.hatchEgg(1, 'Penguin Three');
    expect(penguin3).not.toBeNull();
    expect(game.ownedPenguins.length).toBe(3);

    // 9. Claim Day 1 login reward with getLocalDateString() -> Coins and sardines added
    expect(quests.canClaimDailyLogin).toBe(true);
    const coinsBeforeLogin = game.currencies.coins;
    const loginClaimed = quests.claimDailyLogin();
    expect(loginClaimed).toBe(true);
    expect(game.currencies.coins).toBeGreaterThan(coinsBeforeLogin);

    // 10. Claim completed Daily Quest -> EXP and Coins added
    const activeQuest = quests.activeQuests[0];
    expect(activeQuest).toBeDefined();
    activeQuest.currentCount = activeQuest.targetCount;
    activeQuest.isCompleted = true;
    const expBeforeQuest = game.player.exp;
    const questClaimed = quests.claimQuestReward(activeQuest.questId);
    expect(questClaimed).toBe(true);
    expect(game.player.exp).toBeGreaterThan(expBeforeQuest);

    // 11. Save to localStorage -> reload with simulated elapsed time -> verifies piecewise offline hunger/happiness decay (crossing hunger 80) and mood updates. Loading Level 2 save does not grant duplicate level-up rewards. Missing timestamps do not trigger historical decay.
    await game.persistSave();

    // Verify loading level 2 save directly does not re-grant level 2 rewards:
    const coinsBeforeReload = game.currencies.coins;
    setActivePinia(createPinia());
    const reloaded = useGameStore();
    await reloaded.initGame();
    expect(reloaded.player.level).toBe(2);
    expect(reloaded.currencies.coins).toBe(coinsBeforeReload); // No duplicate rewards

    // Test missing timestamp on penguin does NOT trigger historical starvation:
    const rawSave = (await gameStorage.load()) as any;
    rawSave.ownedPenguins[0].lastNeedsUpdateAt = 0;
    rawSave.ownedPenguins[0].hunger = 20;
    await gameStorage.save(rawSave);

    setActivePinia(createPinia());
    const reloadedSafe = useGameStore();
    await reloadedSafe.initGame();
    expect(reloadedSafe.ownedPenguins[0].hunger).toBe(20); // Not starved!

    // Test piecewise offline decay crossing hunger 80:
    const rawSave2 = (await gameStorage.load()) as any;
    const twoHoursAgo = Date.now() - 7200 * 1000;
    rawSave2.ownedPenguins[0].lastNeedsUpdateAt = twoHoursAgo;
    rawSave2.ownedPenguins[0].hunger = 50;
    rawSave2.ownedPenguins[0].happiness = 100;
    await gameStorage.save(rawSave2);

    setActivePinia(createPinia());
    const reloadedDecay = useGameStore();
    await reloadedDecay.initGame();
    expect(reloadedDecay.ownedPenguins[0].hunger).toBeGreaterThan(80);
    expect(reloadedDecay.ownedPenguins[0].happiness).toBeLessThan(100);
    expect(reloadedDecay.ownedPenguins[0].mood).toBe('hungry');
  });
});
