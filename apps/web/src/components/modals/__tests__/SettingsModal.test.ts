// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
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
});
