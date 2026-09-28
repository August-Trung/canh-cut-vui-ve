import { defineStore } from 'pinia';
import { InventoryItem } from '@penguin/types';
import { INITIAL_ITEMS } from '@penguin/game-data';

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    items: [] as InventoryItem[],
  }),
  getters: {
    getItemCount: (state) => (itemId: string): number => {
      const matching = state.items.filter((i) => i.itemId === itemId);
      return matching.reduce((sum, item) => sum + item.quantity, 0);
    },
    getItem: (state) => (itemId: string): InventoryItem | undefined => {
      return state.items.find((i) => i.itemId === itemId);
    },
    itemsByCategory: (state) => (category: string): InventoryItem[] => {
      if (category === 'all') return state.items;
      return state.items.filter((i) => i.category === category);
    },
  },
  actions: {
    setItems(items: InventoryItem[]): void {
      this.items = items.map((item) => ({ ...item }));
    },
    addItem(item: InventoryItem): void {
      if (item.stackable === false || item.metadata) {
        this.items.push({ ...item });
        return;
      }
      const existing = this.items.find((i) => i.itemId === item.itemId && !i.metadata);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        this.items.push({ ...item });
      }
    },
    consumeItem(itemId: string, amount = 1): boolean {
      if (amount <= 0) return true;
      const existing = this.items.find((i) => i.itemId === itemId);
      if (!existing || existing.quantity < amount) {
        return false;
      }
      existing.quantity -= amount;
      if (existing.quantity <= 0) {
        this.items = this.items.filter((i) => i.itemId !== itemId);
      }
      return true;
    },
    consumeItemWithMetadata(itemId: string): InventoryItem | null {
      const index = this.items.findIndex((i) => i.itemId === itemId);
      if (index === -1) return null;
      const item = { ...this.items[index] };
      this.items[index].quantity -= 1;
      if (this.items[index].quantity <= 0) {
        this.items.splice(index, 1);
      }
      return item;
    },
    setItemCount(itemId: string, count: number): void {
      const existing = this.items.find((i) => i.itemId === itemId);
      if (existing) {
        existing.quantity = count;
        if (count <= 0) {
          this.items = this.items.filter((i) => i.itemId !== itemId);
        }
      } else if (count > 0) {
        const template = INITIAL_ITEMS.find((i) => i.itemId === itemId);
        if (template) {
          this.items.push({ ...template, quantity: count });
        } else {
          this.items.push({
            itemId,
            category: 'special',
            name: itemId,
            description: '',
            quantity: count,
            stackable: true,
          });
        }
      }
    },
  },
});
