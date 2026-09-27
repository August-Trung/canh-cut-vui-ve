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
          <span>Lv.{{ playerLevel }}</span>
        </div>
      </div>

      <div class="top-bar__player-meta">
        <span class="top-bar__player-name">{{ playerName }}</span>
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
        <!-- Sound Unmuted Icon -->
        <svg
          v-if="!gameStore.audioMuted"
          class="top-bar__btn-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.3" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>

        <!-- Sound Muted Icon -->
        <svg
          v-else
          class="top-bar__btn-icon top-bar__btn-icon--muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.3" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      </button>

      <button
        type="button"
        class="top-bar__btn"
        data-testid="settings-btn"
        title="Cài đặt & Sao lưu"
        aria-label="Cài đặt & Sao lưu"
        @click="emit('open-settings')"
      >
        <svg
          class="top-bar__btn-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import CurrencyBadge from './CurrencyBadge.vue';

const emit = defineEmits<{
  (e: 'open-settings'): void;
}>();

const gameStore = useGameStore();

const playerLevel = computed(() => gameStore.player.level ?? 1);
const playerName = computed(() => gameStore.player.displayName || 'Chim Cánh Cụt');

function handleToggleAudio() {
  gameStore.toggleAudio();
}
</script>

<style scoped>
.top-bar {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35) 0%, rgba(224, 242, 254, 0.45) 100%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  border-radius: 20px;
  box-shadow:
    0 8px 24px rgba(15, 23, 42, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.8);
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
