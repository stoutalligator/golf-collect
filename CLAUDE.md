@AGENTS.md

# Greens Keeper (working name; repo: golf-collect)

An iOS golf app for tracking rounds, discovering courses, and **collecting the courses you've played**.

## Source-of-truth docs

- Plan, phases and decisions log: [docs/plan/mock-build-plan.md](docs/plan/mock-build-plan.md)
- Brand rules (colors, type, UI patterns): [docs/brand/brand-guidelines.md](docs/brand/brand-guidelines.md). The **Greens Keeper board is the only design reference.** Don't take design cues from other projects (e.g. park-pal).
- Asset generation: [docs/brand/asset-spec.md](docs/brand/asset-spec.md)

## Rules

- **Theme tokens only.** Use colors, fonts and spacing from `src/theme`. No ad-hoc hex values in screens.
- **Screens don't import seed JSON.** They go through `src/data` (repository layer), so a backend can replace local data later.
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

  Use `Button` (primary/secondary) from `ui.tsx` for actions, `enterItem(i)` for list entrances, `CountUp` for headline numbers, and `ProgressBar` (animated). Keep motion quick and springy; no wobble.
- Keep the app name in `app.json` only (it will be rebranded).

## Commands

```bash
npx expo start            # dev server (scan QR with Expo Go on iPhone)
npx expo start --web      # web preview
npx tsc --noEmit          # typecheck
npm test                  # vitest (domain logic)
node scripts/courses/build-ct-seed.mjs [--refresh]   # rebuild CT course seed
npm run art:prompts       # create/compile art prompts (assets/_prompts/compiled)
npm run art:sync          # register images in assets/art with the app
npm run art:specs         # regenerate assets/_specs (after changing regions, frames or overrides)
npm run screens           # phone-size screenshots → docs/screenshots (web preview must be running on :8099)
```

Requires Node >= 22.13 (Expo SDK 58).

## Previewing

The web preview renders inside an iPhone frame (393×852 pt, `src/components/web-phone-frame.tsx`); `?phone=1` drops the bezel and `?splash=hold` keeps the splash up. Use these for screenshots instead of a desktop-width browser. Expo Go on a real iPhone is the source of truth.
