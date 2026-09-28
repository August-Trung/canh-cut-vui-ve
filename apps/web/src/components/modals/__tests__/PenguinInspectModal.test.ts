// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PenguinInspectModal from '../PenguinInspectModal.vue';
import { useGameStore } from '../../../stores/gameStore';
import { useInventoryStore } from '../../../stores/inventoryStore';
import { gameBridge } from '../../../game/bridge/GameBridge';

describe('PenguinInspectModal.vue', () => {
  let penguinId: string;

  beforeEach(async () => {
    setActivePinia(createPinia());
    const game = useGameStore();
    await game.initGame();

    // Ensure we have a test penguin
    const penguin = game.ownedPenguins[0];
    penguinId = penguin.id;
  });

  it('renders penguin details: nickname, species name, mood, happiness and hunger bars', () => {
    const game = useGameStore();
    const penguin = game.getPenguinById(penguinId)!;
    penguin.nickname = 'Cánh Cụt Con';
    penguin.happiness = 75;
    penguin.hunger = 30;
    penguin.mood = 'happy';

    const wrapper = mount(PenguinInspectModal, {
      props: { penguinId },
    });

    expect(wrapper.find('[data-testid="inspect-nickname"]').text()).toContain('Cánh Cụt Con');
    expect(wrapper.find('[data-testid="inspect-species"]').text()).toContain('Snowy');
    expect(wrapper.find('[data-testid="inspect-mood"]').text()).toContain('happy');
    expect(wrapper.find('[data-testid="bar-happiness"]').attributes('aria-valuenow')).toBe('75');
    expect(wrapper.find('[data-testid="bar-hunger"]').attributes('aria-valuenow')).toBe('30');
  });

  it('calls gameStore.petPenguin and emits penguin:action pet when "Vuốt Ve" is clicked', async () => {
    const game = useGameStore();
    const petSpy = vi.spyOn(game, 'petPenguin');
    const bridgeSpy = vi.spyOn(gameBridge, 'emit');

    const wrapper = mount(PenguinInspectModal, {
      props: { penguinId },
    });

    const petBtn = wrapper.find('[data-testid="btn-action-pet"]');
    await petBtn.trigger('click');

    expect(petSpy).toHaveBeenCalledWith(penguinId);
    expect(bridgeSpy).toHaveBeenCalledWith('penguin:action', {
      ownedId: penguinId,
      action: 'pet',
    });
  });

  it('consumes fish and emits penguin:action feed when "Cho Ăn Cá" is clicked', async () => {
    const game = useGameStore();
    const invStore = useInventoryStore();
    invStore.setItemCount('sardine', 5);

    const feedSpy = vi.spyOn(game, 'feedPenguin');
    const bridgeSpy = vi.spyOn(gameBridge, 'emit');

    const wrapper = mount(PenguinInspectModal, {
      props: { penguinId },
    });

    const feedBtn = wrapper.find('[data-testid="btn-action-feed"]');
    await feedBtn.trigger('click');

    expect(feedSpy).toHaveBeenCalledWith(penguinId, 'sardine');
    expect(bridgeSpy).toHaveBeenCalledWith('penguin:action', {
      ownedId: penguinId,
      action: 'feed',
    });
  });

  it('shows out-of-food toast and prevents feeding when food count is 0', async () => {
    const game = useGameStore();
    const invStore = useInventoryStore();
    invStore.setItemCount('sardine', 0);

    const feedSpy = vi.spyOn(game, 'feedPenguin');

    const wrapper = mount(PenguinInspectModal, {
      props: { penguinId },
    });

    const feedBtn = wrapper.find('[data-testid="btn-action-feed"]');
    await feedBtn.trigger('click');

    expect(feedSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Hết Cá Mòi');
  });

  it('allows selecting different foods from the food drawer', async () => {
    const game = useGameStore();
    const invStore = useInventoryStore();
    invStore.setItemCount('krill', 3);

    const feedSpy = vi.spyOn(game, 'feedPenguin');

    const wrapper = mount(PenguinInspectModal, {
      props: { penguinId },
    });

    // Click krill chip
    await wrapper.find('[data-testid="food-chip-krill"]').trigger('click');

    // Click feed button
    await wrapper.find('[data-testid="btn-action-feed"]').trigger('click');

    expect(feedSpy).toHaveBeenCalledWith(penguinId, 'krill');
  });

  it('emits close event when close button or backdrop is clicked', async () => {
    const wrapper = mount(PenguinInspectModal, {
      props: { penguinId },
    });

    const closeBtn = wrapper.find('[data-testid="modal-close-btn"]');
    await closeBtn.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();

    const backdrop = wrapper.find('[data-testid="modal-backdrop"]');
    await backdrop.trigger('click');
    expect(wrapper.emitted('close')?.length).toBe(2);
  });
});

