<template>
  <div
    class="modal-backdrop"
    data-testid="modal-backdrop"
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @click.self.stop="emit('close')"
  >
    <div
      class="inventory-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Túi Đồ"
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
    >
      <!-- Modal Header (Zing Me Leather / Wood Banner) -->
      <div class="modal-header">
        <div class="modal-header__title-banner">
          <GameIcon name="inventory" size="sm" class="modal-header__icon" />
          <h2 class="modal-header__title">Túi Đồ</h2>
        </div>

        <div class="modal-header__capacity-pill" title="Sức chứa túi đồ">
          <span class="capacity-text">Sức Chứa: {{ totalItemsCount }} / 1000</span>
        </div>

        <button
          type="button"
          class="modal-close-btn"
          data-testid="modal-close-btn"
          aria-label="Đóng"
          @pointerdown.stop
          @pointerup.stop
          @mousedown.stop
          @mouseup.stop
          @click.stop="emit('close')"
        >
          <span class="close-x">✕</span>
        </button>
      </div>

      <!-- Feedback Toast Notification -->
      <transition name="toast-fade">
        <div v-if="feedbackMessage" class="feedback-toast" :class="`feedback-toast--${feedbackType}`">
          {{ feedbackMessage }}
        </div>
      </transition>

      <!-- Category Filter Tabs (Chunky Cartoon Tabs) -->
      <div class="tabs-bar" role="tablist" aria-label="Phân loại túi đồ">
        <button
          type="button"
          class="tab-btn"
          :class="{ 'is-active': activeCategory === 'all' }"
          data-testid="tab-all"
          role="tab"
          :aria-selected="activeCategory === 'all'"
          @click="activeCategory = 'all'"
        >
          Tất Cả
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'is-active': activeCategory === 'eggs' }"
          data-testid="tab-eggs"
          role="tab"
          :aria-selected="activeCategory === 'eggs'"
          @click="activeCategory = 'eggs'"
        >
          <GameIcon name="hatch" size="xs" />
          <span>Trứng</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'is-active': activeCategory === 'food' }"
          data-testid="tab-food"
          role="tab"
          :aria-selected="activeCategory === 'food'"
          @click="activeCategory = 'food'"
        >
          <GameIcon name="fish" size="xs" />
          <span>Thức Ăn</span>
        </button>
      </div>

      <!-- Inventory Item Grid -->
      <div class="inventory-body">
        <div v-if="filteredItems.length === 0" class="empty-state">
          <GameIcon name="snowflake" size="xl" class="empty-icon" />
          <p class="empty-text">Túi đồ trống trong danh mục này.</p>
        </div>

        <div v-else class="items-grid" role="list">
          <div
            v-for="item in filteredItems"
            :key="item.itemId"
            class="item-card"
            :data-testid="`inventory-item-${item.itemId}`"
            role="listitem"
          >
            <div class="item-card__icon-box">
              <GameIcon :name="getItemAssetKey(item)" size="lg" />
              <span class="item-card__quantity">x{{ item.quantity }}</span>
            </div>

            <div class="item-card__info">
              <h4 class="item-card__name">{{ item.name }}</h4>
              <p class="item-card__desc">{{ item.description }}</p>
            </div>

            <!-- Actions based on Item Category -->
            <div class="item-card__actions">
              <button
                v-if="item.category === 'eggs'"
                type="button"
                class="btn-item-action btn-item-action--egg"
                :data-testid="`action-place-egg-${item.itemId}`"
                @click="handlePlaceEgg(item.itemId)"
              >
                Đặt Vào Tổ Ấp
              </button>

              <button
                v-else-if="item.category === 'food'"
                type="button"
                class="btn-item-action btn-item-action--food"
                :data-testid="`action-feed-fish-${item.itemId}`"
                @click="handleFeedPenguin(item.itemId)"
              >
                Cho Ăn
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { InventoryItem } from '@penguin/types';
import { useGameStore } from '../../stores/gameStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import { gameBridge } from '../../game/bridge/GameBridge';
import GameIcon from '../common/GameIcon.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();
const invStore = useInventoryStore();

const activeCategory = ref<'all' | 'eggs' | 'food'>('all');
const feedbackMessage = ref<string | null>(null);
const feedbackType = ref<'success' | 'warning' | 'info'>('info');

function getItemAssetKey(item: InventoryItem): string {
  if (item.category === 'eggs') {
    if (item.itemId === 'frozen_egg') return 'egg_frozen';
    if (item.itemId === 'golden_egg') return 'egg_golden';
    return 'egg_basic';
  }
  if (item.category === 'food') {
    return item.itemId || 'fish';
  }
  if (item.category === 'decorations') {
    return 'decorate';
  }
  return 'inventory';
}

const filteredItems = computed(() => {
  return invStore.itemsByCategory(activeCategory.value);
});

const totalItemsCount = computed(() => {
  return invStore.items.reduce((sum, item) => sum + item.quantity, 0);
});

function showFeedback(msg: string, type: 'success' | 'warning' | 'info' = 'info') {
  feedbackMessage.value = msg;
  feedbackType.value = type;
}

function handlePlaceEgg(itemId: string) {
  const emptySlot = gameStore.incubatorSlots.find((s) => s.state === 'EMPTY');
  if (!emptySlot) {
    showFeedback('Tất cả tổ ấp đều đang bận, hãy đợi hoặc ấp nở trứng trước nhé!', 'warning');
    return;
  }

  const success = gameStore.placeEggInIncubator(emptySlot.slotId, itemId);
  if (success) {
    showFeedback(`Đã đặt trứng vào tổ ấp #${emptySlot.slotId}!`, 'success');
  } else {
    showFeedback('Không thể đặt trứng vào tổ ấp.', 'warning');
  }
}

function handleFeedPenguin(itemId: string) {
  const count = invStore.getItemCount(itemId);
  if (count <= 0) {
    showFeedback('Hết cá rồi! Hãy kiếm thêm cá nhé.', 'warning');
    return;
  }

  const targetPenguin = gameStore.selectedPenguin ?? gameStore.ownedPenguins[0];
  if (!targetPenguin) {
    showFeedback('Chưa có chim cánh cụt nào trên đảo.', 'info');
    return;
  }

  const success = gameStore.feedPenguin(targetPenguin.id);
  if (success) {
    gameBridge.emit('penguin:action', {
      ownedId: targetPenguin.id,
      action: 'feed',
    });
    showFeedback(`Đã cho ${targetPenguin.nickname} ăn 1 con cá ngon lành!`, 'success');
  } else {
    showFeedback('Hết cá rồi! Hãy kiếm thêm cá nhé.', 'warning');
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.15s ease-out;
}

/* Warm Beige Board with 4px Double Wooden Border (Zing Me Style) */
.inventory-dialog {
  width: 100%;
  max-width: 620px;
  max-height: 85vh;
  background: #FBF6EB;
  border: 4px solid #6B3E1B;
  border-radius: 20px;
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.45),
    inset 0 0 0 2px #FFF9E6,
    inset 0 -3px 6px rgba(107, 62, 27, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

/* Modal Header: Leather green title tab + capacity pill + wooden X */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(180deg, #F5E6CA 0%, #E8D2AC 100%);
  border-bottom: 3px solid #6B3E1B;
  gap: 10px;
}

.modal-header__title-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(180deg, #22C55E 0%, #15803D 100%);
  border: 2px solid #86EFAC;
  border-radius: 12px;
  padding: 4px 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.modal-header__icon {
  font-size: 1.1rem;
}

.modal-header__title {
  font-family: 'Quicksand', 'Nunito', sans-serif;
  font-size: 1.05rem;
  font-weight: 900;
  color: #FFFFFF;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  letter-spacing: 0.02em;
}

.modal-header__capacity-pill {
  background: #78350F;
  border: 2px solid #D97706;
  border-radius: 12px;
  padding: 3px 10px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
}

.capacity-text {
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  font-size: 0.76rem;
  color: #FEF08A;
}

/* Square Wooden Close Button with 'X' */
.modal-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 2px solid #451A03;
  border-top-color: #FDE68A;
  background: linear-gradient(180deg, #A16207 0%, #78350F 100%);
  color: #FFFFFF;
  font-weight: 900;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.modal-close-btn:hover {
  transform: scale(1.08);
  filter: brightness(1.15);
}

.close-x {
  line-height: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* Feedback Toast */
.feedback-toast {
  margin: 8px 14px 0;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 800;
  text-align: center;
}

.feedback-toast--success {
  background: #DCFCE7;
  color: #15803D;
  border: 2px solid #86EFAC;
}

.feedback-toast--warning {
  background: #FEF3C7;
  color: #B45309;
  border: 2px solid #FDE68A;
}

.feedback-toast--info {
  background: #E0F2FE;
  color: #0369A1;
  border: 2px solid #BAE6FD;
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

/* Chunky Cartoon Tabs */
.tabs-bar {
  display: flex;
  gap: 8px;
  padding: 10px 14px 6px;
  border-bottom: 2px solid #E5D5BA;
}

.tab-btn {
  flex: 1;
  padding: 6px 12px;
  border-radius: 12px;
  border: 2px solid #D5C4A1;
  background: #EFE5D0;
  color: #78350F;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.84rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  background: #E8D8BD;
  border-color: #B45309;
}

.tab-btn.is-active {
  background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);
  border-color: #B45309;
  color: #451A03;
  box-shadow: 0 2px 5px rgba(180, 83, 9, 0.25);
}

/* Inventory Body & Grid */
.inventory-body {
  padding: 14px;
  overflow-y: auto;
  flex: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #8C7B65;
  gap: 6px;
}

.empty-icon {
  font-size: 2rem;
}

.empty-text {
  font-size: 0.88rem;
  font-weight: 700;
}

.items-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Warm Cream Tile with Golden-Brown Border */
.item-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #FFFDF5;
  border: 2px solid #E2C8A2;
  border-radius: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.item-card:hover {
  border-color: #B45309;
  transform: translateY(-1px);
}

.item-card__icon-box {
  position: relative;
  width: 48px;
  height: 48px;
  background: linear-gradient(180deg, #FEF9C3 0%, #FDE047 100%);
  border: 2px solid #D97706;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.8);
}

.item-card__quantity {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #0284C7;
  color: #FFFFFF;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 999px;
  border: 1.5px solid #FFFFFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.item-card__info {
  flex: 1;
  min-width: 0;
}

.item-card__name {
  font-size: 0.92rem;
  font-weight: 800;
  color: #451A03;
  margin: 0 0 2px;
}

.item-card__desc {
  font-size: 0.78rem;
  color: #78350F;
  margin: 0;
  line-height: 1.3;
}

.item-card__actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* Chunky Tactile Action Buttons */
.btn-item-action {
  padding: 7px 12px;
  border-radius: 10px;
  border: 2px solid transparent;
  font-family: inherit;
  font-weight: 800;
  font-size: 0.78rem;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn-item-action:hover {
  transform: scale(1.04);
  filter: brightness(1.08);
}

.btn-item-action:active {
  transform: scale(0.96);
}

.btn-item-action--egg {
  background: linear-gradient(180deg, #4ADE80 0%, #16A34A 100%);
  border-color: #15803D;
  color: #FFFFFF;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.btn-item-action--food {
  background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
  border-color: #0369A1;
  color: #FFFFFF;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from { transform: scale(0.94); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
