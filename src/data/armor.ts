import { ArmorDefinition } from '@/game/types';

export const ARMOR: Record<string, ArmorDefinition> = {
  // Tier 1 - Basic protection
  basicPlating: {
    id: 'basicPlating',
    name: 'Basic Plating',
    description: 'Simple steel plates. Better than nothing.',
    damageReduction: 0.1,
    weight: 15,
    tier: 1,
    cost: 0, // Starter
  },

  // Tier 2 - Improved protection
  reinforcedSteel: {
    id: 'reinforcedSteel',
    name: 'Reinforced Steel',
    description: 'Hardened steel with welded seams.',
    damageReduction: 0.18,
    weight: 25,
    tier: 2,
    cost: 400,
  },
  titaniumShell: {
    id: 'titaniumShell',
    name: 'Titanium Shell',
    description: 'Lightweight titanium alloy. Strong and fast.',
    damageReduction: 0.15,
    weight: 12,
    tier: 2,
    cost: 600,
  },
  spikedArmor: {
    id: 'spikedArmor',
    name: 'Spiked Armor',
    description: 'Hurts enemies on contact. Offensive defense.',
    damageReduction: 0.12,
    weight: 20,
    tier: 2,
    cost: 500,
    // Special: reflects 5 damage on contact (handled in combat)
  },

  // Tier 3 - Advanced protection
  compositeArmor: {
    id: 'compositeArmor',
    name: 'Composite Armor',
    description: 'Layered ceramic and steel. Military grade.',
    damageReduction: 0.25,
    weight: 35,
    tier: 3,
    cost: 1200,
  },
  ablativePlates: {
    id: 'ablativePlates',
    name: 'Ablative Plates',
    description: 'Sacrificial outer layer absorbs impacts.',
    damageReduction: 0.22,
    weight: 28,
    tier: 3,
    cost: 1000,
  },
  reactiveArmor: {
    id: 'reactiveArmor',
    name: 'Reactive Armor',
    description: 'Explosive tiles counter incoming attacks.',
    damageReduction: 0.28,
    weight: 40,
    tier: 3,
    cost: 1500,
  },

  // Tier 4 - Elite protection
  nanoweaveArmor: {
    id: 'nanoweaveArmor',
    name: 'Nanoweave Armor',
    description: 'Self-repairing nanomaterial. The future is now.',
    damageReduction: 0.32,
    weight: 30,
    tier: 4,
    cost: 2500,
    // Special: slowly regenerates HP (handled in update)
  },
  fortressPlating: {
    id: 'fortressPlating',
    name: 'Fortress Plating',
    description: 'Maximum protection. You are the immovable object.',
    damageReduction: 0.4,
    weight: 60,
    tier: 4,
    cost: 3000,
  },
  phantomShield: {
    id: 'phantomShield',
    name: 'Phantom Shield',
    description: 'Experimental energy barrier. Partial damage phasing.',
    damageReduction: 0.35,
    weight: 20,
    tier: 4,
    cost: 3500,
  },
};

export const getArmorById = (id: string): ArmorDefinition | undefined => {
  return ARMOR[id];
};

export const getArmorByTier = (tier: number): ArmorDefinition[] => {
  return Object.values(ARMOR).filter(a => a.tier === tier);
};
