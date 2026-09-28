// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TopBar from '../hud/TopBar.vue';
import { useGameStore } from '../../stores/gameStore';

describe('TopBar Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders currencies from gameStore', async () => {
    const game = useGameStore();
    game.currencies.coins = 500;
    game.currencies.fish = 50;
    game.currencies.gems = 10;

    const wrapper = mount(TopBar);
    expect(wrapper.text()).toContain('500');
    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('10');
  });

  it('renders player level, display name, and exp progress tooltip', () => {
    const game = useGameStore();
    game.player.level = 2;
    game.player.exp = 150;
    game.player.displayName = 'Pudgy Penguin';

    const wrapper = mount(TopBar);
    expect(wrapper.text()).toContain('Lv.2');
    expect(wrapper.text()).toContain('Pudgy Penguin');
    const expBar = wrapper.find('[data-testid="player-exp-bar"]');
    expect(expBar.exists()).toBe(true);
    expect(expBar.attributes('title')).toContain('EXP: 150/300');
  });

  it('toggles audio muted state when sound button is clicked', async () => {
    const game = useGameStore();
    expect(game.audioMuted).toBe(false);

    const wrapper = mount(TopBar);
    const audioBtn = wrapper.find('[data-testid="audio-toggle-btn"]');
    expect(audioBtn.exists()).toBe(true);

    await audioBtn.trigger('click');
    expect(game.audioMuted).toBe(true);

    await audioBtn.trigger('click');
    expect(game.audioMuted).toBe(false);
  });

  it('emits open-settings when settings button is clicked', async () => {
    const wrapper = mount(TopBar);
    const settingsBtn = wrapper.find('[data-testid="settings-btn"]');
    expect(settingsBtn.exists()).toBe(true);

    await settingsBtn.trigger('click');
    expect(wrapper.emitted('open-settings')).toBeTruthy();
    expect(wrapper.emitted('open-settings')?.length).toBe(1);
  });
});
