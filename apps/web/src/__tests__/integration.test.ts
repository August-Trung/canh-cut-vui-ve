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
