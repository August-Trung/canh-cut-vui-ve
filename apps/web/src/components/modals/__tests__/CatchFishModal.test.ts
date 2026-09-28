// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import CatchFishModal from '../CatchFishModal.vue';
import { useGameStore } from '../../../stores/gameStore';
import { gameBridge } from '../../../game/bridge/GameBridge';
import type { OwnedPenguin, MiniGameResult } from '@penguin/types';

function createMockPenguin(id: string, nickname: string, level = 3): OwnedPenguin {
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
    traits: ['fisherman'],
    personality: 'adventurous',
    lastBredAt: 0,
  };
}

describe('CatchFishModal.vue', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    const game = useGameStore();
    await game.initGame();
  });

  it('renders lobby view with companion list and daily tracker', () => {
    const game = useGameStore();
    game.ownedPenguins = [
      createMockPenguin('p1', 'Fisher Penguin', 4),
    ];

    const wrapper = mount(CatchFishModal);

    expect(wrapper.find('[data-testid="minigame-lobby-view"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="companion-card-p1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="daily-plays-tracker"]').text()).toContain('0 / 6');
  });

  it('selects companion and transitions to playing phase on start', async () => {
    const game = useGameStore();
    game.currencies.coins = 100;
    const p1 = createMockPenguin('p1', 'Fisher Penguin', 4);
    game.ownedPenguins = [p1];

    const wrapper = mount(CatchFishModal);

    // Select companion
    await wrapper.find('[data-testid="companion-card-p1"]').trigger('click');

    // Click start game
    const startBtn = wrapper.find('[data-testid="btn-start-game"]');
    await startBtn.trigger('click');

    // Should now be in playing view
    expect(wrapper.find('[data-testid="minigame-playing-hud"]').exists()).toBe(true);
    expect(game.miniGameState.dailyPlaysCount['catch_fish']).toBe(1);
  });

  it('transitions to results view when minigame:ended event is received and claims reward', async () => {
    const game = useGameStore();
    game.currencies.coins = 100;
    const p1 = createMockPenguin('p1', 'Fisher Penguin', 4);
    game.ownedPenguins = [p1];

    const wrapper = mount(CatchFishModal);

    // Start game
    await wrapper.find('[data-testid="companion-card-p1"]').trigger('click');
    await wrapper.find('[data-testid="btn-start-game"]').trigger('click');

    // Simulate minigame:ended from Phaser scene
    const mockResult: MiniGameResult = {
      sessionId: 'test_session_1',
      gameId: 'catch_fish',
      score: 180,
      catchesCount: 12,
      accuracy: 85,
      maxCombo: 6,
      durationSec: 30,
      hazardsHit: 0,
      specialFishCaught: 2,
    };
    gameBridge.emit('minigame:ended', { result: mockResult });

    await wrapper.vm.$nextTick();

    // Results view should be active
    expect(wrapper.find('[data-testid="minigame-results-view"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="rewards-summary"]').exists()).toBe(true);

    const prevCoins = game.currencies.coins;
    // Claim reward
    const claimBtn = wrapper.find('[data-testid="btn-claim-reward"]');
    await claimBtn.trigger('click');

    // Coins increased and close emitted
    expect(game.currencies.coins).toBeGreaterThan(prevCoins);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('disables start button when daily cap of 6 plays is reached', () => {
    const game = useGameStore();
    game.miniGameState.dailyPlaysCount['catch_fish'] = 6;
    game.ownedPenguins = [createMockPenguin('p1', 'Penguin')];

    const wrapper = mount(CatchFishModal);

    const startBtn = wrapper.find('[data-testid="btn-start-game"]');
    expect(startBtn.attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-testid="daily-plays-tracker"]').text()).toContain('Đã đạt giới hạn');
  });

  it('emits close when clicking close button in lobby', async () => {
    const wrapper = mount(CatchFishModal);
    await wrapper.find('[data-testid="modal-close-btn"]').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
