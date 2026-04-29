export type ChallengeCategory = 'fun' | 'social' | 'physical' | 'spicy' | 'creative';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  difficulty: ChallengeDifficulty;
  points: number;
  emoji: string;
}

export const CATEGORY_META: Record<ChallengeCategory, { label: string; color: string; emoji: string }> = {
  fun: { label: 'Fun', color: '#FFE600', emoji: '🎉' },
  social: { label: 'Social', color: '#4DA3FF', emoji: '👥' },
  physical: { label: 'Physical', color: '#39FF88', emoji: '💪' },
  spicy: { label: 'Spicy', color: '#FF2D55', emoji: '🔥' },
  creative: { label: 'Creative', color: '#B14DFF', emoji: '🎨' },
};

export const DIFFICULTY_META: Record<ChallengeDifficulty, { label: string; points: number }> = {
  easy: { label: 'Easy', points: 10 },
  medium: { label: 'Medium', points: 25 },
  hard: { label: 'Hard', points: 50 },
  extreme: { label: 'Extreme', points: 100 },
};

export const CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'Sing in public',
    description: 'Sing the chorus of your favorite song out loud in a public place.',
    category: 'social',
    difficulty: 'medium',
    points: 25,
    emoji: '🎤',
  },
  {
    id: 'c2',
    title: '50 push-ups',
    description: 'Do 50 push-ups in a row without stopping. Record the whole thing.',
    category: 'physical',
    difficulty: 'hard',
    points: 50,
    emoji: '💪',
  },
  {
    id: 'c3',
    title: 'Compliment a stranger',
    description: 'Walk up to a stranger and give them a genuine compliment.',
    category: 'social',
    difficulty: 'easy',
    points: 10,
    emoji: '😊',
  },
  {
    id: 'c4',
    title: 'Lip sync battle',
    description: 'Record yourself lip syncing to a random song picked by your clan.',
    category: 'fun',
    difficulty: 'easy',
    points: 10,
    emoji: '🎶',
  },
  {
    id: 'c5',
    title: 'Eat something weird',
    description: 'Combine 3 random items from your kitchen and eat them on camera.',
    category: 'spicy',
    difficulty: 'medium',
    points: 25,
    emoji: '🍔',
  },
  {
    id: 'c6',
    title: 'Draw your clan',
    description: 'Draw a portrait of every member of your clan in 60 seconds.',
    category: 'creative',
    difficulty: 'medium',
    points: 25,
    emoji: '✏️',
  },
  {
    id: 'c7',
    title: 'Cold shower',
    description: 'Take a 30-second cold shower fully clothed.',
    category: 'physical',
    difficulty: 'hard',
    points: 50,
    emoji: '🚿',
  },
  {
    id: 'c8',
    title: 'Speak in accent',
    description: 'Talk to your clan in a foreign accent for 1 minute straight.',
    category: 'fun',
    difficulty: 'easy',
    points: 10,
    emoji: '🗣️',
  },
];

export function randomChallenge(): Challenge {
  return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
}
