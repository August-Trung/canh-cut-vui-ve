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
  background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
  border: 3px solid #BAE6FD;
  border-radius: 24px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.confirm-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #E0F2FE;
  color: #0284C7;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-card__icon--danger {
  background: #FEE2E2;
  color: #DC2626;
}

.svg-icon {
  width: 24px;
  height: 24px;
}

.confirm-card__title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}

.confirm-card__message {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #475569;
  margin: 0;
}

.confirm-card__actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-action {
  padding: 10px 18px;
  border-radius: 14px;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
  border: none;
  transition: transform 0.15s ease, filter 0.15s ease, background 0.15s ease;
}

.btn-action:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.btn-action:active {
  transform: translateY(1px);
}

.btn-action--cancel {
  background: #E2E8F0;
  color: #475569;
}

.btn-action--cancel:hover {
  background: #CBD5E1;
}

.btn-action--primary {
  background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
  color: #FFFFFF;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.35);
}

.btn-action--danger {
  background: linear-gradient(180deg, #EF4444 0%, #DC2626 100%);
  color: #FFFFFF;
  box-shadow: 0 4px 10px rgba(220, 38, 38, 0.35);
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
