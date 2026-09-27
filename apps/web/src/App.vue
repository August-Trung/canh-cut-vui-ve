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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useGameStore } from './stores/gameStore';
import IslandCanvas from './components/canvas/IslandCanvas.vue';
import TopBar from './components/hud/TopBar.vue';
import ShelfRack from './components/dock/ShelfRack.vue';
import NeighborStrip from './components/dock/NeighborStrip.vue';

const gameStore = useGameStore();
const activeModal = ref<string | null>(null);

function openModal(modalName: string) {
  activeModal.value = modalName;
}

function closeModal() {
  activeModal.value = null;
}

onMounted(async () => {
  if (!gameStore.isLoaded) {
    await gameStore.initGame();
  }
});

defineExpose({
  activeModal,
  openModal,
  closeModal,
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
