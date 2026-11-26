# Golf Collect

> *Working name. The app will probably be renamed before launch.*

An iOS golf app for tracking your game, discovering courses, **collecting the places you've played**, and sharing the journey with friends.

It covers the same everyday ground as apps like 18Birdies and Golf GameBook (scorecards, stats, friends, leagues). What sets it apart is the **golf journey**: every course you play earns a unique digital keepsake, milestones become badges, and your profile shows both *how* you play and *where* you've played.

**Status:** clickable iOS mock with local sample data (Expo). See the [build plan](docs/plan/mock-build-plan.md) for what's done and what's next.

---

## What makes it different

- **Course collectibles.** Each course has its own collectible, such as a ball marker, crest, destination medallion, illustrated tile or passport stamp. Its tier (bronze → platinum) reflects how well you've played there.
- **A visible golf journey.** Courses visited, states and regions covered, furthest trip, career birdies and eagles, and milestones like breaking 100 / 90 / 80.
- **Keepsake scorecards.** Fast and legible during a round. Afterwards it becomes a polished, course-branded record worth revisiting and sharing.
- **A friends-first social layer.** Share rounds, follow friends' live scores, comment and react. There's no public everyone-sees-everything feed.

## Core feature areas

| Area | Summary |
| --- | --- |
| **Rounds & scoring** | Hole-by-hole score, putts, fairways, GIR, miss direction, short game. Round history and stats. |
| **Profile / dashboard** | Performance trends together with collecting progress. |
| **Courses** | Search by name and location (starting in Connecticut, built to expand). Course details and your history there. |
| **Collection** | Browse course collectibles, tiers and regional collections. |
| **Achievements** | Extensible badges for score, birdie, round-count, course-count and regional milestones. |
| **Friends** | Connections, shared rounds, comments, reactions, and privacy controls from day one. |
| **Leagues & tournaments** | Scheduled rounds, configurable formats and points, results aggregated across rounds. |
| **GPS (future)** | Hole image or map, your position, and distance to the green or to a tapped target. Planned for later and does not block the MVP. |

## Product principles

1. Score tracking is core, and the app must be useful without GPS.
2. Collecting is the differentiator.
3. Make the golf journey visible.
4. Social features are intentional and friends-based.
5. Keep a clear path to GPS.
6. The achievement system is data-driven and extensible.
7. Course-data providers are interchangeable, behind a provider-independent layer.

## Brand direction (working)

A **premium, modern golf collection**: *Play · Track · Collect.* The interface stays clean and modern, and heritage character lives in the collectibles, scorecards, badges and painterly artwork.

| Token | Hex |
| --- | --- |
| Fairway | `#1F3D2F` |
| Cream | `#F2E6CF` |
| Gold | `#BB8B2B` |
| Slate | `#486E8B` |
| Sage | `#748056` |

Type: **Playfair Display** (headings and brand) + **Inter** (interface and data). Working brand name: **Greens Keeper**.

## Docs

- [Product vision & working notes](docs/product-vision.md): features, scope, GPS and course-data considerations, open decisions.
- [Asset & visual exploration brief](docs/asset-exploration.md): the original creative brief.
- [Brand guidelines](docs/brand/brand-guidelines.md): name, voice, color, type, UI patterns, illustration, icon. **The source of truth.**
- [Asset spec & generation guide](docs/brand/asset-spec.md): prompt blocks, collectible formats, tiers, badges, sizes, naming.
- [Brand board](docs/brand/boards/board-02-greens-keeper.png): the Greens Keeper concept board, the only design reference.

## Tech stack

**Expo (SDK 58) + React Native + TypeScript**, with Expo Router. iOS first; test on a phone with Expo Go.

- Data: local sample data behind a repository layer. The backend and auth are chosen after the mock (see the [plan](docs/plan/mock-build-plan.md)).
- Courses: 16 researched Connecticut courses ([sources](src/data/seed/SOURCES.md)). Course data © OpenStreetMap contributors (ODbL 1.0) via OpenGolfAPI.

## Getting started

Requires **Node ≥ 22.13**.

```bash
npm install
npx expo start          # scan the QR code with Expo Go on your iPhone
npx expo start --web    # or preview in the browser (renders in an iPhone-size frame)
npm run screens         # phone-size screenshots of every screen → docs/screenshots
```

Art: prompts in [assets/_prompts](assets/_prompts/README.md), sizes and placement in [assets/_specs](assets/_specs/README.md).

## Next steps

1. Refine the feature list and define the per-hole scorecard data.
2. Explore the scorecard visual direction and collectible system.
3. Define the dashboard, collection, friends and league experiences.
4. Compare course-data providers on actual Connecticut coverage.
5. Draft screen flows and agree on MVP scope.
6. Pick the stack and scaffold the app.
