# Dared — Build Roadmap

## Phase 0 — Setup ✅
- Expo SDK 52 + TypeScript + Expo Router scaffold
- Theme system (colors, typography, spacing, radius, shadows)
- Base components: Button, Card, Text, Avatar, Screen, Tag
- Mock data: challenges, clans, passes

## Phase 1 — Auth & Profile
- [ ] Replace mock auth with Supabase: email, Apple, Google
- [ ] Server-side age verification (≥13)
- [ ] Parental consent flow for under-13 (COPPA)
- [ ] Profile creation: username uniqueness, avatar emoji picker
- [ ] Persist auth session

## Phase 2 — Clans
- [ ] DB schema: `clans`, `clan_members`, `invitations`
- [ ] Create clan flow (name, emoji, spin time, member limit)
- [ ] Join with 6-character invite code
- [ ] Realtime member list (Supabase Realtime)
- [ ] Clan settings (admin-only)

## Phase 3 — Roulette & Challenges (core)
- [ ] Challenge catalog in DB with categories + difficulty
- [ ] Edge function `daily-spin` (cron, runs at clan's `spin_time`)
- [ ] All members see the same outcome (deterministic from server)
- [ ] Push notification fan-out when spin happens
- [ ] Winner sees challenge in-app immediately

## Phase 4 — Camera & Proofs
- [ ] Persist video to Supabase Storage with TTL
- [ ] Dynamic watermark (username + clan + UTC timestamp)
- [ ] iOS capture detection: blur overlay while `UIScreen.isCaptured === true`
- [ ] Android FLAG_SECURE on view (already via expo-screen-capture)
- [ ] Server-side video transcoding (size + format)

## Phase 5 — Gamification
- [ ] Points: +difficulty.points on completion, -10 on fail
- [ ] Streak counter (consecutive days completed)
- [ ] Weekly clan ranking with reset cron
- [ ] Achievements / badges
- [ ] Reactions and clan vote (cumplió / no cumplió)

## Phase 6 — Shop
- [ ] Sparks economy (earn from completing, spend in shop)
- [ ] Pass inventory + apply logic
- [ ] `expo-in-app-purchases` for Spark packs (iOS + Android)
- [ ] Daily deal rotation (server-driven)
- [ ] Battle Pass with monthly tracks and tier rewards

## Phase 7 — Notifications
- [ ] `expo-notifications` setup + token registration
- [ ] Triggers: spin happened, you got dared, time running out, reactions
- [ ] Quiet hours respect

## Phase 8 — Polish
- [ ] Sound design (spin tick, drumroll, winner reveal, ding)
- [ ] Skeleton loaders, empty states, error boundaries
- [ ] i18n (EN + ES at minimum)
- [ ] Offline handling for feed
- [ ] Accessibility (VoiceOver / TalkBack labels, contrast checks)

## Phase 9 — Pre-launch
- [ ] Privacy Policy + Terms (lawyer-reviewed for minor audience)
- [ ] In-app reporting and blocking
- [ ] Moderation queue + auto-flag for sensitive content
- [ ] App Store assets, screenshots, age rating filing
- [ ] TestFlight closed beta with 1–2 real clans
