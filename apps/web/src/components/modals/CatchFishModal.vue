<template>
  <div
    class="modal-backdrop"
    data-testid="modal-backdrop"
    @pointerdown.stop
    @pointerup.stop
    @mousedown.stop
    @mouseup.stop
    @click.self.stop="handleClose"
  >
    <div
      class="minigame-dialog"
      :class="{ 'minigame-dialog--playing': phase === 'playing' }"
      role="dialog"
      aria-modal="true"
      aria-label="Câu Cá Băng"
      @pointerdown.stop
      @pointerup.stop
      @mousedown.stop
      @mouseup.stop
      @click.stop
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-header__title-group">
          <GameIcon name="fish" size="sm" class="modal-header__icon" />
          <h2 class="modal-header__title">Câu Cá Băng</h2>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          data-testid="modal-close-btn"
          aria-label="Đóng"
          @click="handleClose"
        >
          <GameIcon name="close" size="sm" />
        </button>
      </div>

      <!-- Phase 1: Lobby & Companion Picker -->
      <div v-if="phase === 'lobby'" class="modal-body lobby-view" data-testid="minigame-lobby-view">
        <div class="lobby-section">
          <div class="section-title">Chọn Bạn Đồng Hành</div>
          <div class="companion-list">
            <div
              v-for="penguin in gameStore.ownedPenguins"
              :key="penguin.id"
              class="companion-card"
              :class="{ 'companion-card--selected': selectedCompanionId === penguin.id }"
              :data-testid="`companion-card-${penguin.id}`"
              @click="selectedCompanionId = penguin.id"
            >
              <div class="companion-card__avatar">🐧</div>
              <div class="companion-card__info">
                <div class="companion-name">{{ penguin.nickname }}</div>
                <div class="companion-meta">Cấp {{ penguin.level }} • {{ penguin.speciesId }}</div>
                <div v-if="penguin.traits?.length" class="companion-traits">
                  <span v-for="t in penguin.traits" :key="t" class="trait-tag">{{ t }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Daily Plays & Pricing Tracker -->
        <div class="daily-tracker-card" data-testid="daily-plays-tracker">
          <div class="tracker-row">
            <span>Lượt chơi hôm nay:</span>
            <span class="tracker-count"><strong>{{ playsToday }}</strong> / 6</span>
          </div>
          <div class="tracker-desc">
            <span v-if="playsToday < 3" class="text-success">Miễn phí (Còn {{ 3 - playsToday }} lượt)</span>
            <span v-else-if="playsToday < 6" class="text-warning">
              Thêm lượt: 50 Xu (Còn {{ 6 - playsToday }} lượt)
            </span>
            <span v-else class="text-danger">Đã đạt giới hạn tối đa 6 lượt hôm nay!</span>
          </div>
        </div>

        <div v-if="errorMessage" class="error-msg" data-testid="minigame-error-msg">
          {{ errorMessage }}
        </div>

        <button
          type="button"
          class="btn-start-game"
          data-testid="btn-start-game"
          :disabled="playsToday >= 6"
          @click="handleStartGame"
        >
          {{ playsToday < 3 ? 'Bắt Đầu (Miễn Phí)' : 'Bắt Đầu (50 Xu)' }}
        </button>
      </div>

      <!-- Phase 2: Playing HUD Overlay -->
      <div v-else-if="phase === 'playing'" class="modal-body playing-view" data-testid="minigame-playing-hud">
        <div class="hud-top-bar">
          <div class="hud-stat" data-testid="hud-time">
            ⏱️ {{ timeRemaining }}s
          </div>
          <div class="hud-stat" data-testid="hud-score">
            ⭐ {{ currentScore }}
          </div>
          <div class="hud-stat" data-testid="hud-combo">
            🔥 x{{ currentCombo }}
          </div>
          <button type="button" class="btn-quit-game" data-testid="btn-quit-game" @click="handleQuitGame">
            Thoát
          </button>
        </div>
      </div>

      <!-- Phase 3: Results Summary -->
      <div v-else-if="phase === 'results'" class="modal-body results-view" data-testid="minigame-results-view">
        <div class="results-header">
          <div class="results-tier-badge" :class="`tier--${calculatedReward?.tier}`" data-testid="results-tier">
            HẠNG {{ calculatedReward?.tier?.toUpperCase() }}
          </div>
          <div class="results-title">Kết Quả Câu Cá</div>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-box__val">{{ lastResult?.score ?? 0 }}</div>
            <div class="stat-box__lbl">Điểm Số</div>
          </div>
          <div class="stat-box">
            <div class="stat-box__val">{{ lastResult?.catchesCount ?? 0 }}</div>
            <div class="stat-box__lbl">Số Cá Bắt Đạt</div>
          </div>
          <div class="stat-box">
            <div class="stat-box__val">{{ lastResult?.accuracy ?? 0 }}%</div>
            <div class="stat-box__lbl">Độ Chính Xác</div>
          </div>
        </div>

        <div v-if="calculatedReward" class="rewards-summary" data-testid="rewards-summary">
          <div class="rewards-title">Phần Thưởng:</div>
          <div class="rewards-list">
            <div class="reward-pill"><GameIcon name="coin" size="xs" /> +{{ calculatedReward.coins }} Xu</div>
            <div class="reward-pill">✨ +{{ calculatedReward.playerExp }} Player EXP</div>
            <div class="reward-pill">🐧 +{{ calculatedReward.penguinExp }} Penguin EXP</div>
          </div>
        </div>

        <button
          type="button"
          class="btn-claim-reward"
          data-testid="btn-claim-reward"
          @click="handleClaimReward"
        >
          Nhận Phần Thưởng
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../../stores/gameStore';
import { gameBridge } from '../../game/bridge/GameBridge';
import type { MiniGameResult, MiniGameReward } from '@penguin/types';
import { calculateCatchFishReward } from '../../services/MiniGameRewardService';
import GameIcon from '../common/GameIcon.vue';

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();

const phase = ref<'lobby' | 'playing' | 'results'>('lobby');
const selectedCompanionId = ref<string | null>(null);
const errorMessage = ref('');

// In-game HUD metrics
const timeRemaining = ref(30);
const currentScore = ref(0);
const currentCombo = ref(0);

// Results
const lastResult = ref<MiniGameResult | null>(null);
const unsubs: (() => void)[] = [];

onMounted(() => {
  // Default to first companion if available
  if (gameStore.ownedPenguins.length > 0 && !selectedCompanionId.value) {
    selectedCompanionId.value = gameStore.ownedPenguins[0].id;
  }

  // Subscribe to bridge events
  const unsubTime = gameBridge.on('minigame:time_update', ({ remainingSeconds }) => {
    timeRemaining.value = remainingSeconds;
  });
  unsubs.push(unsubTime);

  const unsubScore = gameBridge.on('minigame:score_update', ({ score, combo }) => {
    currentScore.value = score;
    currentCombo.value = combo;
  });
  unsubs.push(unsubScore);

  const unsubEnd = gameBridge.on('minigame:ended', ({ result }) => {
    lastResult.value = result;
    phase.value = 'results';
  });
  unsubs.push(unsubEnd);
});

onUnmounted(() => {
  for (const unsub of unsubs) {
    unsub();
  }
});

const playsToday = computed(() => {
  return gameStore.miniGameState.dailyPlaysCount['catch_fish'] ?? 0;
});

const companion = computed(() => {
  if (!selectedCompanionId.value) return null;
  return gameStore.ownedPenguins.find((p) => p.id === selectedCompanionId.value) ?? null;
});

const calculatedReward = computed<MiniGameReward | null>(() => {
  if (!lastResult.value) return null;
  return calculateCatchFishReward(
    lastResult.value.score,
    companion.value?.level ?? 1,
    companion.value?.traits ?? []
  );
});

function handleStartGame() {
  errorMessage.value = '';
  const res = gameStore.startMiniGameSession('catch_fish');
  if (!res.success) {
    errorMessage.value =
      res.reason === 'INSUFFICIENT_FUNDS'
        ? 'Không đủ 50 Xu để mua thêm lượt chơi!'
        : 'Đã đạt giới hạn 6 lượt chơi hôm nay!';
    return;
  }

  // Reset metrics
  timeRemaining.value = 30;
  currentScore.value = 0;
  currentCombo.value = 0;
  phase.value = 'playing';

  // Notify Phaser scene
  gameBridge.emit('minigame:start', {
    gameId: 'catch_fish',
    sessionId: res.sessionId!,
    companionPenguinId: selectedCompanionId.value ?? undefined,
  });
}

function handleQuitGame() {
  gameBridge.emit('minigame:quit', undefined as void);
  phase.value = 'lobby';
}

function handleClaimReward() {
  if (lastResult.value) {
    gameStore.claimMiniGameReward(lastResult.value);
  }
  emit('close');
}

function handleClose() {
  if (phase.value === 'playing') {
    handleQuitGame();
  }
  emit('close');
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.minigame-dialog {
  background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 3px solid #0284c7;
  border-radius: 20px;
  width: 90%;
  max-width: 520px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  color: #0c4a6e;
}

.minigame-dialog--playing {
  background: transparent;
  border: none;
  box-shadow: none;
  max-width: 100%;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.minigame-dialog--playing .modal-header {
  display: none;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #bae6fd;
  border-bottom: 2px solid #7dd3fc;
}

.modal-header__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.modal-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
}

.modal-body {
  padding: 20px;
}

.section-title {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.companion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 14px;
}

.companion-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #ffffff;
  border: 2px solid #e0f2fe;
  border-radius: 12px;
  cursor: pointer;
}

.companion-card:hover {
  border-color: #38bdf8;
  background: #f0f9ff;
}

.companion-card--selected {
  border-color: #0284c7;
  background: #e0f2fe;
}

.companion-card__avatar {
  font-size: 1.8rem;
}

.companion-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.companion-meta {
  font-size: 0.75rem;
  color: #0369a1;
}

.companion-traits {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.trait-tag {
  background: #bae6fd;
  color: #0369a1;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
}

.daily-tracker-card {
  background: #ffffff;
  border: 1px solid #7dd3fc;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 14px;
}

.tracker-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.tracker-desc {
  font-size: 0.8rem;
  margin-top: 4px;
}

.text-success {
  color: #059669;
}
.text-warning {
  color: #d97706;
}
.text-danger {
  color: #dc2626;
}

.error-msg {
  color: #dc2626;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
}

.btn-start-game {
  width: 100%;
  padding: 14px;
  background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
}

.btn-start-game:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* Playing HUD */
.playing-view {
  position: absolute;
  top: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  pointer-events: auto;
}

.hud-top-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(15, 23, 42, 0.8);
  border: 2px solid #38bdf8;
  padding: 8px 18px;
  border-radius: 30px;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.1rem;
}

.btn-quit-game {
  background: #ef4444;
  border: none;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

/* Results View */
.results-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px;
}

.results-tier-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.tier--diamond {
  background: #cffafe;
  color: #0891b2;
  border: 2px solid #06b6d4;
}
.tier--gold {
  background: #fef3c7;
  color: #d97706;
  border: 2px solid #f59e0b;
}
.tier--silver {
  background: #f1f5f9;
  color: #475569;
  border: 2px solid #94a3b8;
}
.tier--bronze {
  background: #ffedd5;
  color: #c2410c;
  border: 2px solid #ea580c;
}

.results-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 16px;
}

.stats-grid {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.stat-box {
  background: #ffffff;
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 10px 14px;
  min-width: 90px;
}

.stat-box__val {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0284c7;
}

.stat-box__lbl {
  font-size: 0.75rem;
  color: #0369a1;
}

.rewards-summary {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 12px;
  padding: 12px;
  width: 100%;
  margin-bottom: 18px;
}

.rewards-title {
  font-weight: 700;
  font-size: 0.85rem;
  color: #166534;
  margin-bottom: 6px;
}

.rewards-list {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.reward-pill {
  background: #dcfce7;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #15803d;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-claim-reward {
  width: 100%;
  max-width: 280px;
  padding: 14px;
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}
</style>
