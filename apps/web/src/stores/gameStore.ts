import { defineStore } from 'pinia';
import {
  Currencies,
  GameSaveData,
  OwnedPenguin,
  IncubatorSlot,
} from '@penguin/types';
import { EGG_TYPES_MAP, SPECIES_MAP } from '@penguin/game-data';
import { gameStorage, createDefaultSaveData } from '../services/StorageService';
import { randomService } from '../services/RandomService';
import { validateNickname } from '../services/NicknameValidator';
import { useInventoryStore } from './inventoryStore';
import { useCollectionStore } from './collectionStore';

export const useGameStore = defineStore('game', {
  state: () => ({
    isLoaded: false,
    createdAt: Date.now(),
    player: {
      id: '',
      displayName: '',
      level: 1,
      experience: 0,
      avatarId: 'avatar_default',
    },
    currencies: {
      coins: 0,
      fish: 0,
      gems: 0,
    } as Currencies,
    ownedPenguins: [] as OwnedPenguin[],
    incubatorSlots: [] as IncubatorSlot[],
    islandState: {
      islandId: 'snow_island_01',
      theme: 'snow',
      decorationsPlaced: [] as {
        id: string;
        itemId: string;
        x: number;
        y: number;
      }[],
    },
    selectedPenguinId: null as string | null,
    audioMuted: false,
  }),
  getters: {
    selectedPenguin: (state): OwnedPenguin | null => {
      return state.ownedPenguins.find((p) => p.id === state.selectedPenguinId) ?? null;
    },
    getPenguinById: (state) => (id: string): OwnedPenguin | undefined => {
      return state.ownedPenguins.find((p) => p.id === id);
    },
    getSlotById: (state) => (slotId: number): IncubatorSlot | undefined => {
      return state.incubatorSlots.find((s) => s.slotId === slotId);
    },
  },
  actions: {
    async initGame(): Promise<void> {
      let data = await gameStorage.load();
      if (!data) {
        data = createDefaultSaveData();
        await gameStorage.save(data);
      }

      this.createdAt = data.createdAt;
      this.player = { ...data.player };
      this.currencies = { ...data.currencies };
      this.ownedPenguins = data.ownedPenguins.map((p) => ({ ...p }));
      this.incubatorSlots = data.incubatorSlots.map((s) => ({ ...s }));

      if (data.islandState) {
        this.islandState = {
          ...data.islandState,
          decorationsPlaced: data.islandState.decorationsPlaced.map((d) => ({ ...d })),
        };
      }

      const invStore = useInventoryStore();
      invStore.setItems(data.inventory);

      const colStore = useCollectionStore();
      colStore.setDiscovered(data.collectionBook);

      this.isLoaded = true;
    },

    async persistSave(): Promise<void> {
      if (!this.isLoaded) return;

      const invStore = useInventoryStore();
      const colStore = useCollectionStore();

      const saveData: GameSaveData = {
        schemaVersion: 1,
        createdAt: this.createdAt,
        updatedAt: Date.now(),
        player: { ...this.player },
        currencies: { ...this.currencies },
        inventory: [...invStore.items],
        ownedPenguins: [...this.ownedPenguins],
        collectionBook: [...colStore.discovered],
        incubatorSlots: [...this.incubatorSlots],
        islandState: {
          ...this.islandState,
          decorationsPlaced: [...this.islandState.decorationsPlaced],
        },
      };

      await gameStorage.save(saveData);
    },

    feedPenguin(penguinId: string): boolean {
      const invStore = useInventoryStore();
      if (invStore.getItemCount('sardine') < 1) {
        return false;
      }

      const penguin = this.ownedPenguins.find((p) => p.id === penguinId);
      if (!penguin) return false;

      invStore.consumeItem('sardine', 1);
      this.currencies.fish = invStore.getItemCount('sardine');

      penguin.happiness = Math.min(100, penguin.happiness + 15);
      penguin.hunger = Math.max(0, penguin.hunger - 25);
      penguin.mood = 'happy';

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return true;
    },

    petPenguin(penguinId: string): boolean {
      const penguin = this.ownedPenguins.find((p) => p.id === penguinId);
      if (!penguin) return false;

      penguin.happiness = Math.min(100, penguin.happiness + 5);
      penguin.mood = 'excited';

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return true;
    },

    placeEggInIncubator(slotId: number, eggTypeId: string): boolean {
      const slot = this.incubatorSlots.find((s) => s.slotId === slotId);
      if (!slot || slot.state !== 'EMPTY') return false;

      const invStore = useInventoryStore();
      if (!invStore.consumeItem(eggTypeId, 1)) {
        return false;
      }

      const eggDef = EGG_TYPES_MAP.get(eggTypeId);
      const durationSec = eggDef?.hatchDurationSec ?? 10;
      const now = Date.now();

      slot.state = 'INCUBATING';
      slot.eggTypeId = eggTypeId;
      slot.startTime = now;
      slot.durationSec = durationSec;
      slot.readyAt = now + durationSec * 1000;

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return true;
    },

    updateIncubatorTimers(): boolean {
      const now = Date.now();
      let changed = false;
      for (const slot of this.incubatorSlots) {
        if (slot.state === 'INCUBATING' && slot.readyAt && now >= slot.readyAt) {
          slot.state = 'READY_TO_HATCH';
          changed = true;
        }
      }
      if (changed) {
        this.persistSave().catch((err) => console.error('Save failed:', err));
      }
      return changed;
    },

    hatchEgg(slotId: number, customNickname?: string, preRolledSpeciesId?: string): OwnedPenguin | null {
      const slot = this.incubatorSlots.find((s) => s.slotId === slotId);
      if (!slot || slot.state !== 'READY_TO_HATCH' || !slot.eggTypeId) {
        return null;
      }

      const eggDef = EGG_TYPES_MAP.get(slot.eggTypeId);
      if (!eggDef) return null;

      const speciesId = preRolledSpeciesId ?? randomService.rollDrop(eggDef.dropPool);
      const speciesDef = SPECIES_MAP.get(speciesId);
      const defaultName = speciesDef?.name ?? 'Penguin';

      const validated = validateNickname(customNickname || defaultName, defaultName);
      const finalNickname = validated.valid ? validated.value : defaultName;

      const newPenguin: OwnedPenguin = {
        id: `penguin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        speciesId,
        nickname: finalNickname,
        level: 1,
        experience: 0,
        happiness: 85,
        energy: 100,
        hunger: 20,
        mood: 'excited',
        acquiredAt: Date.now(),
        generation: 1,
      };

      this.ownedPenguins.push(newPenguin);

      // Unlock in collection
      const colStore = useCollectionStore();
      colStore.discoverSpecies(speciesId);

      // Reset slot
      slot.state = 'EMPTY';
      slot.eggTypeId = undefined;
      slot.startTime = undefined;
      slot.readyAt = undefined;
      slot.durationSec = undefined;
      slot.hatchedPenguinId = undefined;

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return newPenguin;
    },

    selectPenguin(penguinId: string | null): void {
      this.selectedPenguinId = penguinId;
    },

    toggleAudio(): void {
      this.audioMuted = !this.audioMuted;
    },

    setAudioMuted(muted: boolean): void {
      this.audioMuted = muted;
    },

    addCoins(amount: number): void {
      this.currencies.coins += amount;
      this.persistSave().catch((err) => console.error('Save failed:', err));
    },

    addGems(amount: number): void {
      this.currencies.gems += amount;
      this.persistSave().catch((err) => console.error('Save failed:', err));
    },

    addFish(amount: number): void {
      const invStore = useInventoryStore();
      invStore.addItem({
        itemId: 'sardine',
        category: 'food',
        name: 'Small Sardine',
        description: 'A fresh little fish!',
        quantity: amount,
        stackable: true,
      });
      this.currencies.fish = invStore.getItemCount('sardine');
      this.persistSave().catch((err) => console.error('Save failed:', err));
    },

    async resetSave(): Promise<void> {
      await gameStorage.clear();
      await this.initGame();
    },
  },
});
