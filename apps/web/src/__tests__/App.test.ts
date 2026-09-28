// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../App.vue';
import { useGameStore } from '../stores/gameStore';
import { gameBridge } from '../game/bridge/GameBridge';

vi.mock('../components/canvas/IslandCanvas.vue', () => ({
  default: {
    name: 'IslandCanvas',
    template: '<div id="mock-island-canvas"></div>',
  },
}));

describe('App Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    gameBridge.clear();
  });

  it('mounts and initializes gameStore on mounted', async () => {
    const game = useGameStore();
    const initSpy = vi.spyOn(game, 'initGame').mockResolvedValue();

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    expect(initSpy).toHaveBeenCalled();
  });

  it('renders top HUD, canvas mock, and bottom dock elements', () => {
    const wrapper = mount(App);

    expect(wrapper.find('#mock-island-canvas').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'TopBar' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ShelfRack' }).exists()).toBe(true);
  });

  it('opens modals via ShelfRack events and renders corresponding modal components', async () => {
    const wrapper = mount(App);
    const shelfRack = wrapper.findComponent({ name: 'ShelfRack' });

    const vm = wrapper.vm as unknown as { activeModal: string | null; closeModal: () => void };

    // Inventory
    await shelfRack.vm.$emit('open-inventory');
    expect(vm.activeModal).toBe('inventory');
    expect(wrapper.findComponent({ name: 'InventoryModal' }).exists()).toBe(true);

    // Collection
    await shelfRack.vm.$emit('open-collection');
    expect(vm.activeModal).toBe('collection');
    expect(wrapper.findComponent({ name: 'CollectionModal' }).exists()).toBe(true);

    // Hatchery
    await shelfRack.vm.$emit('open-hatchery');
    expect(vm.activeModal).toBe('hatchery');
    expect(wrapper.findComponent({ name: 'HatcheryModal' }).exists()).toBe(true);

    // Settings
    await shelfRack.vm.$emit('open-settings');
    expect(vm.activeModal).toBe('settings');
    expect(wrapper.findComponent({ name: 'SettingsModal' }).exists()).toBe(true);

    // Close
    vm.closeModal();
    await wrapper.vm.$nextTick();
    expect(vm.activeModal).toBeNull();
  });

  it('opens PenguinInspectModal when penguin:clicked event is emitted from gameBridge', async () => {
    const game = useGameStore();
    await game.initGame();

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    const penguinId = game.ownedPenguins[0].id;
    gameBridge.emit('penguin:clicked', { ownedId: penguinId });
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as unknown as { activeModal: string | null; inspectedPenguinId: string | null };
    expect(vm.activeModal).toBe('inspect');
    expect(vm.inspectedPenguinId).toBe(penguinId);
    expect(wrapper.findComponent({ name: 'PenguinInspectModal' }).exists()).toBe(true);
  });

  it('opens HatchModal or HatcheryModal when egg:clicked event is emitted from gameBridge', async () => {
    const game = useGameStore();
    await game.initGame();

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    // Slot 1 is EMPTY initially -> opens hatchery
    gameBridge.emit('egg:clicked', { slotId: 1 });
    await wrapper.vm.$nextTick();
    const vm = wrapper.vm as unknown as { activeModal: string | null; activeHatchSlotId: number };
    expect(vm.activeModal).toBe('hatchery');

    // Slot 2 ready to hatch -> opens hatch modal
    const slot2 = game.incubatorSlots.find((s) => s.slotId === 2)!;
    slot2.state = 'READY_TO_HATCH';
    slot2.eggTypeId = 'basic_egg';

    gameBridge.emit('egg:clicked', { slotId: 2 });
    await wrapper.vm.$nextTick();
    expect(vm.activeModal).toBe('hatch');
    expect(vm.activeHatchSlotId).toBe(2);
    expect(wrapper.findComponent({ name: 'HatchModal' }).exists()).toBe(true);
  });

  it('triggers soundService chimes on interactions and GameBridge events', async () => {
    const { soundService } = await import('../services/SoundService');
    const popSpy = vi.spyOn(soundService, 'playPop').mockImplementation(() => {});
    const chirpSpy = vi.spyOn(soundService, 'playChirp').mockImplementation(() => {});
    const eatSpy = vi.spyOn(soundService, 'playEat').mockImplementation(() => {});
    const fanfareSpy = vi.spyOn(soundService, 'playHatchFanfare').mockImplementation(() => {});

    const game = useGameStore();
    await game.initGame();

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    const vm = wrapper.vm as unknown as { openModal: (m: string) => void; closeModal: () => void };

    // Modal open and close trigger pop
    vm.openModal('inventory');
    expect(popSpy).toHaveBeenCalled();
    popSpy.mockClear();

    vm.closeModal();
    expect(popSpy).toHaveBeenCalled();

    // Penguin pet action triggers chirp
    gameBridge.emit('penguin:action', { ownedId: 'p-1', action: 'pet' });
    expect(chirpSpy).toHaveBeenCalled();

    // Penguin feed action triggers eat sound
    gameBridge.emit('penguin:action', { ownedId: 'p-1', action: 'feed' });
    expect(eatSpy).toHaveBeenCalled();

    // Fanfare is deduplicated and NOT played in App.vue on penguin:spawn
    gameBridge.emit('penguin:spawn', { penguin: game.ownedPenguins[0] });
    expect(fanfareSpy).not.toHaveBeenCalled();
  });

  it('synchronizes owned penguins to Phaser canvas via world:sync when canvas:ready fires', async () => {
    const game = useGameStore();
    await game.initGame();

    const syncHandler = vi.fn();
    gameBridge.on('world:sync', syncHandler);

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    // Before canvas:ready, world:sync has not fired
    expect(syncHandler).not.toHaveBeenCalled();

    // Canvas signals it is ready
    gameBridge.emit('canvas:ready');
    await wrapper.vm.$nextTick();

    expect(syncHandler).toHaveBeenCalledTimes(1);
    expect(syncHandler).toHaveBeenCalledWith({
      penguins: game.ownedPenguins,
    });
  });

  it('synchronizes penguins when canvas:ready fires before initGame finishes', async () => {
    const game = useGameStore();
    let resolveInit: () => void;
    const initPromise = new Promise<void>((resolve) => {
      resolveInit = resolve;
    });
    vi.spyOn(game, 'initGame').mockImplementation(async () => {
      await initPromise;
      game.isLoaded = true;
    });

    const syncHandler = vi.fn();
    gameBridge.on('world:sync', syncHandler);

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    // canvas:ready fires while initGame is still pending
    gameBridge.emit('canvas:ready');
    await wrapper.vm.$nextTick();
    expect(syncHandler).not.toHaveBeenCalled();

    // Now initGame completes
    resolveInit!();
    await flushPromises();

    expect(syncHandler).toHaveBeenCalledTimes(1);
    expect(syncHandler).toHaveBeenCalledWith({
      penguins: game.ownedPenguins,
    });
  });

  it('triggers world:sync when SettingsModal emits sync event', async () => {
    const game = useGameStore();
    await game.initGame();

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    // Establish canvas readiness
    gameBridge.emit('canvas:ready');
    await wrapper.vm.$nextTick();

    const syncHandler = vi.fn();
    gameBridge.on('world:sync', syncHandler);

    // Open settings modal
    const vm = wrapper.vm as unknown as { openModal: (m: string) => void };
    vm.openModal('settings');
    await wrapper.vm.$nextTick();

    const settingsModal = wrapper.findComponent({ name: 'SettingsModal' });
    expect(settingsModal.exists()).toBe(true);

    // Emit sync from SettingsModal
    await settingsModal.vm.$emit('sync');
    expect(syncHandler).toHaveBeenCalledWith({
      penguins: game.ownedPenguins,
    });
  });

  it('synchronizes nest state via nest:sync with EMPTY slot when canvas:ready fires', async () => {
    const game = useGameStore();
    await game.initGame();

    const nestSyncHandler = vi.fn();
    gameBridge.on('nest:sync', nestSyncHandler);

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    // Canvas signals readiness
    gameBridge.emit('canvas:ready');
    await wrapper.vm.$nextTick();

    expect(nestSyncHandler).toHaveBeenCalledWith({
      slot: expect.objectContaining({ slotId: 1, state: 'EMPTY' }),
    });
  });

  it('emits nest:sync when an egg is placed into slot 1', async () => {
    const game = useGameStore();
    await game.initGame();

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    // Establish canvas readiness
    gameBridge.emit('canvas:ready');
    await wrapper.vm.$nextTick();

    const nestSyncHandler = vi.fn();
    gameBridge.on('nest:sync', nestSyncHandler);

    // Place basic_egg into slot 1
    game.placeEggInIncubator(1, 'basic_egg');
    await wrapper.vm.$nextTick();

    expect(nestSyncHandler).toHaveBeenCalledWith({
      slot: expect.objectContaining({
        slotId: 1,
        state: 'INCUBATING',
        eggTypeId: 'basic_egg',
      }),
    });
  });

  it('restores incubating egg in nest on startup when save data contains an incubating egg', async () => {
    const game = useGameStore();
    await game.initGame();

    // Set slot 1 to incubating with a frozen_egg
    const slot = game.getSlotById(1)!;
    slot.state = 'INCUBATING';
    slot.eggTypeId = 'frozen_egg';
    await game.persistSave();

    const nestSyncHandler = vi.fn();
    gameBridge.on('nest:sync', nestSyncHandler);

    const wrapper = mount(App);
    await wrapper.vm.$nextTick();

    gameBridge.emit('canvas:ready');
    await wrapper.vm.$nextTick();

    expect(nestSyncHandler).toHaveBeenCalledWith({
      slot: expect.objectContaining({
        slotId: 1,
        state: 'INCUBATING',
        eggTypeId: 'frozen_egg',
      }),
    });
  });
});
