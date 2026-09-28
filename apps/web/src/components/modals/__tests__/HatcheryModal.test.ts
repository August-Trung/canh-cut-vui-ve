// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HatcheryModal from '../HatcheryModal.vue';
import { useGameStore } from '../../../stores/gameStore';

describe('HatcheryModal.vue', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const game = useGameStore();
    await game.initGame();
  });

  it('renders Slot 1 and Slot 2', () => {
    const wrapper = mount(HatcheryModal);

    expect(wrapper.find('[data-testid="incubator-slot-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="incubator-slot-2"]').exists()).toBe(true);
  });

  it('shows countdown timer when a slot is INCUBATING', async () => {
    const game = useGameStore();
    const slot = game.incubatorSlots.find((s) => s.slotId === 1)!;
    slot.state = 'INCUBATING';
    slot.eggTypeId = 'basic_egg';
    slot.startTime = Date.now();
    slot.durationSec = 10;
    slot.readyAt = Date.now() + 8000;

    const wrapper = mount(HatcheryModal);

    const slot1 = wrapper.find('[data-testid="incubator-slot-1"]');
    expect(slot1.text()).toContain('Đang Ấp');
    expect(slot1.find('[data-testid="slot-timer-1"]').exists()).toBe(true);
  });

  it('shows "Mở Trứng" button when a slot is READY_TO_HATCH and emits hatch event on click', async () => {
    const game = useGameStore();
    const slot = game.incubatorSlots.find((s) => s.slotId === 1)!;
    slot.state = 'READY_TO_HATCH';
    slot.eggTypeId = 'basic_egg';

    const wrapper = mount(HatcheryModal);

    const hatchBtn = wrapper.find('[data-testid="btn-hatch-slot-1"]');
    expect(hatchBtn.exists()).toBe(true);
    expect(hatchBtn.text()).toContain('Mở Trứng');

    await hatchBtn.trigger('click');
    expect(wrapper.emitted('hatch')?.[0]).toEqual([1]);
  });

  it('emits open-inventory when clicking on an empty slot button', async () => {
    const game = useGameStore();
    game.incubatorSlots[0].state = 'EMPTY';

    const wrapper = mount(HatcheryModal);

    const placeBtn = wrapper.find('[data-testid="btn-place-egg-slot-1"]');
    expect(placeBtn.exists()).toBe(true);

    await placeBtn.trigger('click');
    expect(wrapper.emitted('open-inventory')).toBeTruthy();
  });

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(HatcheryModal);

    const closeBtn = wrapper.find('[data-testid="modal-close-btn"]');
    await closeBtn.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('shows nurture button when incubating and calls gameStore.nurtureEgg on click', async () => {
    const game = useGameStore();
    const slot = game.incubatorSlots.find((s) => s.slotId === 1)!;
    slot.state = 'INCUBATING';
    slot.durationSec = 60;
    slot.readyAt = Date.now() + 50000;
    slot.nurtureCount = 0;
    slot.lastNurtureAt = undefined;

    const nurtureSpy = vi.spyOn(game, 'nurtureEgg');

    const wrapper = mount(HatcheryModal);
    const nurtureBtn = wrapper.find('[data-testid="btn-nurture-slot-1"]');
    expect(nurtureBtn.exists()).toBe(true);

    await nurtureBtn.trigger('click');
    expect(nurtureSpy).toHaveBeenCalledWith(1);
  });

  it('shows unlock button for locked Slot 2 and calls gameStore.unlockIncubatorSlot on click', async () => {
    const game = useGameStore();
    const slot2 = game.incubatorSlots.find((s) => s.slotId === 2)!;
    slot2.unlocked = false;
    slot2.unlockCost = 50;
    game.currencies.gems = 100;

    const unlockSpy = vi.spyOn(game, 'unlockIncubatorSlot');

    const wrapper = mount(HatcheryModal);
    const unlockBtn = wrapper.find('[data-testid="btn-unlock-slot-2"]');
    expect(unlockBtn.exists()).toBe(true);
    expect(unlockBtn.text()).toContain('50 Kim Cương');

    await unlockBtn.trigger('click');
    expect(unlockSpy).toHaveBeenCalledWith(2);
  });
});

