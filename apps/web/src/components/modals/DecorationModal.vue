<template>
  <div
    class="modal-backdrop"
    data-testid="decor-modal-backdrop"
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @click.self.stop="emit('close')"
  >
    <div
      class="decor-dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Trang Trí Đảo Tuyết"
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
    >
      <!-- Header -->
      <div class="decor-header">
        <div class="decor-header__title-group">
          <GameIcon name="decorate" size="sm" class="decor-header__icon" />
          <div>
            <h2 class="decor-header__title">Trang Trí Đảo Tuyết</h2>
            <p class="decor-header__sub">Sắp đặt các công trình để tăng Điểm Ấm Cúng và thưởng rơi Vàng!</p>
          </div>
        </div>

        <div class="decor-header__right">
          <div class="cozy-chip" data-testid="decor-cozy-rating">
            <GameIcon name="star" size="xs" />
            <span>{{ decorStore.cozyRating }} Điểm Ấm Cúng (+{{ Math.round((decorStore.coinDropMultiplier - 1) * 100) }}% Vàng)</span>
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
      </div>

      <!-- Main Layout: Plots Selector (Left/Top) & Plot Details / Inventory (Right/Bottom) -->
      <div class="decor-body">
        <!-- Plots Grid -->
        <div class="plots-section">
          <h3 class="section-label">
            <GameIcon name="target" size="xs" />
            <span>Chọn Vị Trí Cắm Cọc (6 Điểm):</span>
          </h3>
          <div class="plots-grid">
            <button
              v-for="plot in decorStore.plots"
              :key="plot.id"
              type="button"
              class="plot-card"
              :class="{
                'plot-card--selected': selectedPlotId === plot.id,
                'plot-card--occupied': isPlotOccupied(plot.id),
              }"
              :data-testid="`plot-btn-${plot.id}`"
              @click="selectedPlotId = plot.id"
            >
              <div class="plot-card__id">Điểm #{{ plot.id }}</div>
              <div class="plot-card__icon">
                <GameIcon :name="isPlotOccupied(plot.id) ? 'decorate' : 'target'" size="md" />
              </div>
              <div class="plot-card__name">{{ plot.name }}</div>
              <div class="plot-card__status">
                {{ isPlotOccupied(plot.id) ? getPlacedDecorName(plot.id) : '(Đang trống)' }}
              </div>
            </button>
          </div>
        </div>

        <!-- Selected Plot Action Section -->
        <div class="action-section" v-if="selectedPlot">
          <div class="action-header">
            <h4>Chi tiết Điểm #{{ selectedPlot.id }}: {{ selectedPlot.name }}</h4>
          </div>

          <!-- Occupied Plot State -->
          <div v-if="currentPlacedDecor" class="occupied-box" data-testid="plot-occupied-view">
            <div class="occupied-info">
              <GameIcon name="decorate" size="md" class="occupied-icon" />
              <div>
                <div class="occupied-title">{{ currentPlacedDecorDef?.name }}</div>
                <div class="occupied-desc">{{ currentPlacedDecorDef?.description }}</div>
                <div class="occupied-points">
                  <GameIcon name="star" size="xs" /> +{{ currentPlacedDecorDef?.cozyPoints }} Điểm Ấm Cúng
                </div>
              </div>
            </div>

            <div class="occupied-buttons">
              <button
                type="button"
                class="btn-remove-decor"
                data-testid="btn-remove-decor"
                @click="removeCurrentDecor"
              >
                <GameIcon name="inventory" size="xs" />
                <span>Thu Hồi Vào Túi Đồ</span>
              </button>
            </div>

            <!-- Replace Drawer -->
            <div class="replace-drawer">
              <h5>Hoặc Thay Thế Bằng Đồ Trong Túi:</h5>
              <div v-if="inventoryDecors.length === 0" class="empty-inv-hint">
                Không có đồ trang trí nào khác trong túi.
              </div>
              <div v-else class="drawer-grid">
                <div
                  v-for="item in inventoryDecors"
                  :key="item.itemId"
                  class="drawer-card"
                  :data-testid="`inv-replace-${item.itemId}`"
                >
                  <span class="drawer-card__name">{{ item.name }} (x{{ item.quantity }})</span>
                  <button
                    type="button"
                    class="btn-place-action"
                    @click="replaceCurrentDecor(item.itemId)"
                  >
                    Thay Thế
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Plot State -->
          <div v-else class="empty-box" data-testid="plot-empty-view">
            <p class="empty-desc">Vị trí này đang trống. Hãy chọn một vật phẩm từ túi đồ để đặt:</p>

            <div v-if="inventoryDecors.length === 0" class="empty-inv-box">
              <p>Bạn chưa có đồ trang trí nào trong túi đồ!</p>
              <button
                type="button"
                class="btn-go-shop"
                data-testid="btn-go-shop"
                @click="emit('open-shop')"
              >
                <GameIcon name="shop" size="xs" />
                <span>Đến Cửa Hàng Mua Đồ Trang Trí</span>
              </button>
            </div>

            <div v-else class="decor-inv-grid">
              <div
                v-for="item in inventoryDecors"
                :key="item.itemId"
                class="inv-decor-card"
                :data-testid="`inv-decor-${item.itemId}`"
              >
                <div class="inv-decor-card__icon">
                  <GameIcon name="decorate" size="md" />
                </div>
                <div class="inv-decor-card__name">{{ item.name }}</div>
                <div class="inv-decor-card__qty">Còn: {{ item.quantity }}</div>
                <button
                  type="button"
                  class="btn-place-action"
                  :data-testid="`btn-place-${item.itemId}`"
                  @click="placeDecor(item.itemId)"
                >
                  Đặt Lên Đảo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { DECORATION_CATALOG } from '@penguin/game-data';
import { useDecorationStore } from '../../stores/decorationStore';
import { useInventoryStore } from '../../stores/inventoryStore';
import GameIcon from '../common/GameIcon.vue';

const props = withDefaults(
  defineProps<{
    initialPlotId?: number;
  }>(),
  {
    initialPlotId: 1,
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'open-shop'): void;
}>();

const decorStore = useDecorationStore();
const invStore = useInventoryStore();

const selectedPlotId = ref<number>(props.initialPlotId);

const selectedPlot = computed(() => {
  return decorStore.plots.find((p) => p.id === selectedPlotId.value);
});

const currentPlacedDecor = computed(() => {
  return decorStore.getDecorationOnPlot(selectedPlotId.value);
});

const currentPlacedDecorDef = computed(() => {
  if (!currentPlacedDecor.value) return null;
  return DECORATION_CATALOG[currentPlacedDecor.value.decorationId];
});

const inventoryDecors = computed(() => {
  return invStore.itemsByCategory('decorations').filter((i) => i.quantity > 0);
});

function isPlotOccupied(plotId: number): boolean {
  return !!decorStore.getDecorationOnPlot(plotId);
}

function getPlacedDecorName(plotId: number): string {
  const placed = decorStore.getDecorationOnPlot(plotId);
  if (!placed) return '';
  const def = DECORATION_CATALOG[placed.decorationId];
  return def?.name ?? placed.decorationId;
}

function placeDecor(itemId: string) {
  decorStore.placeDecoration(selectedPlotId.value, itemId);
}

function removeCurrentDecor() {
  decorStore.removeDecoration(selectedPlotId.value);
}

function replaceCurrentDecor(newItemId: string) {
  decorStore.replaceDecoration(selectedPlotId.value, newItemId);
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

.decor-dialog {
  background: #FBF6EB;
  border: 4px solid #6B3E1B;
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.45),
    inset 0 0 0 2px #FFF9E6,
    inset 0 -3px 6px rgba(107, 62, 27, 0.2);
  animation: slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.decor-header {
  padding: 10px 16px;
  background: linear-gradient(180deg, #F5E6CA 0%, #E8D2AC 100%);
  border-bottom: 3px solid #6B3E1B;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.decor-header__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.decor-header__icon {
  font-size: 1.8rem;
}

.decor-header__title {
  margin: 0;
  font-family: 'Quicksand', 'Nunito', sans-serif;
  font-size: 1.15rem;
  font-weight: 900;
  color: #451A03;
  letter-spacing: 0.02em;
}

.decor-header__sub {
  margin: 1px 0 0 0;
  font-size: 0.76rem;
  color: #78350F;
  font-weight: 700;
}

.decor-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cozy-chip {
  background: #78350F;
  border: 1.5px solid #D97706;
  color: #FEF08A;
  font-weight: 800;
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: 12px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
}

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

.decor-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-label {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
}

.plots-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
}

@media (max-width: 680px) {
  .plots-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.plot-card {
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  padding: 10px 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.plot-card:hover {
  border-color: #38bdf8;
  transform: translateY(-2px);
}

.plot-card--selected {
  border-color: #0284c7;
  background: #f0f9ff;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.15);
}

.plot-card--occupied {
  border-color: #86efac;
}

.plot-card__id {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
}

.plot-card__icon {
  font-size: 1.5rem;
}

.plot-card__name {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0f172a;
}

.plot-card__status {
  font-size: 0.65rem;
  color: #64748b;
  min-height: 18px;
}

.action-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 18px;
}

.action-header h4 {
  margin: 0 0 14px 0;
  font-size: 1.05rem;
  color: #0f172a;
}

.occupied-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.occupied-info {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

.occupied-icon {
  font-size: 2.2rem;
}

.occupied-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.occupied-desc {
  font-size: 0.8rem;
  color: #64748b;
}

.occupied-points {
  font-size: 0.8rem;
  font-weight: 700;
  color: #d97706;
  margin-top: 4px;
}

.occupied-buttons {
  display: flex;
  gap: 10px;
}

.btn-remove-decor {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-remove-decor:hover {
  background: #fca5a5;
  color: #7f1d1d;
}

.replace-drawer {
  background: #ffffff;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
}

.replace-drawer h5 {
  margin: 0 0 10px 0;
  font-size: 0.9rem;
  color: #475569;
}

.drawer-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.drawer-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
}

.empty-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.empty-desc {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.empty-inv-box {
  text-align: center;
  padding: 24px;
  background: #ffffff;
  border-radius: 14px;
  border: 1px dashed #cbd5e1;
}

.btn-go-shop {
  margin-top: 10px;
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
}

.decor-inv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.inv-decor-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.inv-decor-card__icon {
  font-size: 1.8rem;
}

.inv-decor-card__name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.inv-decor-card__qty {
  font-size: 0.75rem;
  color: #64748b;
}

.btn-place-action {
  background: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-place-action:hover {
  background: #0369a1;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(16px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
