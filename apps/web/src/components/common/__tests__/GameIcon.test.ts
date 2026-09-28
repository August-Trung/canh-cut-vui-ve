// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import GameIcon from '../GameIcon.vue';

describe('GameIcon Component', () => {
  it('renders valid game asset image', () => {
    const wrapper = mount(GameIcon, {
      props: {
        name: 'coin',
        alt: 'Coin icon'
      }
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('alt')).toBe('Coin icon');
    expect(img.attributes('src')).toBeTruthy();
  });

  it('applies size classes correctly', () => {
    const wrapper = mount(GameIcon, {
      props: {
        name: 'gem',
        size: 'lg'
      }
    });

    expect(wrapper.classes()).toContain('game-icon--lg');
  });

  it('handles custom numeric sizes via style', () => {
    const wrapper = mount(GameIcon, {
      props: {
        name: 'star',
        size: 64
      }
    });

    const style = wrapper.attributes('style');
    expect(style).toContain('width: 64px');
    expect(style).toContain('height: 64px');
  });

  it('renders fallback when asset key is not found', () => {
    const wrapper = mount(GameIcon, {
      props: {
        name: 'non_existent_key_xyz'
      }
    });

    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.find('.game-icon-fallback').exists()).toBe(true);
  });
});
