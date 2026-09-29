<template>
  <div class="game-app">
    <!-- Phaser Island Game Canvas (Background Layer) -->
    <IslandCanvas />

    <!-- UI Overlay Layer (Interactive HUD elements over canvas) -->
    <div class="ui-overlay">
      <!-- Top Resource Bar -->
      <TopBar @open-settings="openModal('settings')" />

      <!-- Left Column: Flock Capacity Signpost & Quick shortcuts -->
      <aside class="left-sidebar" aria-label="Thông tin đàn và lối tắt">
        <!-- Flock Capacity Signpost / Shield -->
        <button
          type="button"
          class="flock-signpost"
          title="Sức chứa đàn chim"
          @click="openModal('collection')"
        >
          <div class="flock-signpost__icon-box">
            <span class="flock-signpost__emoji">🐧</span>
          </div>
          <div class="flock-signpost__info">
            <span class="flock-signpost__title">ĐÀN</span>
            <span class="flock-signpost__val">
              {{ gameStore.ownedPenguins.length }}/{{ maxFlockCap }}
            </span>
          </div>
        </button>

        <!-- Shortcut: Xe Hàng (Quests / Delivery Truck) -->
        <button
          type="button"
          class="side-shortcut"
          title="Nhiệm Vụ Xe Hàng"
          @click="openModal('quest')"
        >
          <span class="side-shortcut__icon">🚚</span>
          <span class="side-shortcut__label">Xe Hàng</span>
        </button>

        <!-- Shortcut: Trang Trí Đảo -->
        <button
          type="button"
          class="side-shortcut"
          title="Trang Trí Đảo Băng"
          @click="openModal('decoration')"
        >
          <span class="side-shortcut__icon">❄️</span>
          <span class="side-shortcut__label">Trang Trí</span>
        </button>
      </aside>

      <!-- Bottom Dock: Friend Tray (Left/Center) + Wooden Shelf Rack (Right) -->
      <footer class="bottom-dock" role="region" aria-label="Bảng điều khiển dưới">
        <div class="bottom-dock__content">
          <!-- Friend / Neighbor Icy Strip -->
          <NeighborStrip class="bottom-dock__neighbors" />

          <!-- Wooden Shelf Rack in bottom-right corner -->
          <ShelfRack
            class="bottom-dock__shelf"
            @open-inventory="openModal('inventory')"
            @open-collection="openModal('collection')"
            @open-hatchery="openModal('hatchery')"
            @open-breeding="openModal('breeding')"
            @open-shop="openModal('shop')"
            @open-quests="openModal('quest')"
            @open-settings="openModal('settings')"
          />
        </div>
      </footer>
    </div>

    <!-- Modals Layer -->
    <BreedingModal
      v-if="activeModal === 'breeding'"
      @close="closeModal"
      @open-hatchery="openModal('hatchery')"
    />

    <InventoryModal
      v-if="activeModal === 'inventory'"
      @close="closeModal"
    />

    <CollectionModal
      v-if="activeModal === 'collection'"
      @close="closeModal"
    />

    <HatcheryModal
      v-if="activeModal === 'hatchery'"
      @close="closeModal"
      @hatch="openHatchModal"
      @open-inventory="openModal('inventory')"
    />

    <HatchModal
      v-if="activeModal === 'hatch'"
      :slot-id="activeHatchSlotId"
      @close="closeModal"
    />

    <PenguinInspectModal
      v-if="activeModal === 'inspect' && inspectedPenguinId"
      :penguin-id="inspectedPenguinId"
      @close="closeModal"
    />

    <ShopModal
      v-if="activeModal === 'shop'"
      @close="closeModal"
    />

    <QuestModal
      v-if="activeModal === 'quest'"
      @close="closeModal"
    />

    <DecorationModal
      v-if="activeModal === 'decoration'"
      :initial-plot-id="activePlotId"
      @close="closeModal"
      @open-shop="openModal('shop')"
    />

    <LevelUpModal
      v-if="activeModal === 'levelup'"
      :new-level="levelUpNewLevel"
      @close="closeModal"
    />

    <SettingsModal
      v-if="activeModal === 'settings'"
      @close="closeModal"
      @sync="syncWorld"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useGameStore } from './stores/gameStore';
import { gameBridge } from './game/bridge/GameBridge';
import { soundService } from './services/SoundService';
import { getMaxFlockCapacity } from './services/ProgressionService';
import IslandCanvas from './components/canvas/IslandCanvas.vue';
import TopBar from './components/hud/TopBar.vue';
import ShelfRack from './components/dock/ShelfRack.vue';
import NeighborStrip from './components/dock/NeighborStrip.vue';
import InventoryModal from './components/modals/InventoryModal.vue';
import CollectionModal from './components/modals/CollectionModal.vue';
import HatcheryModal from './components/modals/HatcheryModal.vue';
import HatchModal from './components/modals/HatchModal.vue';
import PenguinInspectModal from './components/modals/PenguinInspectModal.vue';
import ShopModal from './components/modals/ShopModal.vue';
import QuestModal from './components/modals/QuestModal.vue';
import DecorationModal from './components/modals/DecorationModal.vue';
import LevelUpModal from './components/modals/LevelUpModal.vue';
import SettingsModal from './components/modals/SettingsModal.vue';
import BreedingModal from './components/modals/BreedingModal.vue';

const gameStore = useGameStore();
const activeModal = ref<string | null>(null);
const activeHatchSlotId = ref<number>(1);
const inspectedPenguinId = ref<string | null>(null);
const activePlotId = ref<number>(1);
const levelUpNewLevel = ref<number>(2);
const canvasReady = ref(false);

const maxFlockCap = computed(() => getMaxFlockCapacity(gameStore.player.level));

function openModal(modalName: string) {
  soundService.playPop();
  activeModal.value = modalName;
}

function closeModal() {
  soundService.playPop();
  activeModal.value = null;
}

function openHatchModal(slotId: number) {
  soundService.playPop();
  activeHatchSlotId.value = slotId;
  activeModal.value = 'hatch';
}

function syncPenguins() {
  if (!canvasReady.value || !gameStore.isLoaded) return;
  gameBridge.emit('world:sync', { penguins: gameStore.ownedPenguins });
}

function syncNest() {
  if (!canvasReady.value || !gameStore.isLoaded) return;
  const slot = gameStore.getSlotById(1) ?? gameStore.incubatorSlots[0] ?? null;
  gameBridge.emit('nest:sync', {
    slot: slot ? { ...slot } : null,
  });
}

function syncDecorations() {
  if (!canvasReady.value || !gameStore.isLoaded) return;
  gameBridge.emit('decorations:sync', {
    decorations: gameStore.island.decorations ?? [],
  });
}

function syncWorld() {
  syncPenguins();
  syncNest();
  syncDecorations();
}

watch(
  () => [gameStore.incubatorSlots[0]?.state, gameStore.incubatorSlots[0]?.eggTypeId],
  () => {
    syncNest();
  },
  { deep: true }
);

watch(
  () => gameStore.island.decorations,
  () => {
    syncDecorations();
  },
  { deep: true }
);

// Synchronize modal state with Phaser input layer:
// Disables world interaction while modal is open, and safely re-enables on nextTick
// to prevent modal close click/pointerup events from leaking into underlying scene entities.
watch(
  () => activeModal.value !== null,
  (isOpen) => {
    if (isOpen) {
      gameBridge.emit('ui:modal', { open: true });
    } else {
      nextTick(() => {
        gameBridge.emit('ui:modal', { open: false });
      });
    }
  },
  { immediate: true }
);

let unsubs: (() => void)[] = [];

onMounted(async () => {
  // Subscribe to canvas:ready to synchronize penguins, nest, and decorations once the island scene is ready
  const unsubCanvasReady = gameBridge.on('canvas:ready', () => {
    canvasReady.value = true;
    syncWorld();
  });

  // Subscribe to GameBridge events
  const unsubPenguinClick = gameBridge.on('penguin:clicked', ({ ownedId }) => {
    soundService.playPop();
    gameStore.selectPenguin(ownedId);
    inspectedPenguinId.value = ownedId;
    activeModal.value = 'inspect';
  });

  const unsubEggClick = gameBridge.on('egg:clicked', ({ slotId }) => {
    soundService.playPop();
    const slot = gameStore.getSlotById(slotId);
    const maxCapacity = getMaxFlockCapacity(gameStore.player.level);
    const isFlockFull = gameStore.ownedPenguins.length >= maxCapacity;

    if (slot?.state === 'READY_TO_HATCH' && !isFlockFull) {
      openHatchModal(slotId);
    } else {
      activeModal.value = 'hatchery';
    }
  });

  const unsubPlotClick = gameBridge.on('plot:clicked', ({ plotId }) => {
    soundService.playPop();
    activePlotId.value = plotId;
    activeModal.value = 'decoration';
  });

  const unsubLevelUp = gameBridge.on('effect:level_up', ({ newLevel }) => {
    levelUpNewLevel.value = newLevel;
    activeModal.value = 'levelup';
  });

  const unsubPenguinAction = gameBridge.on('penguin:action', ({ action }) => {
    if (action === 'pet') {
      soundService.playChirp();
    } else if (action === 'feed') {
      soundService.playEat();
    }
  });

  unsubs.push(
    unsubCanvasReady,
    unsubPenguinClick,
    unsubEggClick,
    unsubPlotClick,
    unsubLevelUp,
    unsubPenguinAction
  );

  gameStore.startNeedsSimulation();

  if (!gameStore.isLoaded) {
    await gameStore.initGame();
  }
  syncWorld();
});

onUnmounted(() => {
  gameStore.stopNeedsSimulation();
  for (const unsub of unsubs) {
    unsub();
  }
  unsubs = [];
});

defineExpose({
  activeModal,
  activeHatchSlotId,
  inspectedPenguinId,
  activePlotId,
  levelUpNewLevel,
  canvasReady,
  syncPenguins,
  syncNest,
  syncDecorations,
  syncWorld,
  openModal,
  closeModal,
  openHatchModal,
});
</script>

<style>
/* Global resets & typography */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  font-family: 'Quicksand', 'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #bfe3f7;
  user-select: none;
  -webkit-user-select: none;
}
</style>

<style scoped>
.game-app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at 50% 30%, #e0f2fe 0%, #bae6fd 60%, #7dd3fc 100%);
}

/* UI Overlay: pointer-events none allows Phaser canvas clicks */
.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
}

/* Left Sidebar (Flock counter + shortcuts) */
.left-sidebar {
  position: absolute;
  top: 50px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
  z-index: 12;
}

.flock-signpost {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);
  border: 2.5px solid #B45309;
  border-radius: 12px;
  padding: 3px 8px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.flock-signpost:hover {
  transform: scale(1.05);
  filter: brightness(1.05);
}

.flock-signpost__icon-box {
  font-size: 1.1rem;
  line-height: 1;
}

.flock-signpost__info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.flock-signpost__title {
  font-size: 0.58rem;
  font-weight: 900;
  color: #92400E;
  letter-spacing: 0.05em;
}

.flock-signpost__val {
  font-size: 0.76rem;
  font-weight: 800;
  color: #451A03;
  line-height: 1;
}

.side-shortcut {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
  border: 2px solid #64748B;
  border-radius: 10px;
  padding: 4px 7px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease;
}

.side-shortcut:hover {
  transform: scale(1.06);
  border-color: #0284C7;
}

.side-shortcut__icon {
  font-size: 0.95rem;
  line-height: 1;
}

.side-shortcut__label {
  font-size: 0.68rem;
  font-weight: 800;
  color: #1E293B;
}

/* Bottom Dock Area */
.bottom-dock {
  position: absolute;
  bottom: 6px;
  left: 8px;
  right: 8px;
  display: flex;
  pointer-events: none;
  z-index: 12;
}

.bottom-dock__content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  pointer-events: none;
}

.bottom-dock__neighbors {
  flex: 1;
  max-width: calc(100% - 290px);
  pointer-events: auto;
}

.bottom-dock__shelf {
  flex-shrink: 0;
  margin-left: auto;
  pointer-events: auto;
}

@media (max-width: 640px) {
  .left-sidebar {
    top: 48px;
    left: 6px;
    gap: 6px;
  }

  .side-shortcut__label {
    display: none;
  }

  .bottom-dock {
    bottom: 4px;
    left: 4px;
    right: 4px;
  }

  .bottom-dock__neighbors {
    display: none;
  }

  .bottom-dock__shelf {
    margin: 0 auto;
  }
}
</style>
