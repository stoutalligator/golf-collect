# Mock Build Plan (v0.1)

*Drafted: November 25, 2026*
*Goal: a clickable, realistic iOS mock with **local sample data**, so we can use the app before choosing a backend.*

---

## 1. What "done" looks like for the mock

On an iPhone (Expo Go) you can:

1. Open the app to a Greens Keeper home screen with real-looking stats and recent rounds.
2. Search courses and open a course page showing your history and its collectibles there.
3. **Start a round → enter scores hole by hole → finish**, and see the round saved.
4. See the finished round as a **keepsake scorecard**.
5. See any collectibles, tier upgrades or achievements that round **earned**.
6. Browse your Collection, Achievements and profile stats, all calculated from your rounds rather than hard-coded.
7. Reset back to the sample data from a dev menu.

Not in the mock: a backend, accounts, real course data, GPS, live multiplayer, or leagues beyond the data model.

---

## 2. Stack

Based on what already works in park-pal on Windows, with no design carried over.

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Expo (latest SDK) + React Native + TypeScript (strict)** | Builds on Windows via EAS, runs on your iPhone through Expo Go, and has a web preview for quick screenshots |
| Navigation | **Expo Router** (file-based) | Today's Expo default. Deep links to `course/[id]` and `round/[id]` come for free. |
| Styling | `StyleSheet` + theme tokens in `src/theme/` | Tokens come straight from [brand-guidelines.md](../brand/brand-guidelines.md); no extra styling library |
| Fonts | `@expo-google-fonts/playfair-display`, `@expo-google-fonts/inter` | The brand fonts |
| Graphics | `react-native-svg` | Placeholder collectibles, badges and emblems (see §6) |
| Local persistence | `@react-native-async-storage/async-storage` | New rounds survive app restarts |
| Tests | Vitest for pure domain logic | Stats, tiers and achievements are rules-heavy, so they need tests |
| Builds (later) | EAS (`development` / `preview` / `production`) | Same flow as park-pal |

Bundle ID, slug and app name all live in **one config spot**, so a rebrand is a single change.

---

## 3. Architecture

```
src/app/                      Expo Router screens (thin; UI only)
  (tabs)/
    index.tsx                 Home
    rounds.tsx                Round history
    courses.tsx               Course search/list
    collection.tsx            Collection grid
  round/new.tsx               Start round (modal): course → tees → players
  round/[id]/play.tsx         Hole-by-hole entry
  round/[id]/index.tsx        Keepsake scorecard + round stats
  round/[id]/rewards.tsx      "You earned…" reveal
  course/[id].tsx             Course detail (Overview · Rounds · Collection)
  achievements.tsx            Achievements list
  profile.tsx                 Dashboard + dev menu
src/
  domain/                     Pure TypeScript, no React, fully unit-tested
    types.ts                  Course, Tee, Hole, Round, HoleScore, Player, ...
    stats.ts                  Round + career stats (to-par, FIR%, GIR%, putts, birdies…)
    tiers.ts                  Course collectible tier rules (config-driven)
    achievements.ts           Achievement rule engine (data-driven definitions)
    rewards.ts                Diff "before vs after a round" → newly earned items
  data/
    seed/                     JSON: courses, players, rounds, achievement defs, tier config
    repo/                     Repository interfaces + LocalRepository (seed + AsyncStorage)
    generate.ts               Seeded generator for sample rounds
  state/                      React context/hooks over the repository
  theme/                      colors, typography, spacing, radii (from brand docs)
  components/                 StatTile, RoundCard, Scorecard, CollectibleView, BadgeView…
  art/                        SVG placeholder art components
```

**Key rule:** screens never import seed data directly. They use the repository through hooks. Swapping in Supabase or another backend later means adding a new `Repository` implementation, with no screen rewrites. Course data sits behind its own `CourseProvider` interface, as the vision doc requires (vendor-independent).

**Derived, not stored:** stats, tiers and earned achievements are *computed* from rounds by the domain engines. The only persisted state is rounds (plus later settings, friends and reactions). This keeps the mock honest and matches what a backend would do.

---

## 4. Data model (first pass)

```ts
Course      { id, name, city, state, access: 'public'|'semi-private'|'private', theme, description,
              holes: Hole[] (18), tees: Tee[], collectible: { scene, items: CollectibleItemType[] } }
Tee         { id, name, color, yardages[18], rating?, slope? }
Hole        { number, par, handicapIndex }
Round       { id, courseId, teeId, date, playerIds, kind: 'course'|'sim', holesPlayed: 9|18,
              status: 'active'|'complete', competitionId?, scores: Record<playerId, HoleScore[]> }
HoleScore   { strokes, putts?, fairway?: 'hit'|'left'|'right'|'na', penalties?, chips?, sandShot? }
              // GIR derived: strokes - putts <= par - 2
Player      { id, name, homeState, isMe }
AchievementDef { id, name, description, rule: { type: 'uniqueCourses'|'roundUnder'|'statesPlayed'|
                 'courseCollectionComplete'|'careerCount', params } }
TierConfig  { standard: rule, silver: rule, gold: rule }   // e.g. { type:'bestToPar', lte:0 }
```

### Simulator rounds (decided)

Sim rounds are a **separate track**:

- `Round.kind = 'sim'` references a `SimCourse { id, name, platform? }` never a real `Course`.
- They **never** count toward real course visits, course collectibles, states played, or real-course achievements.
- They get their own **Sim stats** view (filtered with the same stats engine) and their own **sim badge collection** (e.g. Sim Break 80, Sim Courses Played, Sim Cup Champion).
- Achievement definitions carry a `track: 'course' | 'sim'` field, so each engine run only sees its own rounds.

---

## 5. Sample data

- **Courses: researched Connecticut courses only (decided).** A course goes into the seed data only after it has been researched. Start with **about 10–15 CT courses**, a mix of municipal, public daily-fee, semi-private and private, across several regions of the state. For each one we record **facts only**: name, town, access type, number of holes, per-hole par, per-tee yardages, course rating and slope where published, and coordinates. A short description is **written by us**, not copied. No logos or photos, so the art stays as placeholders. Every course gets a source entry (URL + date checked) in `src/data/seed/SOURCES.md`. Anything uncertain is flagged `verified: false` rather than guessed.
  - Mockups meant for publishing still use the fictional courses from the asset spec.
- **Sim courses:** a few generic sim course entries so the sim track has something to show.
- **Rounds:** generated by a seeded script. Real-course rounds are spread across the researched CT courses and dates, plus a handful of sim rounds. This gives the dashboard, tiers and achievements meaningful in-progress values (e.g. Course Explorer 9/25).
- **Friends (3–4):** sample players to appear on rounds.
- **Dev menu:** "Reset sample data", "Clear all rounds", "Jump date". Lets us test first-run and earned states.

---

## 6. Art strategy

I can't produce the painterly gouache art from the board. That comes from image generation using [asset-spec.md](../brand/asset-spec.md). The mock uses **clean SVG placeholders** that match the brand's shapes and palette:

- Ball-marker coin (bronze, silver or gold rim, with a simple cypress silhouette), bag tag, patch, pitch marker, pin
- Shield + ribbon badge frame
- Flag-and-swoosh emblem, engraved-style tree mark
- Gradient-plus-silhouette landscape heroes in palette colors

Each asset sits behind one component (`<Collectible item tier course />`, `<Badge />`, `<CourseHero />`). When real PNGs exist, we swap the component internals and leave the screens alone.

---

## 7. Build phases

**Status (2026-11-25):** ✅ 0 scaffold · ✅ 1a CT research · ✅ 1b domain + sample data (tested) · ✅ 2 browse · ✅ 3 play a round (solo) · ✅ 4 keepsake scorecard · ✅ 5 collection, achievements, profile + dev menu. Screens follow board 03. Remaining: a rewards reveal after a round, multi-player entry, and 6 (friends).

**Status (2026-11-26):** ✅ 6 friends mock (feed, reactions, comments, friend profiles, head-to-head, course leaderboards, tagging friends on a round) · ✅ Stats dashboard (handicap estimate, trend chart, scoring, by-par, tee/approach/putting) · ✅ Trophy Room collection. Remaining: a rewards reveal after a round and multi-player score entry.

Each phase ends with web screenshots for review and a check on your iPhone through Expo Go.

| # | Phase | Delivers |
| --- | --- | --- |
| 0 | **Scaffold** | Expo app in this repo, TS strict, Expo Router, fonts, theme tokens, tab bar with center +, empty screens, Vitest. Runs on web and Expo Go. |
| 1a | **CT course research** | 10–15 researched CT courses → seed JSON + `SOURCES.md` (can run in parallel with phase 0) |
| 1b | **Domain + data** | Types, generated sample rounds (real + sim), LocalRepository, and stats/tiers/achievements engines (course and sim tracks) **with unit tests**. |
| 2 | **Browse** | Home (hero, greeting, 4 stat tiles, recent rounds), Rounds history, Courses search, Course detail (Overview · Rounds · Collection). |
| 3 | **Play a round** | Start-round flow; fast hole-by-hole entry (big +/− stepper, putts, fairway L/Hit/R, penalties; a detail-level setting of Score only / Basic / Full); 9 or 18 holes; resume an active round; finish → save. |
| 4 | **Keepsake + rewards** | Paper-style keepsake scorecard (Out/In, score markings, total *78 (+6)*); a rewards reveal for new collectibles, tier upgrades and achievements. |
| 5 | **Collection + profile** | Collection grid, collectible detail, Achievements with progress, Profile dashboard (career stats, courses by state, milestones), dev menu. |
| 6 | *(stretch)* **Friends mock** | Friends list, friends' shared rounds, emoji reactions and comments, all local. |

After phase 5 we review the experience together and then pick the database and auth approach based on what the mock taught us.

---

## 8. Score-entry design notes

The in-round screen is the one that most needs to be fast:

- One hole per screen; swipe or tap to move between holes, with a mini scorecard strip at the top.
- **Full detail is shown, but only strokes are required (decided).** Every other field can be skipped and stays `undefined` (never assumed to be 0), so stats only use holes where that stat was entered.
- The stroke stepper starts at par. Thumb-sized targets (at least 56pt) and haptic ticks.
- Putts: a 0–4+ chip row. Fairway: Left / Hit / Right / Short (hidden on par 3s). Penalties, chips and sand shots are small optional steppers. GIR is derived when putts are entered, and can be overridden.
- Multiple players: a row per player; your own detailed stats can be expanded.
- No textures or paper on this screen. Flat cream, Inter numerals, fairway controls.

---

## 9. Decisions log

| Date | Decision |
| --- | --- |
| 2026-11-25 | Stack: Expo + React Native + TypeScript |
| 2026-11-25 | Sample courses: only researched real CT courses (facts + sources); fictional courses for public mockups |
| 2026-11-25 | Sim rounds: separate track, with their own stats view and sim badge collection; no real-course credit |
| 2026-11-25 | Score entry: full detail available; only strokes required |
| 2026-11-25 | Don't use golf-station data or code; sample rounds are generated |

| 2026-11-25 | Tiers: Bronze = break 100, Silver = break 90, Gold = break 80, Platinum = even par or better (best 18 at the course). Any completed round earns the untiered ball marker. |
| 2026-11-25 | Collectibles are configurable per course (default set + remove / override / add) in `src/data/config/collectibles.json`. |
| 2026-11-25 | Art is shared so it scales: heroes, engravings and vignettes per **region** (from state); collectibles are standard frames with the region vignette and course name layered in by the app. Optional one-off overrides for destination courses (`art-overrides.json`). Courses also carry a researched `biome` tag (not yet used for art). |
| 2026-11-25 | Tagline: **PLAY · TRACK · COLLECT** (from the splash art). |
| 2026-11-25 | Emblem: the **shield-and-laurel** mark from the splash, in light and on-dark versions; the app icon uses the on-dark version on forest green. |
| 2026-11-25 | Home hero is **seasonal**: four paintings (spring Mar–May, summer Jun–Aug, autumn Sep–Nov, winter Dec–Feb), same composition, picked by date (`src/lib/season.ts`); web preview `?season=`. |
| 2026-11-25 | **Ball marker** = the "played here" collectible and the **only tiered item** (none/Bronze/Silver/Gold/Platinum by best score at the course). **Patch, pitch marker, bag tag, pin** = per-course achievements, **no tiers**, one fixed finish. Default patch rule changed from "Break 90" (duplicated Silver) to "Birdie a par 5 here". |
| 2026-11-26 | **Tabs: Home/Feed · Courses · (+) · Stats · Collection.** Home is one page: greeting + KPI strip + active round + friends feed. Rounds history moved into Stats (Overview · Rounds · Sim). Profile opens from your avatar on Home and holds friends, badges and settings. |
| 2026-11-26 | **Collection = Trophy Room:** a shelf per collectible type (Ball Markers, Pitch Markers, Bag Tags, Patches, Pins) plus Badges; each opens a full case (`/collection/[kind]`) with locked items and how to earn them. Badges are a wall grouped by category with a "Next up" strip and a detail page that shows friends' progress. |
| 2026-11-26 | **Friends mock:** 4 sample friends with generated rounds (`generateFriendRounds`), rounds owned via `Round.ownerId` (omitted = you). Reactions (👏 🔥 ⛳ 😂) and comments are stored locally per round. Tagged friends on your round only appear as "played with"; you keep score for yourself. |
| 2026-11-26 | **Stats:** handicap is an *estimate* (WHS best-8-of-20 differentials from rated full 18s, no net-double-bogey/PCC adjustments). Charts are hand-built SVG (`src/components/charts.tsx`); scoring colours are a diverging scale around par (gold under · gray par · slate over), tokens in `theme.chart`. |
| 2026-11-26 | Lists show your **ball marker** for the course (tiered, or dimmed if unplayed) instead of a repeated region painting; round rows show a date tile, hole-by-hole strip and score. |
| 2026-11-26 | **Database scoped for Supabase** ([database.md](database.md), migration in `supabase/migrations/`): store only entered data + researched courses; stats, tiers, collectibles and badges stay derived in the app. Course research procedure is the project skill `.claude/skills/course-research`. |
| 2026-11-26 | **Supabase wired in.** Email + password sign-in only (no Apple/Google). The app reads/writes Supabase when `EXPO_PUBLIC_SUPABASE_*` is set; otherwise it runs an offline demo on bundled sample data. Sample data goes to the database only via the `@greenskeeper.test` test accounts (`npm run db:seed-test`); course facts via `npm run db:import-courses`. |
| 2026-11-26 | **Leagues, tournaments and scheduled rounds** ("events"). League = season of scheduled rounds with a points table (25-18-15-12-10… by finish, ties split); tournament = 1–4 rounds, one leaderboard; scheduled round = invites/RSVP, no scoring. Formats: stroke play, Stableford, match play (round-robin pairings), each gross or net (WHS course handicap, 95% stroke / 100% match allowance). Join by friend invite or 6-letter code. Players log their own rounds and link them to the event round. Engine: `src/domain/competition.ts`; schema: migration `…000500_events.sql`. |

