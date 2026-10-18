# Monkeys on My Back

A playful tracker for the medium-to-big jobs that keep getting pushed aside: clean the BBQ, trim the tree, gurney the house, finish the course. Each job is a monkey on a tree. The longer it hangs around, the bigger and sadder it gets. Feed it a banana when it's done and it jumps off your back.

## Run it (no setup needed)

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). It starts in **on-device mode**: monkeys are saved in your browser. The first time it opens, a short welcome explains what a monkey is and how to add one.

## What's in this first version

- **Your avatar**: the first time the app opens you pick male or female, then a cartoon you stands in front of your tree (behind the monkeys, so they stay clear), drives the safari bus, and waits by the first tree in your Troop. The pencil by your head opens the avatar page: body, skin, hair style and colour, shirt and colour, shorts or jeans, shoes or boots. Saved on the device and, when signed in, on your profile (`profiles.avatar`), where people you share a troop with can see it. Items are stored as ids (`src/lib/avatar.ts`), ready for unlockable or paid outfits later.
- **Tree screen**: monkeys sit on branches, oldest at the top. They grow bigger with age and their mood slides: very happy (under 2 weeks), happy (under 6), stressed (under 12), then crying.
- **Feed a banana**: the monkey grabs a banana and leaps off; the rest shuffle up. Undo for a few seconds afterwards.
- **Add a monkey**: job, size (15 min → full day, or ongoing), and how long it's *already* been nagging you, so old jobs start at the right size.
- **Nudge card**: picks the oldest job that fits your next free pocket (quick jobs on weeknights, bigger ones on weekend mornings, looks ahead to Saturday from Friday afternoon). Anything due within 3 days comes first.
- **Monkey details** slide up from the bottom when you tap a monkey, so they're visible on any phone size.
- **Feeding celebration**: full-screen moment with a tune: the monkey catches, peels and munches a banana while streamers go off.
- **Troop** (left tab): every fed monkey lives in a playground of trees, eating, waving, napping, swinging, strolling and bouncing. Tap one to see its job. A **List** view shows them all with "put back" and delete. Every visit starts with a safari-bus ride (about 4.5 seconds, tap to skip) and a fun fact.
- **Household** (right tab, Pro): a coming-soon page for sharing trees with a partner or family.
- **Settings** (gear on the tree screen): sign in to sync (once Supabase is set up), copy device monkeys to your account, sounds on/off, and **morning reminders** (Off / Weekends / Every day, a time, and a reminder on due dates; default weekends at 8am).

### Reminders: what works where
- **Phone app (Capacitor):** scheduled on the device as local notifications (`src/lib/notifications.ts`), rebuilt whenever the troop changes.
- **Web / home-screen app:** the choice is saved but nothing is sent yet. Sending to a web app needs Web Push: a small server job (e.g. a Supabase Edge Function on a schedule) plus saving each device's push subscription. `planReminders()` in `src/lib/reminders.ts` already works out what to send and when, so the server can reuse it.

## Versions

The bottom of Settings shows something like **version 0.10.1 (2257a31)**:
- `0.10.1` is `version` in `package.json`, bumped with each release.
- `2257a31` is the git commit the build was made from (on Vercel it's the commit that was deployed), so you can find the exact code with `git show 2257a31`.

## Project layout

```
src/
  lib/monkey.ts        types, age/mood/size rules (pure, tested)
  lib/nudge.ts         which monkey to suggest and when (pure, tested)
  lib/layout.ts        seats on the tree (pure, tested)
  lib/notifications.ts Saturday 8am local notification on iOS/Android
  data/localRepo.ts    on-device storage
  data/supabaseRepo.ts Supabase storage
  stores/troop.ts      Pinia store; picks local or Supabase automatically
  components/          MonkeyFace, TroopTree, NudgeCard, MonkeySheet, AddMonkeyDialog
  views/               TreeView, TroopView, HouseholdView, SettingsView
supabase/
  migrations/          database schema + row-level security
  tests/rls-test.mjs   checks the security rules as two different users
```

## Checks

```bash
npm test          # unit tests for ages, moods, sizes, seating and nudges
npm run test:db   # runs the migration in an in-process Postgres and checks the security rules
npm run build     # type-check + production build
```

All three pass in this version (`test:db` now also checks who can see and change avatars).

## Turning on accounts (Supabase)

> **Database updates:** when a pull request adds a new file to `supabase/migrations/`, run that file in the Supabase SQL editor **before** merging, so the live app never asks for a column that doesn't exist yet.


1. Create a project at supabase.com.
2. In the SQL editor, run each file in `supabase/migrations/` in date order (oldest first) (or use the Supabase CLI: `supabase db push`).
3. **Authentication → URL configuration**: add `http://localhost:5173` to the redirect URLs.
4. Copy `.env.example` to `.env.local` and fill in the project URL and anon key (Project settings → API).
5. Restart `npm run dev`. Settings now shows "Email me a sign-in link".

### How the data and security work

- Every user gets a personal **troop** on sign-up (a database trigger creates it).
- Monkeys belong to a troop, not a person. Household sharing later = adding a row to `troop_members`. No schema change needed.
- Row-level security is on for every table. Only members of a troop can see or change its monkeys; the owner controls who's in it; anyone can leave a troop they don't own; personal troops can't be deleted.
- `fed_by` is set by the database from the signed-in user, so it can't be faked.
- `npm run test:db` proves all of the above (18 checks). Re-run it whenever you change a policy.

## Putting it online (Vercel) and on your phone

The app is an installable web app: it has a home-screen icon, opens full screen, and works offline (your monkeys still need a connection to sync).

1. Go to vercel.com, sign in with GitHub, click **Add New → Project** and import `monkeys-on-my-back`.
2. Vercel detects Vite. Leave the build settings as they are.
3. Under **Environment Variables**, add the same two values as your `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. You get an address like `https://monkeys-on-my-back.vercel.app`.
5. In Supabase, **Authentication → URL Configuration**: set **Site URL** to that address and add it under **Redirect URLs** (keep `http://localhost:5173` there too for local testing).
6. On your phone, open the address:
   - **iPhone (Safari):** Share button → **Add to Home Screen**.
   - **Android (Chrome):** menu → **Install app** (or **Add to Home screen**).

Every push to `main` redeploys automatically. `vercel.json` (and `public/_redirects` for Netlify) make page refreshes on `/fed` or `/settings` work.

If an update doesn't appear on your phone, close the app fully and reopen it: the new version loads in the background and takes over on the next launch.

## Phones (Capacitor)

```bash
npx cap add ios        # needs a Mac with Xcode
npx cap add android    # needs Android Studio
npm run cap:sync
npx cap open ios       # or: npx cap open android
```

Change `appId` in `capacitor.config.ts` to a reverse domain you own before publishing.

### Home screen widget (next step)

Widgets have to be native code: **WidgetKit (Swift)** on iOS and **App Widgets (Kotlin)** on Android. The plan:

1. The app writes a tiny summary (count, oldest monkey, nudge text) to shared storage whenever the troop changes: an App Group `UserDefaults` on iOS, `SharedPreferences` on Android. A small Capacitor plugin can do this.
2. The widget reads that summary and draws the monkey + number. No network calls from the widget.

The data the widget needs already exists: `store.onBack.length`, `store.onBack[0]` (oldest) and `store.nudge`.

## Known gaps / ideas for next

- Household sharing UI (invite by email). The database already supports it.
- Seasonal or "before an event" reminders ("clean the BBQ before summer").
- Real-time sync between devices (Supabase Realtime on the `monkeys` table).
- Dark mode.
