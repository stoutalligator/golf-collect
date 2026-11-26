# Art prompts: how to make and add art

**Shared art model:** courses don't need their own art.
- Each **region** (New England, Southeast, …) has a hero, a scorecard engraving and a collectible vignette.
- Collectibles are **standard frames**. The app layers the region vignette into the frame's window and draws the course name in.
- **Destination courses** can optionally get one-off art.

Every prompt names the **exact file to save**. For sizes, safe zones, frame window coordinates and where each asset appears, see the **[asset specs](../_specs/README.md)**. Until an image exists, the app shows a vector placeholder, so you can add art in any order.

## Folder map

| File | What's in it |
| --- | --- |
| [_style.md](_style.md) | Shared style blocks (`{{PAINTERLY}}`, `{{ENGRAVED}}`, `{{OBJECT}}`, `{{NEGATIVE}}`). **Edit the overall look here.** |
| [brand/brand.md](brand/brand.md) | App icon, emblem, splash image, splash scene, home hero, scorecard tree |
| [badges/badges.md](badges/badges.md) | Achievement badges |
| `regions/<region>.md` | Hero, scorecard engraving and vignette for one region. Created automatically for every region that has courses; edit its `SCENE` line. |
| [collectibles/frames.md](collectibles/frames.md) | The standard frames: ball marker (untiered + Bronze/Silver/Gold/Platinum), pitch marker, patch, bag tag, pin |
| `overrides/<course>.md` | One-off art for courses listed in `src/data/config/art-overrides.json` (destination hero, custom collectibles) |
| `compiled/` | **Paste-ready** prompts with blocks filled in. Generated, so don't edit. `compiled/INDEX.md` is your checklist. |

## Workflow

1. **Edit** a prompt file (for a region, edit its `SCENE` line).
2. **Compile:** `npm run art:prompts`
3. **Copy** the prompt from `compiled/…` into your image tool, with [the brand board](../../docs/brand/boards/board-02-greens-keeper.png) attached as a style reference.
4. **Save** the image at the path in its **Save as:** line (exact name, lowercase, `.png`).
5. **Register:** `npm run art:sync`, then reload the app (or run `npm run screens`).

## Where files go

```
assets/art/
  brand/                     app-icon · emblem · splash · splash-scene
  home/hero.png
  scorecard/tree-emblem.png
  badges/<badge-id>.png
  regions/<region>/          hero · scorecard-engraving · vignette
  collectibles/frames/       ball-marker · ball-marker-bronze · -silver · -gold · -platinum
                             pitch-marker · patch · bag-tag · pin
  courses/<course-id>/       (optional overrides) hero · scorecard-engraving · collectibles/<id>
```

## Tips

- **Frames must have a transparent window** where the scene shows through (positions are in the [frame spec](../_specs/collectible-frames.md)). Leave label areas blank; the app writes the course name.
- If a painted frame's window lands slightly off, edit `src/art/frames.json` to match the art instead of repainting.
- Make the untiered ball marker first and edit it for each tier, so the coin stays identical.
- **Adding a destination course:** add it to `art-overrides.json` and run `npm run art:prompts`. Its prompt file appears in `overrides/`.
- **Adding courses in a new region:** `npm run art:prompts` creates that region's prompt file automatically.
