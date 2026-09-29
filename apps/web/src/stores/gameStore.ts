import { defineStore } from 'pinia';
import type {
  Currencies,
  GameSaveDataV2,
  GameSaveDataV3,
  OwnedPenguin,
  IncubatorSlot,
  PlayerProfile,
  IslandState,
  DailyLoginState,
  QuestState,
  PlacedDecoration,
  BreedingSlot,
  MiniGameState,
} from '@penguin/types';
import { EGG_TYPES_MAP, SPECIES_MAP } from '@penguin/game-data';
import { gameStorage, createDefaultSaveDataV2, migrateSaveData } from '../services/StorageService';
import { validateNickname } from '../services/NicknameValidator';
import {
  getPlayerLevelFromExp,
  getMaxFlockCapacity,
  calculateLevelUpRewards,
  LevelReward,
  getPenguinLevelFromExp,
} from '../services/ProgressionService';
import {
  simulatePenguinNeeds,
  derivePenguinMood,
  calculateCareRewards,
} from '../services/NeedsService';
import { calculateCozyRating, getCoinDropMultiplier } from '../services/DecorationService';
import { hatchService } from '../services/HatchService';
import { gameBridge } from '../game/bridge/GameBridge';
import { useInventoryStore } from './inventoryStore';
import { useCollectionStore } from './collectionStore';

export const useGameStore = defineStore('game', {
  state: () => ({
    isLoaded: false,
    createdAt: Date.now(),
    player: {
      id: 'player_local_01',
      displayName: 'Chủ Đảo Tập Sự',
      name: 'Chủ Đảo Tập Sự',
      level: 1,
      exp: 0,
      experience: 0,
      avatar: 'avatar_default',
      avatarId: 'avatar_default',
    },
    currencies: {
      coins: 0,
      fish: 0,
      gems: 0,
    } as Currencies,
    ownedPenguins: [] as OwnedPenguin[],
    incubatorSlots: [] as IncubatorSlot[],
    island: {
      decorations: [] as PlacedDecoration[],
      unlockedPlacementExpIds: [] as string[],
    } as IslandState,
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
    dailyLogin: {
      lastClaimDate: null as string | null,
      currentStreak: 1,
    } as DailyLoginState,
    questState: {
      assignedDate: '',
      quests: [],
    } as QuestState,
    breedingSlot: {
      slotId: 1,
      state: 'EMPTY',
    } as BreedingSlot,
    miniGameState: {
      lastPlayedDate: '',
      dailyPlaysCount: {},
    } as MiniGameState,
    timestamps: {
      createdAt: 0,
      lastSavedAt: 0,
      lastLoginAt: 0,
    },
    selectedPenguinId: null as string | null,
    audioMuted: false,
    needsSimulationIntervalId: null as any,
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
      let raw = await gameStorage.load();
      if (!raw) {
        raw = createDefaultSaveDataV2();
        await gameStorage.save(raw);
      }

      // Pure migration: deterministic, no Date.now(), no quest generation
      const dataV3 = migrateSaveData(raw as unknown as Record<string, unknown>);

      // Safe boot-time needs simulation:
      const bootTime = Date.now();
      for (const penguin of dataV3.ownedPenguins) {
        if (!penguin.lastNeedsUpdateAt || penguin.lastNeedsUpdateAt <= 0) {
          // Missing historical timestamp: do not simulate decades of starvation!
          penguin.lastNeedsUpdateAt = bootTime;
        } else {
          simulatePenguinNeeds(penguin, bootTime);
        }
      }

      // Assign state directly WITHOUT addPlayerExp to avoid duplicate level-up rewards
      this.createdAt = dataV3.timestamps.createdAt || bootTime;
      this.player = {
        id: 'player_local_01',
        displayName: dataV3.player.name,
        name: dataV3.player.name,
        level: dataV3.player.level,
        exp: dataV3.player.exp,
        experience: dataV3.player.exp,
        avatar: dataV3.player.avatar,
        avatarId: dataV3.player.avatar,
      };
      this.currencies = { ...dataV3.currencies };
      this.ownedPenguins = dataV3.ownedPenguins.map((p) => ({ ...p }));
      this.incubatorSlots = dataV3.incubatorSlots.map((s) => ({ ...s }));
      this.island = { ...dataV3.island };
      this.islandState = {
        islandId: 'snow_island_01',
        theme: 'snow',
        decorationsPlaced: dataV3.island.decorations.map((d) => ({
          id: d.instanceId,
          itemId: d.decorationId,
          x: 0,
          y: 0,
        })),
      };
      this.dailyLogin = { ...dataV3.dailyLogin };
      this.questState = { ...dataV3.questState };
      this.breedingSlot = dataV3.breedingSlot ? { ...dataV3.breedingSlot } : { slotId: 1, state: 'EMPTY' };
      this.miniGameState = dataV3.miniGameState ? { ...dataV3.miniGameState } : { lastPlayedDate: '', dailyPlaysCount: {} };
      this.timestamps = {
        ...dataV3.timestamps,
        lastLoginAt: bootTime,
        lastSavedAt: bootTime,
      };

      const invStore = useInventoryStore();
      invStore.setItems(dataV3.inventory);

      const colStore = useCollectionStore();
      if (Array.isArray((raw as any).collectionBook)) {
        colStore.setDiscovered((raw as any).collectionBook);
      } else {
        for (const p of this.ownedPenguins) {
          colStore.discoverSpecies(p.speciesId);
        }
      }

      this.updateIncubatorTimers();
      this.startNeedsSimulation();
      this.isLoaded = true;
      await this.persistSave();
    },

    async persistSave(): Promise<void> {
      if (!this.isLoaded) return;

      const invStore = useInventoryStore();
      const now = Date.now();

      const saveData: GameSaveDataV3 = {
        schemaVersion: 3,
        player: {
          level: this.player.level,
          exp: this.player.exp,
          name: this.player.name || this.player.displayName,
          avatar: this.player.avatar || this.player.avatarId,
        },
        currencies: { ...this.currencies },
        inventory: [...invStore.items],
        ownedPenguins: [...this.ownedPenguins],
        incubatorSlots: [...this.incubatorSlots],
        island: { ...this.island },
        dailyLogin: { ...this.dailyLogin },
        questState: { ...this.questState },
        breedingSlot: { ...this.breedingSlot },
        miniGameState: { ...this.miniGameState },
        timestamps: {
          createdAt: this.createdAt,
          lastSavedAt: now,
          lastLoginAt: this.timestamps.lastLoginAt || now,
        },
      };

      await gameStorage.save(saveData);
    },

    addPlayerExp(amount: number): LevelReward[] {
      const oldLevel = this.player.level;
      this.player.exp += amount;
      this.player.experience = this.player.exp;

      const levelInfo = getPlayerLevelFromExp(this.player.exp);
      this.player.level = levelInfo.level;

      const rewards = calculateLevelUpRewards(oldLevel, levelInfo.level);
      if (rewards.length > 0) {
        for (const r of rewards) {
          this.currencies.coins += r.coins;
          this.currencies.gems += r.gems;
        }
        gameBridge.emit('effect:level_up', { newLevel: levelInfo.level });
      }

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return rewards;
    },

    addPenguinExp(
      penguinId: string,
      amount: number
    ): { levelUp: boolean; oldLevel: number; newLevel: number } {
      const penguin = this.ownedPenguins.find((p) => p.id === penguinId);
      if (!penguin) {
        return { levelUp: false, oldLevel: 0, newLevel: 0 };
      }

      const oldLevel = penguin.level || 1;
      const currentExp = penguin.exp ?? 0;
      const newExp = Math.min(2700, Math.max(0, currentExp + amount));
      penguin.exp = newExp;
      penguin.experience = newExp;

      const levelInfo = getPenguinLevelFromExp(newExp);
      penguin.level = levelInfo.level;
      const levelUp = levelInfo.level > oldLevel;

      if (levelUp) {
        gameBridge.emit('effect:penguin_level_up', { penguinId: penguin.id, newLevel: levelInfo.level });
      }

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return { levelUp, oldLevel, newLevel: levelInfo.level };
    },

    petPenguin(penguinId: string): boolean {
      const penguin = this.ownedPenguins.find((p) => p.id === penguinId);
      if (!penguin) return false;

      const now = Date.now();
      if (now - (penguin.lastPetAt ?? 0) < 15000) {
        return false;
      }

      penguin.lastPetAt = now;
      const care = calculateCareRewards(penguin.speciesId, undefined);

      penguin.happiness = Math.min(100, penguin.happiness + care.happinessBonus);
      this.addPenguinExp(penguin.id, care.penguinExp);
      if (penguin.stats) {
        penguin.stats.totalPets = (penguin.stats.totalPets ?? 0) + 1;
      }
      penguin.mood = derivePenguinMood(penguin.hunger, penguin.happiness);

      this.addPlayerExp(care.playerExp);

      gameBridge.emit('action:pet', { ownedId: penguin.id, penguin: { ...penguin } });
      gameBridge.emit('penguin:action', { ownedId: penguin.id, action: 'pet' });

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return true;
    },

    feedPenguin(penguinId: string, foodId: string = 'sardine'): boolean {
      const penguin = this.ownedPenguins.find((p) => p.id === penguinId);
      if (!penguin) return false;

      const invStore = useInventoryStore();
      if (invStore.getItemCount(foodId) < 1) {
        return false;
      }

      invStore.consumeItem(foodId, 1);

      const cozyRating = calculateCozyRating(this.island.decorations);
      const cozyMultiplier = getCoinDropMultiplier(cozyRating);
      const care = calculateCareRewards(penguin.speciesId, foodId, cozyMultiplier, penguin.level);

      if (penguin.traits?.includes('glutton')) {
        care.penguinExp = Math.round(care.penguinExp * 1.25);
      }

      if (penguin.traits?.includes('lucky') && Math.random() < 0.15) {
        care.coins *= 2;
      }

      penguin.hunger = Math.max(0, penguin.hunger - care.hungerReduction);
      penguin.happiness = Math.min(100, penguin.happiness + care.happinessBonus);
      penguin.lastFedAt = Date.now();
      this.addPenguinExp(penguin.id, care.penguinExp);
      if (penguin.stats) {
        penguin.stats.totalFeedings = (penguin.stats.totalFeedings ?? 0) + 1;
      }
      penguin.mood = derivePenguinMood(penguin.hunger, penguin.happiness);

      if (care.coins > 0) {
        this.currencies.coins += care.coins;
        gameBridge.emit('effect:coin_drop', { x: 0, y: 0, amount: care.coins });
      }

      this.addPlayerExp(care.playerExp);

      gameBridge.emit('action:feed', { ownedId: penguin.id, foodId, penguin: { ...penguin } });
      gameBridge.emit('penguin:action', { ownedId: penguin.id, action: 'feed' });

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return true;
    },

    prepareHatch(slotId: number): { success: boolean; pendingSpeciesId?: string; reason?: string } {
      const maxCapacity = getMaxFlockCapacity(this.player.level);
      if (this.ownedPenguins.length >= maxCapacity) {
        return { success: false, reason: 'FLOCK_FULL' };
      }

      const slot = this.incubatorSlots.find((s) => s.slotId === slotId);
      if (!slot || slot.state !== 'READY_TO_HATCH' || !slot.eggTypeId) {
        return { success: false, reason: 'INVALID_SLOT' };
      }

      let rolledSpeciesId: string;
      if (slot.eggTypeId === 'egg_breeding' && slot.geneticsResult) {
        rolledSpeciesId = slot.geneticsResult.speciesId;
      } else {
        rolledSpeciesId = hatchService.rollSpeciesForEgg(slot.eggTypeId);
      }
      slot.pendingSpeciesId = rolledSpeciesId;
      this.persistSave().catch((err) => console.error('Save failed:', err));
      return { success: true, pendingSpeciesId: rolledSpeciesId };
    },

    cancelHatch(slotId: number): void {
      const slot = this.incubatorSlots.find((s) => s.slotId === slotId);
      if (slot) {
        if (slot.eggTypeId !== 'egg_breeding') {
          slot.pendingSpeciesId = undefined;
        }
        this.persistSave().catch((err) => console.error('Save failed:', err));
      }
    },

    hatchEgg(slotId: number, customNickname?: string): OwnedPenguin | null {
      const maxCapacity = getMaxFlockCapacity(this.player.level);
      if (this.ownedPenguins.length >= maxCapacity) {
        const slot = this.incubatorSlots.find((s) => s.slotId === slotId);
        if (slot && slot.eggTypeId !== 'egg_breeding') {
          slot.pendingSpeciesId = undefined;
          this.persistSave().catch((err) => console.error('Save failed:', err));
        }
        return null;
      }

      const slot = this.incubatorSlots.find((s) => s.slotId === slotId);
      if (!slot || slot.state !== 'READY_TO_HATCH' || !slot.eggTypeId) {
        return null;
      }

      const eggTypeId = slot.eggTypeId;
      const eggDef = EGG_TYPES_MAP.get(eggTypeId);
      if (!eggDef) return null;

      let speciesId: string;
      let traits: string[] = [];
      let generation = 1;
      let parentAId: string | undefined;
      let parentBId: string | undefined;

      if (eggTypeId === 'egg_breeding' && slot.geneticsResult) {
        speciesId = slot.geneticsResult.speciesId;
        traits = [...slot.geneticsResult.traits];
        generation = slot.geneticsResult.generation;
        parentAId = slot.geneticsResult.parentAId;
        parentBId = slot.geneticsResult.parentBId;
      } else {
        speciesId = slot.pendingSpeciesId ?? hatchService.rollSpeciesForEgg(eggTypeId);
      }

      const speciesDef = SPECIES_MAP.get(speciesId);
      const defaultName = speciesDef?.name ?? 'Penguin';

      const validated = validateNickname(customNickname || defaultName, defaultName);
      const finalNickname = validated.valid ? validated.value : defaultName;

      const now = Date.now();
      const newPenguin: OwnedPenguin = {
        id: `penguin_${now}_${Math.random().toString(36).substring(2, 7)}`,
        speciesId,
        nickname: finalNickname,
        level: 1,
        exp: 0,
        experience: 0,
        happiness: 85,
        energy: 100,
        hunger: 20,
        mood: 'happy',
        lastPetAt: 0,
        lastFedAt: 0,
        lastNeedsUpdateAt: now,
        acquiredAt: now,
        generation,
        createdAt: now,
        traits,
        parentAId,
        parentBId,
        breedingCount: 0,
        lastBredAt: 0,
        stats: {
          fishCaught: 0,
          totalPets: 0,
          totalFeedings: 0,
          gamesPlayed: 0,
        },
      };

      this.ownedPenguins.push(newPenguin);

      // Unlock in collection
      const colStore = useCollectionStore();
      colStore.discoverSpecies(speciesId);

      // Reset slot and clear pendingSpeciesId and geneticsResult
      slot.state = 'EMPTY';
      slot.eggTypeId = undefined;
      slot.startTime = undefined;
      slot.readyAt = undefined;
      slot.targetHatchTime = undefined;
      slot.durationSec = undefined;
      slot.hatchedPenguinId = undefined;
      slot.pendingSpeciesId = undefined;
      slot.geneticsResult = undefined;
      slot.nurtureCount = 0;
      slot.lastNurtureAt = 0;

      // Player EXP from hatch
      const hatchExpMap: Record<string, number> = {
        basic_egg: 25,
        frozen_egg: 50,
        golden_egg: 120,
        egg_breeding: 75,
      };
      this.addPlayerExp(hatchExpMap[eggTypeId] ?? 25);

      // Decoupled action event & entities spawn
      gameBridge.emit('action:hatch', { ownedId: newPenguin.id, penguin: { ...newPenguin } });
      gameBridge.emit('penguin:spawn', { penguin: { ...newPenguin } });

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return newPenguin;
    },

    nurtureEgg(slotId: number): boolean {
      const slot = this.incubatorSlots.find((s) => s.slotId === slotId);
      if (!slot || slot.state !== 'INCUBATING') return false;

      const targetTime = slot.targetHatchTime ?? slot.readyAt;
      if (!targetTime) return false;

      if ((slot.nurtureCount ?? 0) >= 10) return false;

      const now = Date.now();
      if (now - (slot.lastNurtureAt ?? 0) < 30000) return false;

      slot.targetHatchTime = Math.max(now + 1000, targetTime - 30000);
      slot.readyAt = slot.targetHatchTime;
      slot.nurtureCount = (slot.nurtureCount ?? 0) + 1;
      slot.lastNurtureAt = now;

      if (now >= slot.targetHatchTime) {
        slot.state = 'READY_TO_HATCH';
      }

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return true;
    },

    unlockIncubatorSlot(slotId: number): boolean {
      const slot = this.incubatorSlots.find((s) => s.slotId === slotId);
      if (!slot || slot.unlocked) return false;

      const cost = slot.unlockCost ?? 500;
      if (this.currencies.coins < cost) return false;

      this.currencies.coins -= cost;
      slot.unlocked = true;
      this.persistSave().catch((err) => console.error('Save failed:', err));
      return true;
    },

    placeEggInIncubator(slotId: number, eggTypeId: string): boolean {
      const slot = this.incubatorSlots.find((s) => s.slotId === slotId);
      if (!slot || slot.state !== 'EMPTY') return false;
      if (slot.unlocked === false) return false;

      const invStore = useInventoryStore();
      const consumed = invStore.consumeItemWithMetadata(eggTypeId);
      if (!consumed) {
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
      slot.targetHatchTime = slot.readyAt;
      slot.nurtureCount = 0;
      slot.lastNurtureAt = 0;
      slot.geneticsResult = consumed.metadata?.geneticsResult as any;
      if (slot.geneticsResult) {
        slot.pendingSpeciesId = slot.geneticsResult.speciesId;
      } else {
        slot.pendingSpeciesId = undefined;
      }

      this.persistSave().catch((err) => console.error('Save failed:', err));
      return true;
    },

    updateIncubatorTimers(): boolean {
      const now = Date.now();
      let changed = false;
      for (const slot of this.incubatorSlots) {
        let target = slot.targetHatchTime;
        if (target === undefined || (slot.readyAt !== undefined && slot.readyAt < target)) {
          target = slot.readyAt;
        }
        if (slot.state === 'INCUBATING' && target && now >= target) {
          slot.state = 'READY_TO_HATCH';
          changed = true;
        }
      }
      if (changed) {
        this.persistSave().catch((err) => console.error('Save failed:', err));
      }
      return changed;
    },

    startNeedsSimulation(): void {
      this.stopNeedsSimulation();
      this.needsSimulationIntervalId = setInterval(() => {
        this.tickNeedsSimulation();
      }, 10000);
    },

    stopNeedsSimulation(): void {
      if (this.needsSimulationIntervalId) {
        clearInterval(this.needsSimulationIntervalId);
        this.needsSimulationIntervalId = null;
      }
    },

    tickNeedsSimulation(): void {
      const now = Date.now();
      for (const p of this.ownedPenguins) {
        simulatePenguinNeeds(p, now);
      }
      this.updateIncubatorTimers();
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
