// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CurrencyBadge from '../hud/CurrencyBadge.vue';

describe('CurrencyBadge Component', () => {
  it('renders fish currency with formatted amount and title', () => {
    const wrapper = mount(CurrencyBadge, {
      props: {
        type: 'fish',
        amount: 1500,
      },
    });

    expect(wrapper.text()).toContain('1,500');
    expect(wrapper.attributes('title')).toBe('Cá: 1,500');
    expect(wrapper.classes()).toContain('currency-badge--fish');
  });

  it('renders coins currency with formatted amount and title', () => {
    const wrapper = mount(CurrencyBadge, {
      props: {
        type: 'coins',
        amount: 250000,
      },
    });

    expect(wrapper.text()).toContain('250,000');
    expect(wrapper.attributes('title')).toBe('Xu: 250,000');
    expect(wrapper.classes()).toContain('currency-badge--coins');
  });

  it('renders gems currency with formatted amount and title', () => {
    const wrapper = mount(CurrencyBadge, {
      props: {
        type: 'gems',
        amount: 75,
      },
    });

    expect(wrapper.text()).toContain('75');
    expect(wrapper.attributes('title')).toBe('Kim cương: 75');
    expect(wrapper.classes()).toContain('currency-badge--gems');
  });
});
