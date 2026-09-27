<template>
  <div class="modal-backdrop" data-testid="modal-backdrop" @click.self="emit('close')">
    <div class="hatch-dialog" role="dialog" aria-modal="true" aria-label="Ấp Trứng Cánh Cụt">
      <!-- Hidden stage indicator for accessibility & tests -->
      <div data-testid="hatch-stage-indicator" class="sr-only">{{ currentStage }}</div>

      <!-- Close button (available in early stages or after reveal) -->
      <button
        type="button"
        class="modal-close-btn"
        data-testid="modal-close-btn"
        aria-label="Đóng"
        @click="emit('close')"
      >
        ✕
      </button>

      <!-- Stage 1-3: Egg Animation Stages (Wobble, Crack, Burst) -->
      <div
        v-if="currentStage !== 'reveal'"
        class="hatch-scene"
        data-testid="interactive-egg"
        @click="advanceStage"
      >
        <div class="hatch-instruction">
          <span class="pulse-icon">✨</span>
          <span v-if="currentStage === 'wobble'">Chạm vào quả trứng để ấp nở!</span>
          <span v-else-if="currentStage === 'crack'">Vỏ trứng đang nứt ra...!</span>
          <span v-else-if="currentStage === 'burst'">Ánh sáng bừng nở...!</span>
        </div>

        <div class="egg-container" :class="`egg-container--${currentStage}`">
          <!-- Wobble Stage Egg -->
          <div
            v-if="currentStage === 'wobble'"
            class="egg-visual egg-visual--wobble"
            data-testid="egg-stage-wobble"
          >
            <svg viewBox="0 0 120 160" class="egg-svg">
              <defs>
                <linearGradient id="egg-grad-wobble" x1="20" y1="20" x2="100" y2="150" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#E0F2FE" />
                  <stop offset="0.6" stop-color="#BAE6FD" />
                  <stop offset="1" stop-color="#38BDF8" />
                </linearGradient>
              </defs>
              <ellipse cx="60" cy="90" rx="46" ry="60" fill="url(#egg-grad-wobble)" stroke="#0284C7" stroke-width="4" />
              <!-- Egg spots -->
              <circle cx="45" cy="70" r="8" fill="#FFFFFF" opacity="0.6" />
              <circle cx="78" cy="95" r="10" fill="#FFFFFF" opacity="0.6" />
              <circle cx="48" cy="115" r="6" fill="#FFFFFF" opacity="0.6" />
              <!-- Egg shine -->
              <ellipse cx="40" cy="55" rx="7" ry="16" transform="rotate(-30 40 55)" fill="#FFFFFF" opacity="0.8" />
            </svg>
          </div>

          <!-- Crack Stage Egg -->
          <div
            v-else-if="currentStage === 'crack'"
            class="egg-visual egg-visual--crack"
            data-testid="egg-stage-crack"
          >
            <svg viewBox="0 0 120 160" class="egg-svg">
              <defs>
                <linearGradient id="egg-grad-crack" x1="20" y1="20" x2="100" y2="150" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#E0F2FE" />
                  <stop offset="0.6" stop-color="#BAE6FD" />
                  <stop offset="1" stop-color="#0284C7" />
                </linearGradient>
              </defs>
              <ellipse cx="60" cy="90" rx="46" ry="60" fill="url(#egg-grad-crack)" stroke="#0284C7" stroke-width="4" />
              <!-- Egg spots -->
              <circle cx="45" cy="70" r="8" fill="#FFFFFF" opacity="0.6" />
              <circle cx="78" cy="95" r="10" fill="#FFFFFF" opacity="0.6" />
              <!-- Zigzag Cracks Spread -->
              <path
                d="M60 40 L52 65 L68 85 L48 105 L62 125"
                stroke="#0369A1"
                stroke-width="3.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
              <path
                d="M68 85 L85 92 L92 108"
                stroke="#0369A1"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              />
            </svg>
          </div>

          <!-- Burst Stage Light Flash & Stars -->
          <div
            v-else-if="currentStage === 'burst'"
            class="egg-visual egg-visual--burst"
            data-testid="egg-stage-burst"
          >
            <div class="burst-light-ray"></div>
            <div class="burst-stars">
              <span class="burst-star star-1">⭐</span>
              <span class="burst-star star-2">✨</span>
              <span class="burst-star star-3">🌟</span>
              <span class="burst-star star-4">⭐</span>
              <span class="burst-star star-5">✨</span>
            </div>
            <svg viewBox="0 0 120 160" class="egg-svg">
              <ellipse cx="60" cy="90" rx="46" ry="60" fill="#FDE68A" stroke="#F59E0B" stroke-width="4" />
            </svg>
          </div>
        </div>

        <button type="button" class="btn-advance">
          {{ currentStage === 'wobble' ? 'Chạm Để Nứt ➔' : 'Tiếp Tục ➔' }}
        </button>
      </div>

      <!-- Stage 4: Reveal of new OwnedPenguin -->
      <div
        v-else
        class="reveal-scene"
        data-testid="egg-stage-reveal"
      >
        <div class="reveal-header">
          <span class="reveal-subtitle">Chào Mừng Thành Viên Mới!</span>
          <h2 class="reveal-species-name" data-testid="reveal-species-name">
            {{ activeSpecies.name }}
          </h2>
          <span
            class="rarity-badge"
            :class="`rarity-badge--${activeSpecies.rarity}`"
            data-testid="reveal-rarity-badge"
          >
            {{ getRarityLabel(activeSpecies.rarity) }}
          </span>
        </div>

        <!-- Penguin Presentation -->
        <div class="reveal-avatar-wrap">
          <div class="avatar-glow"></div>
          <svg viewBox="0 0 48 48" class="reveal-penguin-svg">
            <ellipse cx="24" cy="26" rx="16" ry="18" :fill="getSpeciesColor(activeSpecies.id)" />
            <ellipse cx="24" cy="28" rx="10" ry="13" fill="#FFFFFF" />
            <circle cx="17" cy="23" r="2.5" fill="#FDA4AF" opacity="0.8" />
            <circle cx="31" cy="23" r="2.5" fill="#FDA4AF" opacity="0.8" />
            <circle cx="19" cy="19" r="2" fill="#0F172A" />
            <circle cx="29" cy="19" r="2" fill="#0F172A" />
            <circle cx="20" cy="18" r="0.8" fill="#FFFFFF" />
            <circle cx="30" cy="18" r="0.8" fill="#FFFFFF" />
            <polygon points="24,21 21,24 27,24" fill="#F59E0B" />
            <ellipse cx="19" cy="43" rx="4" ry="2" fill="#F59E0B" />
            <ellipse cx="29" cy="43" rx="4" ry="2" fill="#F59E0B" />
          </svg>
        </div>

        <!-- Traits & Quote -->
        <div class="reveal-info-card">
          <div class="trait-line">
            <span class="trait-label">Tính cách:</span>
            <span class="trait-val" data-testid="reveal-personality-trait">
              {{ activeSpecies.trait }} ({{ activeSpecies.personality }})
            </span>
          </div>
          <p class="reveal-desc" data-testid="reveal-description">
            "{{ activeSpecies.description }}"
          </p>
        </div>

        <!-- Nickname Input Section -->
        <div class="nickname-form">
          <label class="nickname-label" for="hatch-nickname-input">
            Đặt tên cho bé (tối đa 20 ký tự):
          </label>
          <div class="nickname-input-wrap">
            <input
              id="hatch-nickname-input"
              v-model="nicknameInput"
              type="text"
              class="nickname-input"
              :class="{ 'nickname-input--error': nicknameError }"
              data-testid="nickname-input"
              placeholder="Nhập biệt danh đáng yêu..."
              maxlength="20"
              @input="onNicknameInput"
            />
          </div>
          <div
            v-if="nicknameError"
            class="nickname-error-msg"
            data-testid="nickname-error"
          >
            {{ nicknameError }}
          </div>
        </div>

        <!-- Action Button -->
        <button
          type="button"
          class="btn-confirm-hatch"
          :disabled="!!nicknameError"
          data-testid="hatch-confirm-btn"
          @click="completeHatching"
        >
          🎉 Đón Bé Về Đảo!
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { PenguinSpecies, RarityTier } from '@penguin/types';
import { SPECIES_MAP, SPECIES_LIST, EGG_TYPES_MAP } from '@penguin/game-data';
import { useGameStore } from '../../stores/gameStore';
import { gameBridge } from '../../game/bridge/GameBridge';
import { validateNickname } from '../../services/NicknameValidator';
import { randomService } from '../../services/RandomService';

const props = defineProps<{
  slotId: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const gameStore = useGameStore();

type HatchStage = 'wobble' | 'crack' | 'burst' | 'reveal';
const currentStage = ref<HatchStage>('wobble');
const nicknameInput = ref('');
const nicknameError = ref<string | null>(null);
const revealedSpecies = ref<PenguinSpecies | null>(null);

// Slot information
const currentSlot = computed(() => gameStore.getSlotById(props.slotId));
const currentEggDef = computed(() => {
  if (!currentSlot.value?.eggTypeId) return null;
  return EGG_TYPES_MAP.get(currentSlot.value.eggTypeId) ?? null;
});

const previewFallback = computed<PenguinSpecies>(() => {
  return SPECIES_LIST[0]!;
});

const activeSpecies = computed<PenguinSpecies>(() => {
  return revealedSpecies.value ?? previewFallback.value;
});

function advanceStage() {
  if (currentStage.value === 'wobble') {
    currentStage.value = 'crack';
  } else if (currentStage.value === 'crack') {
    currentStage.value = 'burst';
  } else if (currentStage.value === 'burst') {
    currentStage.value = 'reveal';
    if (!revealedSpecies.value) {
      if (currentEggDef.value?.dropPool) {
        const rolledId = randomService.rollDrop(currentEggDef.value.dropPool);
        revealedSpecies.value = SPECIES_MAP.get(rolledId) ?? SPECIES_LIST[0]!;
      } else {
        revealedSpecies.value = SPECIES_LIST[0]!;
      }
    }
    nicknameInput.value = revealedSpecies.value.name;
    validateCurrentNickname();
  }
}

function onNicknameInput() {
  validateCurrentNickname();
}

function validateCurrentNickname() {
  const trimmed = nicknameInput.value.trim();
  if (!trimmed) {
    nicknameError.value = null;
    return;
  }
  const result = validateNickname(nicknameInput.value, activeSpecies.value.name);
  if (!result.valid) {
    nicknameError.value = result.error ?? 'Tên không hợp lệ';
  } else {
    nicknameError.value = null;
  }
}

function completeHatching() {
  if (nicknameError.value) return;

  const raw = nicknameInput.value;
  const nameToPass = raw.trim() ? raw.trim() : '';

  const newPenguin = gameStore.hatchEgg(
    props.slotId,
    nameToPass,
    activeSpecies.value.id
  );
  if (newPenguin) {
    gameBridge.emit('penguin:spawn', { penguin: newPenguin });
    gameBridge.emit('camera:focus', { x: 0, y: 0 });
  }

  emit('close');
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
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

.hatch-dialog {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F0F9FF 100%);
  border: 4px solid #7DD3FC;
  border-radius: 32px;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.35),
    0 0 0 2px rgba(255, 255, 255, 0.9) inset;
  padding: 30px 24px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  animation: popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: #E2E8F0;
  color: #64748B;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.15s ease;
  z-index: 10;
}

.modal-close-btn:hover {
  background: #FEE2E2;
  color: #EF4444;
  transform: scale(1.08);
}

.hatch-scene {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  user-select: none;
}

.hatch-instruction {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0284C7;
  text-align: center;
}

.pulse-icon {
  animation: pulse 1s infinite alternate;
}

.egg-container {
  width: 140px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.egg-visual {
  width: 100%;
  height: 100%;
}

.egg-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 10px 20px rgba(2, 132, 199, 0.3));
}

/* Wobble Animation */
.egg-visual--wobble {
  animation: eggWobble 1.2s infinite ease-in-out;
  transform-origin: 50% 90%;
}

/* Crack Animation */
.egg-visual--crack {
  animation: eggCrackShake 0.4s infinite ease-in-out;
  transform-origin: 50% 90%;
}

/* Burst Animation */
.egg-visual--burst {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.burst-light-ray {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(254, 240, 138, 0.9) 0%, rgba(253, 224, 71, 0.4) 50%, rgba(255, 255, 255, 0) 70%);
  animation: burstGlow 0.8s infinite alternate;
  pointer-events: none;
}

.burst-stars {
  position: absolute;
  inset: -20px;
  pointer-events: none;
}

.burst-star {
  position: absolute;
  font-size: 1.4rem;
  animation: floatSparkle 1s infinite ease-in-out;
}

.star-1 { top: 10%; left: 10%; animation-delay: 0s; }
.star-2 { top: 5%; right: 15%; animation-delay: 0.2s; }
.star-3 { bottom: 15%; left: 15%; animation-delay: 0.4s; }
.star-4 { bottom: 10%; right: 10%; animation-delay: 0.6s; }
.star-5 { top: 45%; left: -10%; animation-delay: 0.8s; }

.btn-advance {
  padding: 10px 24px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(180deg, #38BDF8 0%, #0284C7 100%);
  color: #FFFFFF;
  font-weight: 800;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
  cursor: pointer;
  transition: transform 0.15s ease;
}

.btn-advance:hover {
  transform: translateY(-2px) scale(1.04);
}

/* Reveal Scene */
.reveal-scene {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.reveal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.reveal-subtitle {
  font-size: 0.82rem;
  font-weight: 700;
  color: #0284C7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.reveal-species-name {
  font-size: 1.6rem;
  font-weight: 900;
  color: #0F172A;
  margin: 0;
}

.reveal-avatar-wrap {
  position: relative;
  width: 110px;
  height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0;
}

.avatar-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(255, 255, 255, 0) 70%);
}

.reveal-penguin-svg {
  width: 90px;
  height: 90px;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.18));
}

.reveal-info-card {
  width: 100%;
  background: #FFFFFF;
  border: 2px solid #BAE6FD;
  border-radius: 18px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trait-line {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
}

.trait-label {
  color: #64748B;
  font-weight: 600;
}

.trait-val {
  color: #0284C7;
  font-weight: 800;
}

.reveal-desc {
  font-size: 0.85rem;
  color: #475569;
  font-style: italic;
  margin: 0;
  line-height: 1.4;
}

.nickname-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nickname-label {
  font-size: 0.84rem;
  font-weight: 700;
  color: #334155;
}

.nickname-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 14px;
  border: 2px solid #CBD5E1;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0F172A;
  background: #FFFFFF;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.nickname-input:focus {
  border-color: #0284C7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
}

.nickname-input--error {
  border-color: #EF4444;
  background: #FEF2F2;
}

.nickname-error-msg {
  font-size: 0.8rem;
  font-weight: 700;
  color: #DC2626;
}

.btn-confirm-hatch {
  width: 100%;
  padding: 12px 20px;
  border-radius: 18px;
  border: none;
  background: linear-gradient(180deg, #10B981 0%, #059669 100%);
  color: #FFFFFF;
  font-family: inherit;
  font-weight: 800;
  font-size: 1.05rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  transition: transform 0.15s ease, filter 0.15s ease;
  margin-top: 6px;
}

.btn-confirm-hatch:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.05);
}

.btn-confirm-hatch:disabled {
  background: #CBD5E1;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.7;
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

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@keyframes eggWobble {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(-8deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(8deg); }
  100% { transform: rotate(0deg); }
}

@keyframes eggCrackShake {
  0% { transform: translate(0, 0) rotate(0deg); }
  20% { transform: translate(-3px, 1px) rotate(-4deg); }
  40% { transform: translate(3px, -1px) rotate(4deg); }
  60% { transform: translate(-2px, -1px) rotate(-2deg); }
  80% { transform: translate(2px, 1px) rotate(2deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

@keyframes burstGlow {
  from { transform: scale(0.9); opacity: 0.7; }
  to { transform: scale(1.15); opacity: 1; }
}

@keyframes floatSparkle {
  0%, 100% { transform: translateY(0) scale(0.8); opacity: 0.5; }
  50% { transform: translateY(-8px) scale(1.2); opacity: 1; }
}

@keyframes pulse {
  from { opacity: 0.6; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1.05); }
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
