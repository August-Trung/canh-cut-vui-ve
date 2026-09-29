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
      <div class="levelup-burst">
        <GameIcon name="star" size="sm" />
        <GameIcon name="gift" size="md" />
        <GameIcon name="star" size="sm" />
      </div>

      <div class="levelup-badge-wrap">
        <div class="level-crown">
          <GameIcon name="crown" size="lg" />
        </div>
        <div class="level-circle" data-testid="levelup-level-display">
          Lv. {{ newLevel }}
        </div>
      </div>

      <h2 class="levelup-title">CHÚC MỪNG LÊN CẤP!</h2>
      <p class="levelup-sub">Hòn đảo của bạn ngày càng nhộn nhịp và tươi vui hơn!</p>

      <div class="unlock-highlights">
        <div class="unlock-item">
          <span class="unlock-icon">
            <GameIcon name="pet" size="sm" />
          </span>
          <span class="unlock-text">Sức chứa bầy đàn: <strong>{{ getMaxFlockCapacity(newLevel) }} chú cánh cụt</strong></span>
        </div>
        <div class="unlock-item">
          <span class="unlock-icon">
            <GameIcon name="shop" size="sm" />
          </span>
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
          <GameIcon name="star" size="xs" />
          <span>Tuyệt Vời! Tiếp Tục Chơi</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { getMaxFlockCapacity } from '../../services/ProgressionService';
import { soundService } from '../../services/SoundService';
import GameIcon from '../common/GameIcon.vue';

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
  background: #FBF6EB;
  border: 4px solid #6B3E1B;
  border-radius: 24px;
  width: 100%;
  max-width: 440px;
  padding: 28px 20px 24px;
  text-align: center;
  box-shadow:
    0 20px 48px rgba(0, 0, 0, 0.45),
    inset 0 0 0 2px #FFF9E6,
    inset 0 -3px 6px rgba(107, 62, 27, 0.2);
  animation: popUp 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.levelup-burst {
  font-size: 2rem;
  margin-bottom: 8px;
  animation: pulse 1.5s infinite;
}

.levelup-badge-wrap {
  position: relative;
  width: 90px;
  height: 90px;
  margin: 0 auto 14px auto;
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
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  border: 3.5px solid #FFFFFF;
  box-shadow: 0 6px 16px rgba(217, 119, 6, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Quicksand', 'Nunito', sans-serif;
  font-size: 1.4rem;
  font-weight: 900;
  color: #FFFFFF;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.levelup-title {
  margin: 0 0 4px 0;
  font-family: 'Quicksand', 'Nunito', sans-serif;
  font-size: 1.35rem;
  font-weight: 900;
  color: #451A03;
  letter-spacing: 0.03em;
}

.levelup-sub {
  margin: 0 0 16px 0;
  font-size: 0.85rem;
  color: #78350F;
  font-weight: 700;
}

.unlock-highlights {
  background: #FFFDF5;
  border: 2px solid #E2C8A2;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  text-align: left;
}

.unlock-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  color: #451A03;
  font-weight: 700;
}

.unlock-icon {
  font-size: 1.1rem;
}

.btn-celebrate {
  background: linear-gradient(180deg, #4ADE80 0%, #16A34A 100%);
  color: #FFFFFF;
  border: 2px solid #15803D;
  border-radius: 14px;
  padding: 10px 24px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);
  transition: transform 0.15s ease, filter 0.15s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-celebrate:hover {
  transform: scale(1.03);
  filter: brightness(1.08);
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
