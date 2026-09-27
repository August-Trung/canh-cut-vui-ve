// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfirmModal from '../ConfirmModal.vue';

describe('ConfirmModal.vue', () => {
  it('renders title, message, and custom button text', () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        title: 'Xác Nhận Đặt Lại',
        message: 'Bạn có chắc chắn muốn xóa dữ liệu?',
        confirmText: 'Đồng Ý Xóa',
        cancelText: 'Quay Lại',
        danger: true,
      },
    });

    expect(wrapper.find('[data-testid="confirm-modal-title"]').text()).toBe('Xác Nhận Đặt Lại');
    expect(wrapper.find('[data-testid="confirm-modal-message"]').text()).toBe('Bạn có chắc chắn muốn xóa dữ liệu?');
    expect(wrapper.find('[data-testid="confirm-modal-btn-confirm"]').text()).toBe('Đồng Ý Xóa');
    expect(wrapper.find('[data-testid="confirm-modal-btn-cancel"]').text()).toBe('Quay Lại');
  });

  it('emits confirm event when confirm button is clicked', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        title: 'Xác nhận',
        message: 'Tiếp tục?',
      },
    });

    await wrapper.find('[data-testid="confirm-modal-btn-confirm"]').trigger('click');
    expect(wrapper.emitted('confirm')).toBeTruthy();
  });

  it('emits cancel event when cancel button or backdrop is clicked', async () => {
    const wrapper = mount(ConfirmModal, {
      props: {
        title: 'Xác nhận',
        message: 'Tiếp tục?',
      },
    });

    await wrapper.find('[data-testid="confirm-modal-btn-cancel"]').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();

    await wrapper.find('[data-testid="modal-backdrop"]').trigger('click');
    expect(wrapper.emitted('cancel')?.length).toBe(2);
  });
});
