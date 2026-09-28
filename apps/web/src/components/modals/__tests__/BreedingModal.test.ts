// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import BreedingModal from '../BreedingModal.vue';
import { useGameStore } from '../../../stores/gameStore';
import { useBreedingStore } from '../../../stores/breedingStore';
import type { OwnedPenguin } from '@penguin/types';

function createMockPenguin(id: string, nickname: string, level = 3, lastBredAt = 0): OwnedPenguin {
  return {
    id,
    speciesId: 'snowy',
    nickname,
    level,
    exp: 50,
    experience: 50,
    hunger: 20,
    happiness: 80,
    mood: 'happy',
    lastPetAt: Date.now() - 100000,
    lastFedAt: Date.now() - 100000,
    lastNeedsUpdateAt: Date.now() - 100000,
    traits: ['curious'],
    personality: 'adventurous',
    lastBredAt,
  };
}

describe('BreedingModal.vue', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const game = useGameStore();
    await game.initGame();
  });

  it('renders idle breeding interface with empty parent slots', () => {
    const wrapper = mount(BreedingModal);

    expect(wrapper.find('[data-testid="parent-a-slot"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="parent-b-slot"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="btn-start-breeding"]').attributes('disabled')).toBeDefined();
  });

  it('allows selecting eligible parents and displays preview', async () => {
    const game = useGameStore();
    game.currencies.coins = 500;
    game.currencies.gems = 10;
    const p1 = createMockPenguin('p1', 'Penguin Mom', 4);
    const p2 = createMockPenguin('p2', 'Penguin Dad', 5);
    game.ownedPenguins = [p1, p2];

    const wrapper = mount(BreedingModal);

    // Click slot A to open picker
    await wrapper.find('[data-testid="parent-a-slot"]').trigger('click');
    expect(wrapper.find('[data-testid="penguin-picker-panel"]').exists()).toBe(true);

    // Select p1
    await wrapper.find('[data-testid="picker-penguin-p1"]').trigger('click');
    expect(wrapper.find('[data-testid="parent-a-slot"]').text()).toContain('Penguin Mom');

    // Click slot B to open picker
    await wrapper.find('[data-testid="parent-b-slot"]').trigger('click');
    // Select p2
    await wrapper.find('[data-testid="picker-penguin-p2"]').trigger('click');
    expect(wrapper.find('[data-testid="parent-b-slot"]').text()).toContain('Penguin Dad');

    // Start button should now be enabled
    const startBtn = wrapper.find('[data-testid="btn-start-breeding"]');
    expect(startBtn.attributes('disabled')).toBeUndefined();
  });

  it('triggers startBreeding and displays BREEDING countdown state', async () => {
    const game = useGameStore();
    game.currencies.coins = 500;
    game.currencies.gems = 10;
    const p1 = createMockPenguin('p1', 'Penguin Mom', 4);
    const p2 = createMockPenguin('p2', 'Penguin Dad', 5);
    game.ownedPenguins = [p1, p2];

    const wrapper = mount(BreedingModal);

    await wrapper.find('[data-testid="parent-a-slot"]').trigger('click');
    await wrapper.find('[data-testid="picker-penguin-p1"]').trigger('click');
    await wrapper.find('[data-testid="parent-b-slot"]').trigger('click');
    await wrapper.find('[data-testid="picker-penguin-p2"]').trigger('click');

    const startBtn = wrapper.find('[data-testid="btn-start-breeding"]');
    await startBtn.trigger('click');

    // Should now show in-progress view
    expect(wrapper.find('[data-testid="breeding-active-view"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="breeding-timer"]').exists()).toBe(true);
  });

  it('shows collect egg button when slot is READY_TO_COLLECT', async () => {
    const breedingStore = useBreedingStore();
    const game = useGameStore();
    const p1 = createMockPenguin('p1', 'Mom', 4);
    const p2 = createMockPenguin('p2', 'Dad', 5);
    game.ownedPenguins = [p1, p2];

    game.breedingSlot = {
      slotId: 1,
      state: 'READY_TO_COLLECT',
      parentAId: 'p1',
      parentBId: 'p2',
      startedAt: Date.now() - 31000,
      targetCollectTime: Date.now() - 1000,
      geneticsResult: {
        speciesId: 'snowy',
        traits: ['curious'],
        generation: 2,
        parentAId: 'p1',
        parentBId: 'p2',
        mutatedSpecies: false,
        personality: 'adventurous',
      },
    };

    const wrapper = mount(BreedingModal);

    const collectBtn = wrapper.find('[data-testid="btn-collect-egg"]');
    expect(collectBtn.exists()).toBe(true);
    expect(collectBtn.text()).toContain('Thu Hoạch Trứng');

    await collectBtn.trigger('click');

    // Egg should be collected, slot reset to EMPTY
    expect(breedingStore.breedingSlot.state).toBe('EMPTY');
  });

  it('emits close when clicking close button', async () => {
    const wrapper = mount(BreedingModal);
    await wrapper.find('[data-testid="modal-close-btn"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
