<template>
  <div
    class="modal-backdrop"
    data-testid="levelup-modal-backdrop"
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @click.self.stop="emit('close')"
  >
    <div
      class="levelup-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Chúc Mừng Lên Cấp!"
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
    >
      <div class="levelup-burst">✨ 🎊 ✨</div>

      <div class="levelup-badge-wrap">
        <div class="level-crown">👑</div>
        <div class="level-circle" data-testid="levelup-level-display">
          Lv. {{ newLevel }}
        </div>
      </div>

      <h2 class="levelup-title">CHÚC MỪNG LÊN CẤP!</h2>
      <p class="levelup-sub">Hòn đảo của bạn ngày càng nhộn nhịp và tươi vui hơn!</p>

      <div class="unlock-highlights">
        <div class="unlock-item">
          <span class="unlock-icon">🐧</span>
          <span class="unlock-text">Sức chứa bầy đàn: <strong>{{ getMaxFlockCapacity(newLevel) }} chú cánh cụt</strong></span>
        </div>
        <div class="unlock-item">
          <span class="unlock-icon">🛍️</span>
          <span class="unlock-text">Nhiều vật phẩm mới đã mở khóa trong Cửa Hàng!</span>
        </div>
      </div>

      <div class="action-wrap">
        <button
          type="button"
          class="btn-celebrate"
          data-testid="btn-levelup-confirm"
          @click="emit('close')"
        >
          🎉 Tuyệt Vời! Tiếp Tục Chơi
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { getMaxFlockCapacity } from '../../services/ProgressionService';
import { soundService } from '../../services/SoundService';

const props = defineProps<{
  newLevel: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

onMounted(() => {
  soundService.playLevelUp();
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

.levelup-dialog {
  background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
  border-radius: 28px;
  width: 100%;
  max-width: 440px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  animation: popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  border: 2px solid #86efac;
}

.levelup-burst {
  font-size: 2rem;
  margin-bottom: 8px;
  animation: pulse 1.5s infinite;
}

.levelup-badge-wrap {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 16px auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-crown {
  position: absolute;
  top: -16px;
  font-size: 2rem;
  z-index: 2;
}

.level-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  border: 4px solid #ffffff;
  box-shadow: 0 8px 20px rgba(217, 119, 6, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 900;
  color: #ffffff;
}

.levelup-title {
  margin: 0 0 6px 0;
  font-size: 1.5rem;
  font-weight: 900;
  color: #15803d;
  letter-spacing: 0.5px;
}

.levelup-sub {
  margin: 0 0 20px 0;
  font-size: 0.9rem;
  color: #64748b;
}

.unlock-highlights {
  background: #ffffff;
  border: 1px solid #dcfce7;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
  text-align: left;
}

.unlock-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: #334155;
}

.unlock-icon {
  font-size: 1.25rem;
}

.btn-celebrate {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: #ffffff;
  border: none;
  border-radius: 16px;
  padding: 12px 28px;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(34, 197, 94, 0.35);
  transition: all 0.15s;
  width: 100%;
}

.btn-celebrate:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.45);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popUp {
  from { transform: scale(0.85); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
</style>
