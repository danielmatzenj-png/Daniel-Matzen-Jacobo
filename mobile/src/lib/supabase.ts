/**
 * Supabase client stub.
 *
 * Phase 0 of the build is UI-only with mock data. When wiring real backend:
 *
 * 1. `npm install @supabase/supabase-js`
 * 2. Copy `.env.example` to `.env` and fill in EXPO_PUBLIC_SUPABASE_URL +
 *    EXPO_PUBLIC_SUPABASE_ANON_KEY.
 * 3. Replace this stub with a real createClient() call.
 *
 * Tables to create (see /docs/schema.sql):
 *   - profiles, clans, clan_members, invitations
 *   - challenges, daily_spins, submissions, votes, reactions
 *   - passes, transactions
 *
 * Edge functions:
 *   - daily-spin (cron, picks one member per clan per day)
 *   - process-pass (applies effects of consumed passes)
 */

export const supabase = {
  auth: {
    signInWithPassword: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (_table: string) => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
  }),
};
