export interface Member {
  id: string;
  username: string;
  emoji: string;
  points: number;
  streak: number;
}

export interface Clan {
  id: string;
  name: string;
  emoji: string;
  code: string;
  spinTime: string;
  members: Member[];
  createdAt: string;
}

export const CURRENT_USER: Member = {
  id: 'u1',
  username: 'you',
  emoji: '🦊',
  points: 245,
  streak: 5,
};

export const MOCK_CLANS: Clan[] = [
  {
    id: 'cl1',
    name: 'Wolves',
    emoji: '🐺',
    code: 'WLVS24',
    spinTime: '20:00',
    createdAt: '2026-04-15',
    members: [
      CURRENT_USER,
      { id: 'u2', username: 'maxie', emoji: '🐶', points: 320, streak: 8 },
      { id: 'u3', username: 'lola', emoji: '🐱', points: 180, streak: 3 },
      { id: 'u4', username: 'kairo', emoji: '🐯', points: 410, streak: 11 },
      { id: 'u5', username: 'zane', emoji: '🐸', points: 95, streak: 1 },
    ],
  },
  {
    id: 'cl2',
    name: 'School Crew',
    emoji: '🎒',
    code: 'SKL901',
    spinTime: '18:30',
    createdAt: '2026-04-22',
    members: [
      CURRENT_USER,
      { id: 'u6', username: 'mia', emoji: '🦋', points: 150, streak: 4 },
      { id: 'u7', username: 'theo', emoji: '🐼', points: 220, streak: 6 },
    ],
  },
];
