<template>
  <div class="game-app">
    <!-- Phaser Island Game Canvas (Background Layer) -->
    <IslandCanvas />

    <!-- UI Overlay Layer (Interactive HUD elements over canvas) -->
    <div class="ui-overlay">
      <!-- Top Resource Bar -->
      <TopBar @open-settings="openModal('settings')" />

      <!-- Bottom Dock: Wooden Shelf Rack -->
      <footer class="bottom-dock" role="region" aria-label="Bảng điều khiển dưới">
        <ShelfRack
          @open-inventory="openModal('inventory')"
          @open-collection="openModal('collection')"
          @open-hatchery="openModal('hatchery')"
          @open-shop="openModal('shop')"
          @open-quests="openModal('quest')"
          @open-settings="openModal('settings')"
        />
      </footer>
    </div>

    <!-- Modals Layer -->
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
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useGameStore } from './stores/gameStore';
import { gameBridge } from './game/bridge/GameBridge';
import { soundService } from './services/SoundService';
import IslandCanvas from './components/canvas/IslandCanvas.vue';
import TopBar from './components/hud/TopBar.vue';
import ShelfRack from './components/dock/ShelfRack.vue';
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

const gameStore = useGameStore();
const activeModal = ref<string | null>(null);
const activeHatchSlotId = ref<number>(1);
const inspectedPenguinId = ref<string | null>(null);
const activePlotId = ref<number>(1);
const levelUpNewLevel = ref<number>(2);
const canvasReady = ref(false);

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
    if (slot?.state === 'READY_TO_HATCH') {
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 16px 14px;
  padding-bottom: max(14px, env(safe-area-inset-bottom, 14px));
  z-index: 10;
}

/* Bottom Dock Area */
.bottom-dock {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  max-width: 900px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}

.bottom-dock > * {
  pointer-events: auto;
}

@media (max-width: 640px) {
  .ui-overlay {
    padding: 8px 10px 10px;
  }

  .bottom-dock {
    gap: 6px;
  }
}
</style>
