# Asset specs

**Shared art model:** courses never need their own art. Each **region** has a hero, a scorecard engraving and a collectible vignette; collectibles are **standard frames** with the region vignette and the course name layered in by the app. Destination courses can optionally override any of it.

One spec per asset type: what it replaces, the files to make, canvas and format, **where it appears and at what size**, safe zones, and an acceptance checklist. Prompts live in [`assets/_prompts/`](../_prompts/README.md). Screenshots are phone-size captures from `npm run screens`.

**Workflow:** make the image → save it at its exact path → `npm run art:sync` → reload the app (or `npm run screens`).

*Generated from `regions.json`, `frames.json`, `art-overrides.json` and the course seed. Run `npm run art:specs` after changes.*

| Asset | Group | Files | Final size |
|---|---|---|---|
| [App icon](app-icon.md) | Brand | 1 | 1024 × 1024 px |
| [Emblem: shield + laurels (two versions)](emblem.md) | Brand | 2 | 1024 × 1024 px |
| [Native splash image](splash.md) | Brand | 1 | 1024 × 1024 px |
| [Splash scene (portrait painting)](splash-scene.md) | Brand | 1 | 1179 × 2556 px |
| [Home hero: four seasons (also the Profile banner)](home-hero.md) | Brand | 4 | 1290 × 860 px |
| [Scorecard tree emblem (engraved)](scorecard-tree.md) | Brand | 1 | 640 × 512 px (5:4), transparent |
| [Region hero](region-hero.md) | Regions | 1 | 1290 × 860 px |
| [Region scorecard engraving](region-engraving.md) | Regions | 1 | 1200 × 400 px (3:1), transparent |
| [Region collectible vignette](region-vignette.md) | Regions | 1 | 1024 × 1024 px |
| [Standard collectible frames](collectible-frames.md) | Collectibles | 9 | 1024 × 1024 px |
| [Achievement badges](badge.md) | Badges | 13 | 1024 × 1024 px |
| [Course overrides (optional, one-off)](course-overrides.md) | Overrides | 0 | Hero 1290 × 860 · engraving 1200 × 400 · collectible 1024 × 1024 |

**Total: 35 images**, independent of how many courses exist (+3 per new region, + any overrides). The app works with any subset; missing images keep their vector placeholder.
