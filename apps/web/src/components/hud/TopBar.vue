<template>
  <header class="top-bar" role="banner">
    <!-- Left: Player Profile & Level Star (Zing Me Style) -->
    <div class="top-bar__profile">
      <!-- Player Avatar with Level Star Badge overlapping -->
      <div class="top-bar__avatar-container">
        <!-- Level Star Badge on top-left of Avatar -->
        <div class="top-bar__star-level" title="Cấp độ người chơi">
          <svg class="top-bar__star-svg" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l2.9 6.5 7.1.6-5.3 4.8 1.6 7-6.3-3.7-6.3 3.7 1.6-7-5.3-4.8 7.1-.6L12 2z"
              fill="#F59E0B"
              stroke="#FFFFFF"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
          </svg>
          <span class="top-bar__star-text">Lv.{{ playerLevel }}</span>
        </div>

        <div class="top-bar__avatar-box">
          <svg class="top-bar__avatar-img" viewBox="0 0 36 36" fill="none">
            <ellipse cx="18" cy="20" rx="14" ry="13" fill="#1E293B" />
            <ellipse cx="18" cy="22" rx="10" ry="9" fill="#F8FAFC" />
            <ellipse cx="13" cy="17" rx="2.5" ry="3.5" fill="#0F172A" />
            <ellipse cx="23" cy="17" rx="2.5" ry="3.5" fill="#0F172A" />
            <circle cx="12" cy="15.5" r="1" fill="#FFFFFF" />
            <circle cx="22" cy="15.5" r="1" fill="#FFFFFF" />
            <path d="M15 20c0 0 1.5 2 3 2s3-2 3-2l-3 4-3-4z" fill="#F59E0B" />
          </svg>
        </div>
      </div>

      <div class="top-bar__player-meta">
        <span class="top-bar__player-name">{{ playerName }}</span>
        <div
          class="top-bar__exp-bar"
          :title="expTooltip"
          data-testid="player-exp-bar"
        >
          <div
            class="top-bar__exp-fill"
            :style="{ width: `${levelInfo.progressPercent}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Center: Currencies (Fish / Coins / Gems Capsules) -->
    <div class="top-bar__currencies">
      <CurrencyBadge type="fish" :amount="gameStore.currencies.fish" />
      <CurrencyBadge type="coins" :amount="gameStore.currencies.coins" />
      <CurrencyBadge type="gems" :amount="gameStore.currencies.gems" />
    </div>

    <!-- Right: Utility Controls (Camera, Sound, Settings) -->
    <div class="top-bar__controls">
      <!-- Camera Button -->
      <button
        type="button"
        class="top-bar__btn top-bar__btn--camera"
        data-testid="camera-btn"
        title="Chụp ảnh hòn đảo"
        aria-label="Chụp ảnh"
        @click="handleSnapshot"
      >
        📷
      </button>

      <!-- Audio Mute Toggle -->
      <button
        type="button"
        class="top-bar__btn"
        data-testid="audio-toggle-btn"
        :title="gameStore.audioMuted ? 'Bật âm thanh' : 'Tắt âm thanh'"
        :aria-label="gameStore.audioMuted ? 'Bật âm thanh' : 'Tắt âm thanh'"
        @click="handleToggleAudio"
      >
        <GameIcon :name="gameStore.audioMuted ? 'sound_off' : 'sound_on'" size="xs" />
      </button>

      <!-- Settings Button -->
      <button
        type="button"
        class="top-bar__btn"
        data-testid="settings-btn"
        title="Cài đặt & Sao lưu"
        aria-label="Cài đặt & Sao lưu"
        @click="emit('open-settings')"
      >
        <GameIcon name="settings" size="xs" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import { getPlayerLevelFromExp } from '../../services/ProgressionService';
import { soundService } from '../../services/SoundService';
import CurrencyBadge from './CurrencyBadge.vue';
import GameIcon from '../common/GameIcon.vue';

const emit = defineEmits<{
  (e: 'open-settings'): void;
  (e: 'open-camera'): void;
}>();

const gameStore = useGameStore();

const playerLevel = computed(() => gameStore.player.level ?? 1);
const playerName = computed(() => gameStore.player.displayName || 'Chim Cánh Cụt');

const levelInfo = computed(() => getPlayerLevelFromExp(gameStore.player.exp ?? 0));
const expTooltip = computed(() => {
  if (levelInfo.value.level >= 10) return 'Cấp tối đa (Lv. 10)';
  return `EXP: ${gameStore.player.exp ?? 0}/${levelInfo.value.nextLevelExp} (${levelInfo.value.progressPercent}%)`;
});

function handleToggleAudio() {
  gameStore.toggleAudio();
}

function handleSnapshot() {
  soundService.playPop();
  emit('open-camera');
}
</script>

<style scoped>
/* 2010s Compact Webgame HUD - Pinned to very top */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: linear-gradient(180deg, #FFFFFF 0%, #E6F4FA 100%);
  border-bottom: 2px solid #BAE6FD;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.12);
  z-index: 100;
  pointer-events: auto;
  user-select: none;
}

/* Profile Section */
.top-bar__profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-bar__avatar-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* Level Star */
.top-bar__star-level {
  position: absolute;
  top: -8px;
  left: -10px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35));
}

.top-bar__star-svg {
  width: 32px;
  height: 32px;
}

.top-bar__star-text {
  position: absolute;
  font-family: 'Nunito', 'Quicksand', sans-serif;
  font-weight: 900;
  font-size: 0.65rem;
  color: #FFFFFF;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: -0.02em;
}

/* Avatar Box */
.top-bar__avatar-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #E0F2FE;
  border: 1.5px solid #0284C7;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.8);
}

.top-bar__avatar-img {
  width: 28px;
  height: 28px;
}

.top-bar__player-meta {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.top-bar__player-name {
  font-family: 'Nunito', 'Quicksand', system-ui, sans-serif;
  font-weight: 800;
  font-size: 0.85rem;
  color: #0F172A;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.1;
}

.top-bar__exp-bar {
  width: 75px;
  height: 6px;
  background: #CBD5E1;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 2px;
  border: 1px solid #94A3B8;
}

.top-bar__exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #10B981 0%, #34D399 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* Center Currencies */
.top-bar__currencies {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Right Controls */
.top-bar__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-bar__btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
  border: 1.5px solid #CBD5E1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.15s ease, background 0.15s ease;
}

.top-bar__btn:hover {
  transform: translateY(-1px);
  background: #E2E8F0;
  border-color: #94A3B8;
}

.top-bar__btn--camera {
  background: linear-gradient(180deg, #FEF08A 0%, #F59E0B 100%);
  border-color: #D97706;
  color: #78350F;
}

@media (max-width: 640px) {
  .top-bar {
    padding: 0 8px;
  }
  .top-bar__currencies {
    gap: 6px;
  }
  .top-bar__player-meta {
    display: none;
  }
}
</style>
