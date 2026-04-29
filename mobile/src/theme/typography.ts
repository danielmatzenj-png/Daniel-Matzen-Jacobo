import { TextStyle } from 'react-native';

export const fonts = {
  display: 'Anton',
  body: 'Inter',
  bodyBold: 'Inter-Bold',
  mono: 'SpaceMono',
} as const;

export const typography = {
  hero: {
    fontFamily: fonts.display,
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  display: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    lineHeight: 30,
  } satisfies TextStyle,
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    lineHeight: 24,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  small: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
  } satisfies TextStyle,
  mono: {
    fontFamily: fonts.mono,
    fontSize: 14,
    letterSpacing: 1,
  } satisfies TextStyle,
} as const;

export type TypographyKey = keyof typeof typography;
