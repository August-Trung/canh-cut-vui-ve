import { InventoryItem } from '@penguin/types';

export const INITIAL_ITEMS: InventoryItem[] = [
  {
    itemId: 'basic_egg',
    category: 'eggs',
    name: 'Basic Egg',
    description: 'A cozy speckled egg. Place in the hatchery to incubate.',
    quantity: 1,
    stackable: true,
  },
  {
    itemId: 'sardine',
    category: 'food',
    name: 'Small Sardine',
    description: 'A fresh little fish! Use to feed penguins and restore happiness.',
    quantity: 50,
    stackable: true,
  },
];
