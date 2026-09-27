<template>
  <div class="modal-backdrop" data-testid="modal-backdrop" @click.self="emit('close')">
    <div class="collection-dialog" role="dialog" aria-modal="true" aria-label="Bộ Sưu Tập Cánh Cụt">
      <!-- Frost Header Bar -->
      <div class="modal-header">
        <div class="modal-header__title-group">
          <span class="modal-header__icon">📖</span>
          <h2 class="modal-header__title">Bộ Sưu Tập Cánh Cụt</h2>
          <span class="progress-pill">
            {{ colStore.discoveredCount }} / {{ colStore.totalSpeciesCount }} Đã Thu Thập
          </span>
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

      <!-- Main Encyclopedia Content: Grid & Detail Panel -->
      <div class="modal-content">
        <!-- Species Grid -->
        <div class="species-grid" role="list" aria-label="Danh sách loài chim cánh cụt">
          <div
            v-for="species in SPECIES_LIST"
            :key="species.id"
            class="species-card"
            :class="{
              'is-discovered': isDiscovered(species.id),
              'is-undiscovered': !isDiscovered(species.id),
              'is-selected': selectedSpecies?.id === species.id,
            }"
            :data-testid="`species-card-${species.id}`"
            role="listitem"
            tabindex="0"
            @click="selectSpecies(species)"
            @keydown.enter="selectSpecies(species)"
            @keydown.space.prevent="selectSpecies(species)"
          >
            <div class="species-card__number">#{{ species.speciesNumber }}</div>
            
            <div class="species-card__preview">
              <template v-if="isDiscovered(species.id)">
                <!-- Stylized Discovered Penguin Illustration -->
                <div class="penguin-avatar" :class="`penguin-avatar--${species.id}`">
                  <svg viewBox="0 0 48 48" class="penguin-svg">
                    <!-- Body base -->
                    <ellipse cx="24" cy="26" rx="16" ry="18" :fill="getSpeciesColor(species.id)" />
                    <!-- Belly -->
                    <ellipse cx="24" cy="28" rx="10" ry="13" fill="#FFFFFF" />
                    <!-- Cheeks / Blush -->
                    <circle cx="17" cy="23" r="2.5" fill="#FDA4AF" opacity="0.8" />
                    <circle cx="31" cy="23" r="2.5" fill="#FDA4AF" opacity="0.8" />
                    <!-- Eyes -->
                    <circle cx="19" cy="19" r="2" fill="#0F172A" />
                    <circle cx="29" cy="19" r="2" fill="#0F172A" />
                    <circle cx="20" cy="18" r="0.8" fill="#FFFFFF" />
                    <circle cx="30" cy="18" r="0.8" fill="#FFFFFF" />
                    <!-- Beak -->
                    <polygon points="24,21 21,24 27,24" fill="#F59E0B" />
                    <!-- Feet -->
                    <ellipse cx="19" cy="43" rx="4" ry="2" fill="#F59E0B" />
                    <ellipse cx="29" cy="43" rx="4" ry="2" fill="#F59E0B" />
                  </svg>
                </div>
              </template>
              <template v-else>
                <!-- Undiscovered Silhouette -->
                <div class="penguin-silhouette">
                  <span class="silhouette-mark">?</span>
                </div>
              </template>
            </div>

            <div class="species-card__info">
              <h4 class="species-card__name">
                {{ isDiscovered(species.id) ? species.name : '???' }}
              </h4>
              <span
                class="rarity-badge"
                :class="`rarity-badge--${species.rarity}`"
              >
                {{ getRarityLabel(species.rarity) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Selected Species Detail Panel -->
        <div v-if="selectedSpecies" class="detail-panel" data-testid="species-detail">
          <div class="detail-panel__header">
            <div>
              <span class="detail-panel__num">#{{ selectedSpecies.speciesNumber }}</span>
              <h3 class="detail-panel__name">
                {{ isDiscovered(selectedSpecies.id) ? selectedSpecies.name : 'Chưa phát hiện' }}
              </h3>
            </div>
            <span
              class="rarity-badge"
              :class="`rarity-badge--${selectedSpecies.rarity}`"
            >
              {{ getRarityLabel(selectedSpecies.rarity) }}
            </span>
          </div>

          <div v-if="isDiscovered(selectedSpecies.id)" class="detail-panel__body">
            <p class="detail-desc">{{ selectedSpecies.description }}</p>

            <div class="detail-stats-grid">
              <div class="stat-row">
                <span class="stat-label">✨ Đặc điểm:</span>
                <span class="stat-value">{{ selectedSpecies.trait }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">🐟 Món khoái khẩu:</span>
                <span class="stat-value">{{ selectedSpecies.favoriteFood }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">🙅 Không thích:</span>
                <span class="stat-value">{{ selectedSpecies.dislikedFood }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">📅 Ngày phát hiện:</span>
                <span class="stat-value">{{ getDiscoveredDate(selectedSpecies.id) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="detail-panel__undiscovered">
            <div class="clue-box">
              <span class="clue-icon">🔍</span>
              <p class="clue-text">
                <strong>Gợi ý:</strong> {{ selectedSpecies.clue }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PenguinSpecies, RarityTier } from '@penguin/types';
import { SPECIES_LIST } from '@penguin/game-data';
import { useCollectionStore } from '../../stores/collectionStore';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const colStore = useCollectionStore();
const selectedSpecies = ref<PenguinSpecies | null>(SPECIES_LIST[0] ?? null);

function isDiscovered(speciesId: string): boolean {
  return colStore.isDiscovered(speciesId);
}

function selectSpecies(species: PenguinSpecies) {
  selectedSpecies.value = species;
}

function getSpeciesColor(speciesId: string): string {
  switch (speciesId) {
    case 'snowy':
      return '#38BDF8';
    case 'sleepy':
      return '#818CF8';
    case 'shy':
      return '#F472B6';
    case 'happy':
      return '#FBBF24';
    case 'hungry':
      return '#34D399';
    default:
      return '#38BDF8';
  }
}

function getRarityLabel(rarity: RarityTier): string {
  switch (rarity) {
    case 'common':
      return 'Phổ Biến';
    case 'uncommon':
      return 'Hiếm Nhẹ';
    case 'rare':
      return 'Hiếm';
    case 'epic':
      return 'Sử Thi';
    case 'legendary':
      return 'Huyền Thoại';
    case 'mythic':
      return 'Thần Thoại';
  }
}

function getDiscoveredDate(speciesId: string): string {
  const entry = colStore.discoveryDetails(speciesId);
  if (!entry?.discoveredAt) return 'Không rõ';
  const d = new Date(entry.discoveredAt);
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
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

.collection-dialog {
  width: 100%;
  max-width: 740px;
  max-height: 90vh;
  background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
  border: 3px solid #7DD3FC;
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
  padding: 18px 24px;
  background: linear-gradient(180deg, #E0F2FE 0%, #BAE6FD 100%);
  border-bottom: 2px solid #7DD3FC;
}

.modal-header__title-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.modal-header__icon {
  font-size: 1.5rem;
}

.modal-header__title {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0369A1;
  margin: 0;
}

.progress-pill {
  padding: 4px 12px;
  border-radius: 999px;
  background: #0284C7;
  color: #FFFFFF;
  font-size: 0.82rem;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.35);
}

.modal-close-btn {
  width: 36px;
  height: 36px;
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
  color: #EF4444;
  transform: scale(1.08);
}

.modal-content {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 18px;
  padding: 20px;
  overflow-y: auto;
}

@media (max-width: 680px) {
  .modal-content {
    grid-template-columns: 1fr;
  }
}

/* Species Grid */
.species-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.species-card {
  position: relative;
  background: #FFFFFF;
  border: 2px solid #E2E8F0;
  border-radius: 18px;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
}

.species-card:hover {
  transform: translateY(-3px) scale(1.02);
  border-color: #38BDF8;
  box-shadow: 0 8px 16px rgba(56, 189, 248, 0.2);
}

.species-card.is-selected {
  border-color: #0284C7;
  background: #F0F9FF;
  box-shadow: 0 0 0 2px #0284C7;
}

.species-card__number {
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 0.68rem;
  font-weight: 800;
  color: #94A3B8;
}

.species-card__preview {
  width: 56px;
  height: 56px;
  margin: 10px 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.penguin-avatar {
  width: 100%;
  height: 100%;
}

.penguin-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15));
}

.penguin-silhouette {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
}

.silhouette-mark {
  font-size: 1.5rem;
  font-weight: 900;
}

.species-card__name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1E293B;
  margin: 2px 0 4px;
}

.rarity-badge {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-block;
  text-transform: uppercase;
}

.rarity-badge--common {
  background: #E0F2FE;
  color: #0369A1;
}

.rarity-badge--uncommon {
  background: #DCFCE7;
  color: #15803D;
}

.rarity-badge--rare {
  background: #FEF3C7;
  color: #B45309;
}

.rarity-badge--epic {
  background: #F3E8FF;
  color: #7E22CE;
}

.rarity-badge--legendary {
  background: #FFEDD5;
  color: #C2410C;
}

.rarity-badge--mythic {
  background: #FCE7F3;
  color: #BE185D;
}

/* Detail Panel */
.detail-panel {
  background: #FFFFFF;
  border: 2px solid #BAE6FD;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid #E2E8F0;
}

.detail-panel__num {
  font-size: 0.78rem;
  font-weight: 800;
  color: #0284C7;
}

.detail-panel__name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0F172A;
  margin: 2px 0 0;
}

.detail-desc {
  font-size: 0.9rem;
  color: #475569;
  line-height: 1.5;
  margin: 0;
  font-style: italic;
}

.detail-stats-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  padding: 6px 10px;
  background: #F8FAFC;
  border-radius: 10px;
}

.stat-label {
  color: #64748B;
  font-weight: 600;
}

.stat-value {
  color: #0F172A;
  font-weight: 700;
}

.detail-panel__undiscovered {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 12px;
  text-align: center;
}

.clue-box {
  background: #FEF3C7;
  border: 1px solid #FDE68A;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #92400E;
}

.clue-icon {
  font-size: 1.5rem;
}

.clue-text {
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
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
