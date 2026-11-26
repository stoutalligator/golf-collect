@AGENTS.md

# Greens Keeper (working name; repo: golf-collect)

An iOS golf app for tracking rounds, discovering courses, and **collecting the courses you've played**.

## Source-of-truth docs

- Plan, phases and decisions log: [docs/plan/mock-build-plan.md](docs/plan/mock-build-plan.md)
- Brand rules (colors, type, UI patterns): [docs/brand/brand-guidelines.md](docs/brand/brand-guidelines.md). The **Greens Keeper board is the only design reference.** Don't take design cues from other projects (e.g. park-pal).
- Asset generation: [docs/brand/asset-spec.md](docs/brand/asset-spec.md)

## Rules

- **Theme tokens only.** Use colors, fonts and spacing from `src/theme`. No ad-hoc hex values in screens.
- **Screens don't import seed JSON.** They go through `src/data` (repository layer). Signed in, that's `SupabaseRepository` (email auth, RLS); with no Supabase env vars, `LocalRepository` (offline demo).
- **Sample data never goes to the database** except course facts. Test data lives only on the `@greenskeeper.test` accounts made by `npm run db:seed-test`. Schema changes are new files in `supabase/migrations/` (never edit an applied one).
- **Domain logic stays pure** in `src/domain` (no React) and is unit-tested with Vitest.
- **Course data is researched, never guessed.** Seed courses come from `scripts/courses/build-ct-seed.mjs` (OpenGolfAPI, ODbL, plus overrides), and every course carries its sources and verification status. Don't hand-edit `src/data/seed/courses.ct.json`; change `scripts/courses/ct-courses.json` and rebuild.
- **Only ball markers are tiered** (by best score at the course). Patch, pitch marker, bag tag and pin are per-course achievements with no tiers.
- **Collectibles and tiers are config, not code.** Tier rules are in `src/data/config/game.ts` (Bronze break 100 · Silver break 90 · Gold break 80 · Platinum ≤ par). Per-course collectible sets are in `src/data/config/collectibles.json`. After changing that file, run `npm run art:prompts` and `npm run art:specs`.
- **Sim rounds are a separate track.** They never count toward real-course visits, collectibles or real-course achievements.
- **Score entry:** only `strokes` is required; an unentered stat is `undefined`, never `0`.
- **Art is shared, not per course.** Region art (`regions.json`, course region comes from its state), standard collectible frames with layouts in `src/art/frames.json` (the app layers the region vignette and course name), and optional overrides in `src/data/config/art-overrides.json`. Components get images through `getArt()`/`firstArt()` in `src/art` and must render an SVG placeholder when nothing is found. The user makes the art from `assets/_prompts/`. Never hand-edit `src/art/registry.generated.ts`; run `npm run art:sync`.
- **Motion & haptics:** every tappable element uses `<Tap>` from `src/components/motion.tsx` (spring press + haptic), never a raw `Pressable`. Use the haptic vocabulary in `src/lib/haptics.ts`:
  - `select`: changing a selection
  - `tap`: ordinary buttons, cards and rows
  - `press`: primary actions
  - `success`: accomplishments
  - `warning`: destructive confirms

  Use `Button` (primary/secondary) from `ui.tsx` for actions, `enterItem(i)` for list entrances, `CountUp` for headline numbers, and `ProgressBar` (animated). Keep motion quick and settled: springs are critically damped (no overshoot), and badge/collectible entrances use `popIn()`, never `ZoomIn.springify()`.
- **Chrome & surfaces:** cream pages, headers and tab bar (see the brand guidelines' 2026-11-26 tokens). Use `SheetScreen` for standard screens, `IconButton` (round) for header actions, `Group` + rows for lists, `StatStrip` for headline numbers, `SectionHeader` (with pill action), `Chips` (segmented). Don't nest raised surfaces.
- **Navigation:** tabs are Home/Feed · Courses · (+) · Stats · Collection. Profile (`/profile`) opens from the avatar on Home; friends are `/friends` and `/player/[id]`.
- **Rounds have owners.** `Round.ownerId` (omitted = you); use `roundOwner(r)`. `data.roundsByDate`/`courseStats`/`collections`/`achievements` are yours; anyone's derived data comes from `data.playerData(id)`. Friends' rounds are read-only, except ones you're keeping score for (`scoredBy` = you, `groupId` set) while they're active.
- **Charts** use `src/components/charts.tsx` and `chart` tokens in `src/theme` (diverging to-par scale). Text never takes a series color.
- Keep the app name in `app.json` only (it will be rebranded).

## Commands

```bash
npx expo start            # dev server (scan QR with Expo Go on iPhone)
npx expo start --web      # web preview
npx tsc --noEmit          # typecheck
npx expo lint             # lint (ESLint via eslint-config-expo)
npm run lock:fix          # after any `npx expo install`: rewrite package-lock with npm 10 (EAS uses npm 10; Windows npm 11 drops wasm optional deps and the cloud build fails)
npm test                  # vitest (domain logic)
node scripts/courses/build-ct-seed.mjs [--refresh]   # rebuild CT course seed
npm run art:prompts       # create/compile art prompts (assets/_prompts/compiled)
npm run art:sync          # register images in assets/art with the app
npm run art:specs         # regenerate assets/_specs (after changing regions, frames or overrides)
npm run screens           # phone-size screenshots → docs/screenshots (web preview on :8099; signs in as the test account)
npm run db:import-courses # push researched courses + sim courses to Supabase (service-role key)
npm run db:seed-test      # recreate the @greenskeeper.test test accounts with generated rounds
```

Requires Node >= 22.13 (Expo SDK 58).

## Previewing

The web preview renders inside an iPhone frame (393×852 pt, `src/components/web-phone-frame.tsx`); `?phone=1` drops the bezel and `?splash=hold` keeps the splash up. Use these for screenshots instead of a desktop-width browser. Expo Go on a real iPhone is the source of truth.
