export const colors = {
  bg: '#0A0A0F',
  surface: '#16161D',
  surfaceElevated: '#1F1F2A',
  border: '#2A2A38',

  primary: '#FF2D55',
  primaryDim: '#B81E3D',
  primaryGlow: 'rgba(255, 45, 85, 0.25)',

  accentYellow: '#FFE600',
  accentGreen: '#39FF88',
  accentBlue: '#4DA3FF',
  accentPurple: '#B14DFF',

  text: '#FFFFFF',
  textMuted: '#9A9AA8',
  textDim: '#5C5C6A',

  success: '#39FF88',
  warning: '#FFB84D',
  danger: '#FF4D4D',

  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorKey = keyof typeof colors;
