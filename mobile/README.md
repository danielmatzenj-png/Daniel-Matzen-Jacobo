# Dared

> Spin daily. Get dared. Prove it.

A mobile app for teen friend groups. Every day at a fixed time, the clan's
roulette spins and randomly picks one member. That member receives a dare
challenge and has 2 hours to record video proof inside the app — screenshots
and screen recording are blocked. Clans vote, points stack, ranks shift.

## Stack

- **Expo SDK 52** + **TypeScript**
- **Expo Router** (file-based navigation)
- **React Native Reanimated** (roulette + transitions)
- **expo-camera** (in-app proof recording)
- **expo-screen-capture** (anti-screenshot / anti-recording)
- **expo-haptics** (feel the spin)
- **Supabase** (auth, postgres, storage, edge functions, realtime) — *stub only in this build*

## Project layout

```
mobile/
├── app/                     # Expo Router routes (file-based)
│   ├── _layout.tsx          # Root: fonts, providers, status bar
│   ├── index.tsx            # Splash → onboarding
│   ├── (auth)/
│   │   ├── onboarding.tsx
│   │   └── login.tsx
│   ├── (tabs)/              # Bottom tab bar after auth
│   │   ├── index.tsx        # Today / next spin
│   │   ├── clans.tsx        # List of clans
│   │   ├── feed.tsx         # Recent dare proofs
│   │   ├── shop.tsx         # Passes + Sparks + Battle Pass
│   │   └── profile.tsx
│   ├── clan/[id].tsx        # Clan detail & ranking
│   ├── challenge/[id].tsx   # Active dare detail
│   ├── roulette.tsx         # Full-screen modal: the spin
│   └── camera.tsx           # Full-screen modal: record proof
├── src/
│   ├── theme/               # colors, typography, spacing, radius, shadows
│   ├── components/          # Button, Card, Text, Avatar, Screen, Tag
│   ├── data/                # Mock challenges, clans, passes
│   ├── hooks/               # useAppFonts
│   └── lib/supabase.ts      # Backend client stub
└── assets/
    ├── fonts/               # Anton, Inter, SpaceMono (see fonts/README.md)
    └── README.md            # Icon + splash spec
```

## Design system

Bold dark neon — built for Gen Z.

| Token | Value |
|---|---|
| `colors.bg` | `#0A0A0F` |
| `colors.surface` | `#16161D` |
| `colors.primary` | `#FF2D55` (Dared red neon) |
| `colors.accentYellow` | `#FFE600` |
| `colors.accentGreen` | `#39FF88` |
| Display font | Anton |
| Body font | Inter |
| Mono font | Space Mono |

## Run locally

```bash
cd mobile
npm install
npx expo start
```

Open on your phone with the **Expo Go** app (scan the QR), or press `i` / `a`
to launch on the iOS simulator / Android emulator.

> First boot uses system fonts as fallback. Drop the four `.ttf` files into
> `assets/fonts/` (see that folder's README) for the full neon vibe.

## What works in this build

✅ Splash + onboarding (3 slides) + login screen
✅ Bottom tab navigation
✅ Today screen with live countdown to next spin
✅ Clan list + clan detail with weekly ranking
✅ Roulette with animated wheel, ticking haptics, winner reveal
✅ Challenge detail with rules and 2-hour timer
✅ In-app camera with watermark + anti-screenshot listener
✅ Feed of clan proofs (placeholder video, vote / react buttons)
✅ Shop with passes, Spark packs, daily deal, Battle Pass
✅ Profile with stats, pass inventory, badges

## What's stubbed (next phases)

🟡 **Auth** — Login screen routes straight into the app. Wire Supabase Auth.
🟡 **Daily spin** — Roulette is local. Move to a cron-triggered Supabase
   Edge Function so every member sees the same winner.
🟡 **Video upload** — Camera records but doesn't persist. Pipe to Supabase
   Storage with signed URLs.
🟡 **Anti-capture** — `preventScreenCaptureAsync` works fully on Android
   (FLAG_SECURE). On iOS it can only *detect* (`isCaptured`) — gate sensitive
   views with a blur overlay when capture is active.
🟡 **Push notifications** — Wire `expo-notifications` + Supabase trigger.
🟡 **In-app purchases** — Add `expo-in-app-purchases` for Spark packs and
   Battle Pass on App Store + Play.
🟡 **Moderation** — Required before launch (under-18 audience): report flow,
   blocking, content review queue, COPPA + GDPR consent.

## Build phases

See `docs/roadmap.md` for the 9-phase build plan. Currently completing
**Phase 0 — Setup** and most of the UI shell.

## Important: audience is teens

Anything shipped publicly must comply with COPPA (US, under 13) and GDPR-K
(EU, under 16). The age gate on auth must be enforced server-side, parental
consent flow added for under-13, and aggressive content moderation in place.
Don't ship without it.
