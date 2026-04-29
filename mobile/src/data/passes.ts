export type PassType = 'skip' | 'reroll' | 'shield' | 'double' | 'spotlight';

export interface Pass {
  type: PassType;
  name: string;
  emoji: string;
  description: string;
  color: string;
  cost: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const PASSES: Record<PassType, Pass> = {
  skip: {
    type: 'skip',
    name: 'Skip Pass',
    emoji: '⏭️',
    description: 'Skip a challenge with no penalty.',
    color: '#39FF88',
    cost: 200,
    rarity: 'common',
  },
  reroll: {
    type: 'reroll',
    name: 'Reroll Pass',
    emoji: '🎲',
    description: 'Get a different challenge instead of your assigned one.',
    color: '#FFE600',
    cost: 350,
    rarity: 'rare',
  },
  shield: {
    type: 'shield',
    name: 'Shield Pass',
    emoji: '🛡️',
    description: 'Protect yourself from being picked for a full day.',
    color: '#4DA3FF',
    cost: 500,
    rarity: 'epic',
  },
  double: {
    type: 'double',
    name: 'Double Points',
    emoji: '⚡',
    description: 'Your next completed challenge counts double.',
    color: '#B14DFF',
    cost: 250,
    rarity: 'rare',
  },
  spotlight: {
    type: 'spotlight',
    name: 'Spotlight Pass',
    emoji: '🎯',
    description: 'Force the roulette to pick a specific clan member.',
    color: '#FF2D55',
    cost: 1000,
    rarity: 'legendary',
  },
};

export interface SparkPack {
  id: string;
  amount: number;
  bonus: number;
  price: string;
  popular?: boolean;
}

export const SPARK_PACKS: SparkPack[] = [
  { id: 'p1', amount: 100, bonus: 0, price: '$0.99' },
  { id: 'p2', amount: 500, bonus: 50, price: '$2.99', popular: true },
  { id: 'p3', amount: 1200, bonus: 200, price: '$4.99' },
  { id: 'p4', amount: 3000, bonus: 800, price: '$9.99' },
];
