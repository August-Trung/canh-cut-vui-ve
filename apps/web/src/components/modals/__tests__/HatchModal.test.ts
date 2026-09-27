// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HatchModal from '../HatchModal.vue';
import { useGameStore } from '../../../stores/gameStore';
import { gameBridge } from '../../../game/bridge/GameBridge';

describe('HatchModal.vue', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const game = useGameStore();
    await game.initGame();

    // Prepare incubator slot 1 as ready to hatch
    const slot = game.incubatorSlots.find((s) => s.slotId === 1)!;
    slot.state = 'READY_TO_HATCH';
    slot.eggTypeId = 'basic_egg';
  });

  it('renders initial wobble stage with egg element', () => {
    const wrapper = mount(HatchModal, {
      props: {
        slotId: 1,
      },
    });

    expect(wrapper.find('[data-testid="egg-stage-wobble"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="hatch-stage-indicator"]').text()).toContain('wobble');
  });

  it('advances stages from wobble to crack to burst to reveal on egg tap or advance', async () => {
    const wrapper = mount(HatchModal, {
      props: {
        slotId: 1,
      },
    });

    const egg = wrapper.find('[data-testid="interactive-egg"]');

    // Click 1: wobble -> crack
    await egg.trigger('click');
    expect(wrapper.find('[data-testid="egg-stage-crack"]').exists()).toBe(true);

    // Click 2: crack -> burst
    await egg.trigger('click');
    expect(wrapper.find('[data-testid="egg-stage-burst"]').exists()).toBe(true);

    // Click 3 or timer: burst -> reveal
    await egg.trigger('click');
    expect(wrapper.find('[data-testid="egg-stage-reveal"]').exists()).toBe(true);
  });

  it('shows species name, rarity badge, personality trait and quote in reveal stage', async () => {
    const wrapper = mount(HatchModal, {
      props: {
        slotId: 1,
      },
    });

    // Advance to reveal stage
    const egg = wrapper.find('[data-testid="interactive-egg"]');
    await egg.trigger('click'); // crack
    await egg.trigger('click'); // burst
    await egg.trigger('click'); // reveal

    expect(wrapper.find('[data-testid="reveal-species-name"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reveal-rarity-badge"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reveal-personality-trait"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reveal-description"]').exists()).toBe(true);
  });

  it('validates custom nickname and shows feedback on invalid input', async () => {
    const wrapper = mount(HatchModal, {
      props: {
        slotId: 1,
      },
    });

    const egg = wrapper.find('[data-testid="interactive-egg"]');
    await egg.trigger('click');
    await egg.trigger('click');
    await egg.trigger('click');

    const input = wrapper.find<HTMLInputElement>('[data-testid="nickname-input"]');
    expect(input.exists()).toBe(true);

    // Invalid: more than 20 chars
    await input.setValue('Tên này dài quá hai mươi ký tự chắc chắn sẽ lỗi');
    expect(wrapper.find('[data-testid="nickname-error"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Tên không được vượt quá 20 ký tự.');

    // Invalid: contains script tags
    await input.setValue('Chim<script>alert</script>');
    expect(wrapper.find('[data-testid="nickname-error"]').exists()).toBe(true);

    // Valid: Vietnamese with accents
    await input.setValue('Băng Băng');
    expect(wrapper.find('[data-testid="nickname-error"]').exists()).toBe(false);
  });

  it('calls gameStore.hatchEgg and emits gameBridge penguin:spawn on completion', async () => {
    const game = useGameStore();
    const hatchSpy = vi.spyOn(game, 'hatchEgg');
    const bridgeSpy = vi.spyOn(gameBridge, 'emit');

    const wrapper = mount(HatchModal, {
      props: {
        slotId: 1,
      },
    });

    // Advance to reveal
    const egg = wrapper.find('[data-testid="interactive-egg"]');
    await egg.trigger('click');
    await egg.trigger('click');
    await egg.trigger('click');

    // Set valid nickname
    const input = wrapper.find<HTMLInputElement>('[data-testid="nickname-input"]');
    await input.setValue('Bé Tuyết Nhỏ');

    // Confirm button
    const confirmBtn = wrapper.find('[data-testid="hatch-confirm-btn"]');
    await confirmBtn.trigger('click');

    expect(hatchSpy).toHaveBeenCalledWith(1, 'Bé Tuyết Nhỏ');
    expect(bridgeSpy).toHaveBeenCalledWith('penguin:spawn', expect.objectContaining({
      penguin: expect.objectContaining({
        nickname: 'Bé Tuyết Nhỏ',
      }),
    }));
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('uses default fallback name when nickname is empty', async () => {
    const game = useGameStore();
    const hatchSpy = vi.spyOn(game, 'hatchEgg');

    const wrapper = mount(HatchModal, {
      props: {
        slotId: 1,
      },
    });

    // Advance to reveal
    const egg = wrapper.find('[data-testid="interactive-egg"]');
    await egg.trigger('click');
    await egg.trigger('click');
    await egg.trigger('click');

    // Empty input
    const input = wrapper.find<HTMLInputElement>('[data-testid="nickname-input"]');
    await input.setValue('   ');

    const confirmBtn = wrapper.find('[data-testid="hatch-confirm-btn"]');
    await confirmBtn.trigger('click');

    expect(hatchSpy).toHaveBeenCalledWith(1, '');
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
