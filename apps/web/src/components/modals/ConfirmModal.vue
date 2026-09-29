<template>
  <div
    class="modal-backdrop"
    data-testid="modal-backdrop"
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @click.self.stop="emit('cancel')"
  >
    <div
      class="confirm-card"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
    >
      <!-- Frost Header Border -->
      <div class="confirm-card__header">
        <div class="confirm-card__icon" :class="{ 'confirm-card__icon--danger': danger }">
          <svg v-if="danger" viewBox="0 0 24 24" class="svg-icon" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="svg-icon" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" stroke-linecap="round" />
            <circle cx="12" cy="16" r="0.75" fill="currentColor" />
          </svg>
        </div>
        <h3 class="confirm-card__title" data-testid="confirm-modal-title">{{ title }}</h3>
      </div>

      <div class="confirm-card__body">
        <p class="confirm-card__message" data-testid="confirm-modal-message">{{ message }}</p>
      </div>

      <div class="confirm-card__actions">
        <button
          type="button"
          class="btn-action btn-action--cancel"
          data-testid="confirm-modal-btn-cancel"
          @pointerdown.stop
          @pointerup.stop
          @mousedown.stop
          @mouseup.stop
          @click.stop="emit('cancel')"
        >
          {{ cancelText || 'Hủy Bỏ' }}
        </button>
        <button
          type="button"
          class="btn-action"
          :class="danger ? 'btn-action--danger' : 'btn-action--primary'"
          data-testid="confirm-modal-btn-confirm"
          @pointerdown.stop
          @pointerup.stop
          @mousedown.stop
          @mouseup.stop
          @click.stop="emit('confirm')"
        >
          {{ confirmText || 'Xác Nhận' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
  }>(),
  {
    confirmText: 'Xác Nhận',
    cancelText: 'Hủy Bỏ',
    danger: false,
  }
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

.confirm-card {
  width: 100%;
  max-width: 420px;
  background: #FBF6EB;
  border: 4px solid #6B3E1B;
  border-radius: 20px;
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.45),
    inset 0 0 0 2px #FFF9E6,
    inset 0 -3px 6px rgba(107, 62, 27, 0.2);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.confirm-card__icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #FEF3C7;
  color: #B45309;
  border: 1.5px solid #F59E0B;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-card__icon--danger {
  background: #FEE2E2;
  color: #DC2626;
  border-color: #F87171;
}

.svg-icon {
  width: 22px;
  height: 22px;
}

.confirm-card__title {
  font-family: 'Quicksand', 'Nunito', sans-serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #451A03;
  margin: 0;
}

.confirm-card__message {
  font-size: 0.92rem;
  line-height: 1.5;
  color: #78350F;
  margin: 0;
  font-weight: 700;
}

.confirm-card__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 6px;
}

.btn-action {
  padding: 8px 16px;
  border-radius: 12px;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn-action:hover {
  transform: scale(1.04);
  filter: brightness(1.08);
}

.btn-action:active {
  transform: scale(0.96);
}

.btn-action--cancel {
  background: #EFE5D0;
  border-color: #D5C4A1;
  color: #78350F;
}

.btn-action--cancel:hover {
  background: #E8D8BD;
}

.btn-action--primary {
  background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
  border-color: #0369A1;
  color: #FFFFFF;
  box-shadow: 0 3px 6px rgba(2, 132, 199, 0.3);
}

.btn-action--danger {
  background: linear-gradient(180deg, #F87171 0%, #DC2626 100%);
  border-color: #991B1B;
  color: #FFFFFF;
  box-shadow: 0 3px 6px rgba(220, 38, 38, 0.3);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from { transform: scale(0.92); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
