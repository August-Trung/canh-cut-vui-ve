// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SettingsModal from '../SettingsModal.vue';
import { useGameStore } from '../../../stores/gameStore';

describe('SettingsModal.vue', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const game = useGameStore();
    await game.initGame();
  });

  it('renders settings options: sound toggle, export/import and reset buttons', () => {
    const wrapper = mount(SettingsModal);

    expect(wrapper.find('[data-testid="toggle-audio-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="btn-export-save"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="btn-import-save"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="btn-reset-save"]').exists()).toBe(true);
  });

  it('toggles audio muted state when sound toggle is clicked', async () => {
    const game = useGameStore();
    const toggleSpy = vi.spyOn(game, 'toggleAudio');

    const wrapper = mount(SettingsModal);
    await wrapper.find('[data-testid="toggle-audio-btn"]').trigger('click');

    expect(toggleSpy).toHaveBeenCalled();
  });

  it('requires explicit confirmation before resetting save (does not reset on initial click)', async () => {
    const game = useGameStore();
    const resetSpy = vi.spyOn(game, 'resetSave').mockResolvedValue();

    const wrapper = mount(SettingsModal);

    // Initial click on reset button
    const resetBtn = wrapper.find('[data-testid="btn-reset-save"]');
    await resetBtn.trigger('click');

    // Confirm modal should appear, resetSave should NOT have been called yet
    expect(resetSpy).not.toHaveBeenCalled();
    const confirmModal = wrapper.findComponent({ name: 'ConfirmModal' });
    expect(confirmModal.exists()).toBe(true);

    // Confirm the action
    await confirmModal.vm.$emit('confirm');
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });

  it('cancels reset without calling resetSave when confirm modal cancels', async () => {
    const game = useGameStore();
    const resetSpy = vi.spyOn(game, 'resetSave').mockResolvedValue();

    const wrapper = mount(SettingsModal);
    await wrapper.find('[data-testid="btn-reset-save"]').trigger('click');

    const confirmModal = wrapper.findComponent({ name: 'ConfirmModal' });
    expect(confirmModal.exists()).toBe(true);

    await confirmModal.vm.$emit('cancel');
    expect(resetSpy).not.toHaveBeenCalled();
    expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(false);
  });

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(SettingsModal);

    const closeBtn = wrapper.find('[data-testid="modal-close-btn"]');
    await closeBtn.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits world:sync and sync event when save is reset', async () => {
    const { gameBridge } = await import('../../../game/bridge/GameBridge');
    const bridgeSpy = vi.spyOn(gameBridge, 'emit');

    const wrapper = mount(SettingsModal);
    await wrapper.find('[data-testid="btn-reset-save"]').trigger('click');

    const confirmModal = wrapper.findComponent({ name: 'ConfirmModal' });
    await confirmModal.vm.$emit('confirm');
    await flushPromises();

    expect(wrapper.emitted('sync')).toBeTruthy();
    expect(bridgeSpy).toHaveBeenCalledWith('world:sync', expect.objectContaining({
      penguins: expect.any(Array),
    }));
  });

  it('emits world:sync and sync event when save is imported', async () => {
    const { gameBridge } = await import('../../../game/bridge/GameBridge');
    const bridgeSpy = vi.spyOn(gameBridge, 'emit');
    const game = useGameStore();

    const wrapper = mount(SettingsModal);
    await wrapper.find('[data-testid="btn-import-save"]').trigger('click');

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);

    const validSave = {
      schemaVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      player: { id: 'p1', displayName: 'Captain', level: 2, experience: 0 },
      currencies: { fish: 100, diamonds: 5 },
      inventory: [],
      ownedPenguins: game.ownedPenguins,
      collectionBook: ['snowy'],
      incubatorSlots: game.incubatorSlots,
      islandState: { islandLevel: 1, theme: 'winter_starter', decorationsPlaced: [] },
    };

    await textarea.setValue(JSON.stringify(validSave));
    const confirmBtn = wrapper.findAll('button').find((b) => b.text().includes('Xác Nhận Nhập'));
    expect(confirmBtn).toBeDefined();
    await confirmBtn!.trigger('click');
    await flushPromises();

    expect(wrapper.emitted('sync')).toBeTruthy();
    expect(bridgeSpy).toHaveBeenCalledWith('world:sync', expect.objectContaining({
      penguins: expect.any(Array),
    }));
  });
});
