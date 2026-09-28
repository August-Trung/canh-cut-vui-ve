// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ShelfRack from '../dock/ShelfRack.vue';

describe('ShelfRack Component', () => {
  it('renders all action buttons with Vietnamese labels', () => {
    const wrapper = mount(ShelfRack);
    expect(wrapper.text()).toContain('Túi Đồ');
    expect(wrapper.text()).toContain('Bộ Sưu Tập');
    expect(wrapper.text()).toContain('Ấp Trứng');
    expect(wrapper.text()).toContain('Phối Giống');
    expect(wrapper.text()).toContain('Câu Cá');
    expect(wrapper.text()).toContain('Cửa Hàng');
    expect(wrapper.text()).toContain('Nhiệm Vụ');
    expect(wrapper.text()).toContain('Cài Đặt');
  });

  it('emits open-inventory when Túi Đồ is clicked', async () => {
    const wrapper = mount(ShelfRack);
    const btn = wrapper.find('[data-testid="btn-inventory"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');
    expect(wrapper.emitted('open-inventory')).toBeTruthy();
    expect(wrapper.emitted('open-inventory')?.length).toBe(1);
  });

  it('emits open-collection when Bộ Sưu Tập is clicked', async () => {
    const wrapper = mount(ShelfRack);
    const btn = wrapper.find('[data-testid="btn-collection"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');
    expect(wrapper.emitted('open-collection')).toBeTruthy();
    expect(wrapper.emitted('open-collection')?.length).toBe(1);
  });

  it('emits open-hatchery when Ấp Trứng is clicked', async () => {
    const wrapper = mount(ShelfRack);
    const btn = wrapper.find('[data-testid="btn-hatchery"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');
    expect(wrapper.emitted('open-hatchery')).toBeTruthy();
    expect(wrapper.emitted('open-hatchery')?.length).toBe(1);
  });

  it('emits open-breeding when Phối Giống is clicked', async () => {
    const wrapper = mount(ShelfRack);
    const btn = wrapper.find('[data-testid="btn-breeding"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');
    expect(wrapper.emitted('open-breeding')).toBeTruthy();
    expect(wrapper.emitted('open-breeding')?.length).toBe(1);
  });

  it('emits open-catch-fish when Câu Cá is clicked', async () => {
    const wrapper = mount(ShelfRack);
    const btn = wrapper.find('[data-testid="btn-catch-fish"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');
    expect(wrapper.emitted('open-catch-fish')).toBeTruthy();
    expect(wrapper.emitted('open-catch-fish')?.length).toBe(1);
  });

  it('emits open-shop when Cửa Hàng is clicked', async () => {
    const wrapper = mount(ShelfRack);
    const btn = wrapper.find('[data-testid="btn-shop"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');
    expect(wrapper.emitted('open-shop')).toBeTruthy();
    expect(wrapper.emitted('open-shop')?.length).toBe(1);
  });

  it('emits open-quests when Nhiệm Vụ is clicked', async () => {
    const wrapper = mount(ShelfRack);
    const btn = wrapper.find('[data-testid="btn-quests"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');
    expect(wrapper.emitted('open-quests')).toBeTruthy();
    expect(wrapper.emitted('open-quests')?.length).toBe(1);
  });

  it('emits open-settings when Cài Đặt is clicked', async () => {
    const wrapper = mount(ShelfRack);
    const btn = wrapper.find('[data-testid="btn-settings"]');
    expect(btn.exists()).toBe(true);

    await btn.trigger('click');
    expect(wrapper.emitted('open-settings')).toBeTruthy();
    expect(wrapper.emitted('open-settings')?.length).toBe(1);
  });
});
