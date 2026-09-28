<template>
  <header class="top-bar" role="banner">
    <!-- Left: Player Profile & Level -->
    <div class="top-bar__profile">
      <div class="top-bar__avatar-wrapper">
        <div class="top-bar__avatar-ring">
          <svg class="top-bar__avatar-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Stylized default penguin face icon -->
            <ellipse cx="18" cy="20" rx="14" ry="13" fill="#1E293B" />
            <ellipse cx="18" cy="22" rx="10" ry="9" fill="#F8FAFC" />
            <ellipse cx="13" cy="17" rx="2.5" ry="3.5" fill="#0F172A" />
            <ellipse cx="23" cy="17" rx="2.5" ry="3.5" fill="#0F172A" />
            <circle cx="12" cy="15.5" r="1" fill="#FFFFFF" />
            <circle cx="22" cy="15.5" r="1" fill="#FFFFFF" />
            <path d="M15 20c0 0 1.5 2 3 2s3-2 3-2l-3 4-3-4z" fill="#F59E0B" />
          </svg>
        </div>
        <div class="top-bar__level-badge" title="Cấp độ người chơi">
          <GameIcon name="crown" size="xs" />
          <span>Lv.{{ playerLevel }}</span>
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

    <!-- Center: Currencies -->
    <div class="top-bar__currencies">
      <CurrencyBadge type="fish" :amount="gameStore.currencies.fish" />
      <CurrencyBadge type="coins" :amount="gameStore.currencies.coins" />
      <CurrencyBadge type="gems" :amount="gameStore.currencies.gems" />
    </div>

    <!-- Right: Utility Controls (Audio & Settings) -->
    <div class="top-bar__controls">
      <button
        type="button"
        class="top-bar__btn"
        data-testid="audio-toggle-btn"
        :title="gameStore.audioMuted ? 'Bật âm thanh' : 'Tắt âm thanh'"
        :aria-label="gameStore.audioMuted ? 'Bật âm thanh' : 'Tắt âm thanh'"
        @click="handleToggleAudio"
      >
        <GameIcon :name="gameStore.audioMuted ? 'sound_off' : 'sound_on'" size="sm" />
      </button>

      <button
        type="button"
        class="top-bar__btn"
        data-testid="settings-btn"
        title="Cài đặt & Sao lưu"
        aria-label="Cài đặt & Sao lưu"
        @click="emit('open-settings')"
      >
        <GameIcon name="settings" size="sm" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import { getPlayerLevelFromExp } from '../../services/ProgressionService';
import CurrencyBadge from './CurrencyBadge.vue';
import GameIcon from '../common/GameIcon.vue';

const emit = defineEmits<{
  (e: 'open-settings'): void;
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
</script>

<style scoped>
.top-bar {
  position: relative;
  width: 100%;
  max-width: 980px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  margin: 0 auto;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(224, 242, 254, 0.75) 100%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1.5px solid rgba(255, 255, 255, 0.85);
  border-radius: 9999px;
  box-shadow:
    0 6px 20px rgba(15, 23, 42, 0.12),
    inset 0 1px 2px rgba(255, 255, 255, 0.9);
  z-index: 50;
  pointer-events: auto;
}

/* Left Profile */
.top-bar__profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-bar__avatar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.top-bar__avatar-ring {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7DD3FC 0%, #0284C7 100%);
  border: 2px solid #FFFFFF;
  box-shadow:
    0 3px 8px rgba(2, 132, 199, 0.35),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.top-bar__avatar-icon {
  width: 36px;
  height: 36px;
}

.top-bar__level-badge {
  position: absolute;
  bottom: -4px;
  right: -6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  color: #FFFFFF;
  border: 1.5px solid #FEF3C7;
  border-radius: 9999px;
  padding: 1px 6px;
  font-family: 'Quicksand', 'Nunito', sans-serif;
  font-weight: 900;
  font-size: 0.72rem;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
  user-select: none;
}

.top-bar__player-meta {
  display: flex;
  flex-direction: column;
}

.top-bar__player-name {
  font-family: 'Quicksand', 'Nunito', system-ui, sans-serif;
  font-weight: 800;
  font-size: 0.95rem;
  color: #0F172A;
  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-bar__exp-bar {
  width: 90px;
  height: 6px;
  background: rgba(148, 163, 184, 0.35);
  border-radius: 9999px;
  overflow: hidden;
  position: relative;
  margin-top: 2px;
  cursor: pointer;
}

.top-bar__exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #38BDF8 0%, #0284C7 100%);
  border-radius: 9999px;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  background: linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%);
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 3px 6px rgba(15, 23, 42, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.9);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  padding: 0;
}

.top-bar__btn:hover {
  transform: translateY(-2px) scale(1.06);
  color: #0284C7;
  border-color: #BAE6FD;
  box-shadow:
    0 5px 12px rgba(2, 132, 199, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 1);
}

.top-bar__btn:active {
  transform: translateY(1px) scale(0.96);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.15);
}

.top-bar__btn-icon {
  width: 20px;
  height: 20px;
}

.top-bar__btn-icon--muted {
  color: #EF4444;
}

/* Responsive */
@media (max-width: 768px) {
  .top-bar {
    top: 8px;
    left: 8px;
    right: 8px;
    padding: 0 10px;
    height: 52px;
  }

  .top-bar__player-meta {
    display: none;
  }

  .top-bar__currencies {
    gap: 6px;
  }

  .top-bar__avatar-ring {
    width: 38px;
    height: 38px;
  }

  .top-bar__btn {
    width: 34px;
    height: 34px;
  }
}
</style>
