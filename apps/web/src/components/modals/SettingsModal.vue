<template>
  <div class="modal-backdrop" data-testid="modal-backdrop" @click.self="emit('close')">
    <div class="settings-dialog" role="dialog" aria-modal="true" aria-label="Cài Đặt Trò Chơi">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-header__title-group">
          <span class="modal-header__icon">⚙️</span>
          <h2 class="modal-header__title">Cài Đặt Trò Chơi</h2>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          data-testid="modal-close-btn"
          aria-label="Đóng"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Feedback Toast Notification -->
      <transition name="toast-fade">
        <div v-if="feedbackMessage" class="feedback-toast" :class="`feedback-toast--${feedbackType}`">
          {{ feedbackMessage }}
        </div>
      </transition>

      <div class="settings-body">
        <!-- 1. Sound / Audio Settings -->
        <div class="setting-item">
          <div class="setting-item__text">
            <h4 class="setting-title">Âm Thanh</h4>
            <p class="setting-desc">Bật hoặc tắt nhạc nền và hiệu ứng âm thanh trên đảo.</p>
          </div>
          <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--active': !gameStore.audioMuted }"
            data-testid="toggle-audio-btn"
            @click="handleToggleAudio"
          >
            {{ gameStore.audioMuted ? '🔇 Tắt' : '🔊 Bật' }}
          </button>
        </div>

        <!-- 2. Player Profile Info -->
        <div class="setting-item">
          <div class="setting-item__text">
            <h4 class="setting-title">Người Quản Lý Đảo</h4>
            <p class="setting-desc">{{ gameStore.player.displayName }} (Cấp {{ gameStore.player.level }})</p>
          </div>
          <span class="info-pill">Cấp {{ gameStore.player.level }}</span>
        </div>

        <!-- 3. Export / Import Save Section -->
        <div class="setting-section">
          <h4 class="section-title">Quản Lý Dữ Liệu Lưu (Cloud/Local)</h4>
          <div class="save-actions-grid">
            <button
              type="button"
              class="btn-save-action"
              data-testid="btn-export-save"
              @click="handleExportSave"
            >
              📥 Xuất Dữ Liệu (JSON)
            </button>
            <button
              type="button"
              class="btn-save-action"
              data-testid="btn-import-save"
              @click="openImportDialog"
            >
              📤 Nhập Dữ Liệu (JSON)
            </button>
          </div>

          <!-- Import Dialog Textarea Area (if open) -->
          <div v-if="showImportInput" class="import-box">
            <textarea
              v-model="importJsonText"
              class="import-textarea"
              placeholder="Dán mã JSON dữ liệu lưu vào đây..."
              rows="4"
            ></textarea>
            <div class="import-buttons">
              <button type="button" class="btn-cancel-small" @click="showImportInput = false">
                Hủy
              </button>
              <button type="button" class="btn-confirm-small" @click="handleConfirmImport">
                Xác Nhận Nhập
              </button>
            </div>
          </div>
        </div>

        <!-- 4. Danger Zone: Reset Save -->
        <div class="setting-danger-zone">
          <div class="danger-header">
            <h4 class="danger-title">Vùng Nguy Hiểm</h4>
            <p class="danger-desc">
              Xóa toàn bộ tiến trình trên đảo và bắt đầu lại từ đầu. Hành động này không thể hoàn tác!
            </p>
          </div>
          <button
            type="button"
            class="btn-danger-reset"
            data-testid="btn-reset-save"
            @click="promptResetSave"
          >
            🗑️ Đặt Lại Toàn Bộ Dữ Liệu
          </button>
        </div>
      </div>

      <!-- Mandatory Confirmation Modal for Risky Action -->
      <ConfirmModal
        v-if="showConfirmReset"
        title="Xác Nhận Đặt Lại Dữ Liệu?"
        message="Hành động này sẽ xóa toàn bộ chim cánh cụt, trứng và tiền tệ của bạn trên đảo. Bạn có chắc chắn muốn bắt đầu lại từ đầu không?"
        confirm-text="Xác Nhận Xóa"
        cancel-text="Quay Lại"
        :danger="true"
        @confirm="handleConfirmReset"
        @cancel="showConfirmReset = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { gameStorage } from '../../services/StorageService';
import { soundService } from '../../services/SoundService';
import { gameBridge } from '../../game/bridge/GameBridge';
import ConfirmModal from './ConfirmModal.vue';

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'sync'): void;
}>();

const gameStore = useGameStore();
const invStore = useInventoryStore();
const colStore = useCollectionStore();

const showConfirmReset = ref(false);
const showImportInput = ref(false);
const importJsonText = ref('');
const feedbackMessage = ref<string | null>(null);
const feedbackType = ref<'success' | 'warning' | 'info'>('info');

function showFeedback(msg: string, type: 'success' | 'warning' | 'info' = 'info') {
  feedbackMessage.value = msg;
  feedbackType.value = type;
}

function handleToggleAudio() {
  gameStore.toggleAudio();
  if (!gameStore.audioMuted) {
    soundService.playPop();
  }
  showFeedback(gameStore.audioMuted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh', 'info');
}

function handleExportSave() {
  try {
    const saveData = {
      schemaVersion: 1,
      createdAt: gameStore.createdAt,
      updatedAt: Date.now(),
      player: { ...gameStore.player },
      currencies: { ...gameStore.currencies },
      inventory: [...invStore.items],
      ownedPenguins: [...gameStore.ownedPenguins],
      collectionBook: [...colStore.discovered],
      incubatorSlots: [...gameStore.incubatorSlots],
      islandState: {
        ...gameStore.islandState,
        decorationsPlaced: [...gameStore.islandState.decorationsPlaced],
      },
    };

    const json = gameStorage.exportJson(saveData);
    // Copy to clipboard if available
    navigator?.clipboard?.writeText?.(json);

    // Also download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `canh-cut-vui-ve-save-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showFeedback('Đã xuất file lưu trữ dữ liệu thành công!', 'success');
  } catch (err) {
    console.error('Export error:', err);
    showFeedback('Không thể xuất dữ liệu.', 'warning');
  }
}

function openImportDialog() {
  showImportInput.value = true;
  importJsonText.value = '';
}

function syncPenguins() {
  gameBridge.emit('world:sync', { penguins: gameStore.ownedPenguins });
  emit('sync');
}

async function handleConfirmImport() {
  if (!importJsonText.value.trim()) {
    showFeedback('Vui lòng dán dữ liệu JSON hợp lệ.', 'warning');
    return;
  }

  const parsed = gameStorage.importJson(importJsonText.value);
  if (!parsed) {
    showFeedback('Định dạng dữ liệu JSON không hợp lệ!', 'warning');
    return;
  }

  await gameStorage.save(parsed);
  await gameStore.initGame();
  syncPenguins();
  showImportInput.value = false;
  showFeedback('Nhập dữ liệu thành công! Đã cập nhật đảo.', 'success');
}

function promptResetSave() {
  showConfirmReset.value = true;
}

async function handleConfirmReset() {
  showConfirmReset.value = false;
  await gameStore.resetSave();
  syncPenguins();
  showFeedback('Đã đặt lại dữ liệu toàn bộ trò chơi.', 'success');
}
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

.settings-dialog {
  position: relative;
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
  border: 3px solid #64748B;
  border-radius: 28px;
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.35),
    0 0 0 2px rgba(255, 255, 255, 0.9) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%);
  border-bottom: 2px solid #CBD5E1;
}

.modal-header__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header__icon {
  font-size: 1.5rem;
}

.modal-header__title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1E293B;
  margin: 0;
}

.modal-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: none;
  background: #FFFFFF;
  color: #64748B;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.15s ease, background 0.15s ease;
}

.modal-close-btn:hover {
  background: #FEE2E2;
  color: #DC2626;
  transform: scale(1.08);
}

/* Feedback Toast */
.feedback-toast {
  margin: 10px 16px 0;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.88rem;
  font-weight: 700;
  text-align: center;
}

.feedback-toast--success {
  background: #DCFCE7;
  color: #15803D;
  border: 1px solid #86EFAC;
}

.feedback-toast--warning {
  background: #FEF3C7;
  color: #B45309;
  border: 1px solid #FDE68A;
}

.feedback-toast--info {
  background: #E0F2FE;
  color: #0369A1;
  border: 1px solid #BAE6FD;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Settings Body */
.settings-body {
  padding: 18px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 18px;
}

.setting-item__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
}

.setting-desc {
  font-size: 0.82rem;
  color: #64748B;
  margin: 0;
}

.toggle-btn {
  padding: 8px 16px;
  border-radius: 12px;
  border: none;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.88rem;
  cursor: pointer;
  background: #E2E8F0;
  color: #64748B;
  transition: background 0.15s ease, color 0.15s ease;
}

.toggle-btn--active {
  background: #DCFCE7;
  color: #15803D;
  border: 1px solid #86EFAC;
}

.info-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: #E0F2FE;
  color: #0369A1;
  font-size: 0.8rem;
  font-weight: 800;
}

.setting-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 18px;
  padding: 14px 16px;
}

.section-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: #1E293B;
  margin: 0;
}

.save-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-save-action {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid #CBD5E1;
  background: #F8FAFC;
  color: #334155;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-save-action:hover {
  background: #E2E8F0;
  border-color: #94A3B8;
}

.import-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.import-textarea {
  width: 100%;
  padding: 8px 12px;
  border-radius: 12px;
  border: 2px solid #CBD5E1;
  font-family: monospace;
  font-size: 0.8rem;
  resize: vertical;
}

.import-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-cancel-small {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #E2E8F0;
  color: #64748B;
  font-weight: 700;
  cursor: pointer;
}

.btn-confirm-small {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #0284C7;
  color: #FFFFFF;
  font-weight: 700;
  cursor: pointer;
}

/* Danger Zone */
.setting-danger-zone {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #FEF2F2;
  border: 2px dashed #FCA5A5;
  border-radius: 18px;
  padding: 14px 16px;
}

.danger-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: #B91C1C;
  margin: 0 0 2px;
}

.danger-desc {
  font-size: 0.8rem;
  color: #7F1D1D;
  margin: 0;
  line-height: 1.3;
}

.btn-danger-reset {
  padding: 10px 16px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(180deg, #EF4444 0%, #DC2626 100%);
  color: #FFFFFF;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.92rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(220, 38, 38, 0.25);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn-danger-reset:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
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
