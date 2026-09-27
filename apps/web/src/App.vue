<template>
  <div class="game-app">
    <!-- Phaser Island Game Canvas (Background Layer) -->
    <IslandCanvas />

    <!-- UI Overlay Layer (Interactive HUD elements over canvas) -->
    <div class="ui-overlay">
      <!-- Top Resource Bar -->
      <TopBar @open-settings="openModal('settings')" />

      <!-- Bottom Dock: Neighbor Strip & Wooden Shelf Rack -->
      <footer class="bottom-dock" role="region" aria-label="Bảng điều khiển dưới">
        <NeighborStrip />
        <ShelfRack
          @open-inventory="openModal('inventory')"
          @open-collection="openModal('collection')"
          @open-hatchery="openModal('hatchery')"
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

    <SettingsModal
      v-if="activeModal === 'settings'"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useGameStore } from './stores/gameStore';
import { gameBridge } from './game/bridge/GameBridge';
import { soundService } from './services/SoundService';
import IslandCanvas from './components/canvas/IslandCanvas.vue';
import TopBar from './components/hud/TopBar.vue';
import ShelfRack from './components/dock/ShelfRack.vue';
import NeighborStrip from './components/dock/NeighborStrip.vue';
import InventoryModal from './components/modals/InventoryModal.vue';
import CollectionModal from './components/modals/CollectionModal.vue';
import HatcheryModal from './components/modals/HatcheryModal.vue';
import HatchModal from './components/modals/HatchModal.vue';
import PenguinInspectModal from './components/modals/PenguinInspectModal.vue';
import SettingsModal from './components/modals/SettingsModal.vue';

const gameStore = useGameStore();
const activeModal = ref<string | null>(null);
const activeHatchSlotId = ref<number>(1);
const inspectedPenguinId = ref<string | null>(null);

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

let unsubs: (() => void)[] = [];

onMounted(async () => {
  if (!gameStore.isLoaded) {
    await gameStore.initGame();
  }

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

  const unsubPenguinAction = gameBridge.on('penguin:action', ({ action }) => {
    if (action === 'pet') {
      soundService.playChirp();
    } else if (action === 'feed') {
      soundService.playEat();
    }
  });

  const unsubPenguinSpawn = gameBridge.on('penguin:spawn', () => {
    soundService.playHatchFanfare();
  });

  unsubs.push(unsubPenguinClick, unsubEggClick, unsubPenguinAction, unsubPenguinSpawn);
});

onUnmounted(() => {
  for (const unsub of unsubs) {
    unsub();
  }
  unsubs = [];
});

defineExpose({
  activeModal,
  activeHatchSlotId,
  inspectedPenguinId,
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
  padding-bottom: env(safe-area-inset-bottom, 12px);
  z-index: 10;
}

/* Bottom Dock Area */
.bottom-dock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 0 12px 14px;
  pointer-events: none;
}

.bottom-dock > * {
  pointer-events: auto;
}

@media (max-width: 640px) {
  .bottom-dock {
    gap: 6px;
    padding: 0 8px 8px;
  }
}
</style>
