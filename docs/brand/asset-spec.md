# Asset Specification & Generation Guide (v0.2)

*Last updated: November 25, 2026*
*Design source: [board-02-greens-keeper.png](boards/board-02-greens-keeper.png) only.*

This guide keeps every generated or illustrated asset consistent with the Greens Keeper board. Use it alongside [brand-guidelines.md](brand-guidelines.md).

> **Shared art model (2026-11-25):** heroes, engravings and collectible scenes are per **region**; collectibles are **standard frames** with the region vignette and the course name layered in by the app; destination courses can override. Sections 2, 5, 6 and 7 below describe the original per-course approach and are kept as style reference. The per-asset truth is in [`assets/_specs/`](../../assets/_specs/README.md).
>
> **Ready-to-use prompts live in [`assets/_prompts/`](../../assets/_prompts/README.md).** That folder has one editable file per asset, with save paths and a compile/sync workflow. The shared blocks in [`assets/_prompts/_style.md`](../../assets/_prompts/_style.md) are the canonical copy; the blocks below are for reference.

**How to use it:** every image prompt is built from three parts:

```
[STYLE BLOCK]  +  [ASSET TEMPLATE, filled in]  +  [NEGATIVE BLOCK]
```

Copy the style and negative blocks word for word, and change only the bracketed fields. When in doubt, attach the board image as a style reference.

---

## 1. Shared blocks

### Painterly style block

```
Hand-painted gouache illustration with visible brushwork and subtle paper texture,
bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep
forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue
(#486E8B) and sage (#748056). Coastal golf scenery: rugged cliffs, ocean, windswept
cypress trees, wildflowers in orange, pink and yellow. A small orange flag pennant is
the only bright accent. Premium, crafted, collectible feel.
```

### Engraved style block (scorecard art, emblems)

```
Fine pen-and-ink engraving with cross-hatching, single dark ink color (#22281F) on
aged cream paper (#EFE2C8), vintage etching style, generous negative space, no color fills.
```

### Negative block (append to every prompt)

```
No text other than specified, no app name, no real golf course logos or trademarks,
no photorealism, no 3D render look, no neon or saturated greens, no pure white
background, no people, no watermark, no signature.
```

---

## 2. Course collectibles

The board defines **five collectible items** per course. All of them share the course's signature scene (by default, the lone cypress).

| Item | Silhouette | Material read (from board) |
| --- | --- | --- |
| **Bag tag** | Rounded rectangle with a strap loop | Fairway-green stitched leather; course name embossed in gold caps under the gold flag emblem |
| **Ball marker** | Circle | Gold/bronze coin rim with a painted enamel scene inside |
| **Pitch marker** (repair tool) | Two-prong divot tool | Brass; the scene is etched or enameled on the round head |
| **Patch** | Rounded shield/hexagon | Embroidered; stitched gold border; the course name in an arc banner across the bottom |
| **Pin** | A mini putting green with a flag | Enamel lapel pin; green with a bunker; orange pennant |

On the course detail screen these appear as a row; collecting **all items** for a course earns *Course Collector* (§4).

### Collectible prompt template

```
[PAINTERLY STYLE BLOCK]
A single golf [ITEM: "leather bag tag" | "ball marker coin" | "brass pitch marker
divot tool" | "embroidered patch" | "enamel flag pin"] collectible for a golf course
called "[COURSE NAME]". It shows [SIGNATURE SCENE, default "a lone windswept cypress
on a coastal cliff above the sea"]. [Bag tag / patch only: the words "[COURSE NAME]"
in gold serif capitals.] [TIER LINE from §3, ball marker only]
Centered, front-facing product view, soft even light with a subtle drop shadow,
isolated on a transparent background, object fills ~85% of the frame.
[NEGATIVE BLOCK]
```

### Specs

- **Master:** 1024×1024 PNG, transparent, centered, about 8% padding.
- **Exports:** @1x 160 / @2x 320 / @3x 480 px; the course-detail row thumbnail is 64pt.
- Every item must still be recognizable at **48pt**.
- The only text allowed on items is the course name (bag tag, patch). Never the app name.

---

## 3. Tiers

**Only the ball marker is tiered.** The ball marker is the "I played here" collectible; its rim shows your tier, set by your **best 18** at the course (config: `TIERS` in `src/data/config/game.ts`). Playing a round earns the **untiered** marker (plain pewter rim), even over 100. The patch, pitch marker, bag tag and pin are **per-course achievements with one fixed finish (no tiers)**.

| Tier | Earned by | Material line for prompts |
| --- | --- | --- |
| *(untiered)* | Play a round | `plain brushed pewter coin rim, matte enamel` |
| **Bronze** | Break 100 | `warm antique bronze coin rim, matte enamel, light patina` |
| **Silver** | Break 90 | `polished sterling silver rim, fine engraved line border, cool satin finish` |
| **Gold** | Break 80 | `bright polished gold double rim, fine engraved border, glossy enamel` |
| **Platinum** | Even par or better | `brilliant platinum double rim, pearlescent sheen, engraved laurel border, small star` |

- **The scene is identical across tiers.** Generate the untiered marker first, then make each tier by editing it (img2img) so the scene doesn't drift.
- Tiers must be told apart without color: the engraved border (Silver), double rim (Gold), and star (Platinum) also survive color blindness and small sizes.

### Per-course collectibles

Each course has a collectible **set**: the ball marker (play the course, tiered) plus four achievements (pitch marker, bag tag, patch, pin), which a course can customize in `src/data/config/collectibles.json` by removing items, overriding an item's name or rule, or adding course-specific items (any of the five art shapes). `npm run art:prompts` adds prompt sections for added items automatically.

## 4. Achievement badges

**Form (from the board):** an arched-top shield with a gold rim and a painted landscape scene inside. A **fairway ribbon banner** wraps across the lower edge with the badge name in cream serif caps. A one-line rule caption sits under the badge in the UI, as text rather than art.

### Badge prompt template

```
[PAINTERLY STYLE BLOCK]
An achievement badge shaped like an arched-top shield with an antique gold rim.
Inside: [EMBLEM SCENE]. A deep forest green ribbon banner wraps across the bottom with
the words "[BADGE NAME]" in cream serif capitals. Front-facing, centered, isolated on
a transparent background.
[NEGATIVE BLOCK]
```

### Badge set (from the board)

| Badge | Rule | Emblem scene |
| --- | --- | --- |
| Course Explorer | Play 25 unique courses | Green with a red flag, pines, distant hills |
| Break 80 | Shoot a round under 80 | Scorecard with a pencil, "80" handwritten, laurel leaves |
| Course Collector | Complete a full course collection (all items) | Golf bag with clubs, sunset sky |
| Parks & Links | Play 5 courses in National Parks | Snowy mountains, pines, a fairway valley |
| Golf Traveler | Play courses in 10 states | Wooden signpost with arrows, rolling hills, mountains |

New badges reuse the same template and form.

- **Locked state** (*proposed*): desaturated, at 40% opacity, with a lock glyph added in UI code, not baked into the art.
- **Specs:** 1024×1024 transparent master; exports at 96/192/288 px (grid) and 240/480/720 px (detail). The ribbon text must be legible at 96px.

---

## 5. Course hero & thumbnail art

```
[PAINTERLY STYLE BLOCK]
Wide landscape of a golf hole: [DESCRIPTION, e.g. "a green on a sandstone cliff top
above the ocean, a lighthouse on a distant headland, windswept cypress, wildflowers in
the foreground"]. Eye-level view, generous sky in the upper third for overlaid text.
[NEGATIVE BLOCK]
```

- **Hero:** 1290×860 (3:2) with a calm upper third, because the home greeting and stat tiles overlay it.
- **Thumbnail:** a 2:1 crop (640×320) for Recent Rounds cards.

---

## 6. Scorecard keepsake art

```
[ENGRAVED STYLE BLOCK]
A panoramic engraving of [COURSE SCENE, e.g. "a windswept cypress on a rocky point
above crashing surf, distant shoreline"], low horizon, wide format for the bottom
third of a vintage scorecard.
[NEGATIVE BLOCK]
```

- **Engraving:** 1200×400 transparent PNG, multiplied onto the paper in code.
- **Header emblem:** a small engraved tree, 256×256 transparent PNG.
- The scorecard's grid, text and scores are **built in UI code, never generated**.

---

## 7. Sample courses for mockups

Use fictional courses in public mockups and marketing. All of them fit the board's coastal look.

| Sample course | Signature scene |
| --- | --- |
| Harbor Bluff Golf Links | Lone cypress on a cliff, lighthouse on the headland |
| Seawatch Point | Cliff-top green above crashing surf, wildflowers |
| Cypress Hollow | Twin cypresses framing a green, ocean beyond |

---

## 8. App icon

- 1024×1024 PNG, **no transparency, no rounded corners** (iOS masks it).
- A fairway background, with the flag + swoosh-green emblem in gold and cream. No text.
- Must read at 60px. Provide dark and tinted variants.

---

## 9. File & naming conventions

Finished art goes in **`assets/art/`**, at the exact path named in each prompt file's **Save as:** line. The full tree is in [assets/_prompts/README.md](../../assets/_prompts/README.md#where-files-go). After adding images, run `npm run art:sync` to register them with the app.

- Slugs are kebab-case (`keney-park`, `break-80`). Course ids match `src/data/seed/courses.ct.json`.
- Record notable generations (tool, model, seed, and any prompt tweaks) in the relevant prompt file, so it can be regenerated.

## 10. Review checklist

- [ ] It matches the board: painterly gouache or engraved ink, coastal light, and the cypress motif where relevant.
- [ ] It uses only palette colors, plus the orange pennant in artwork.
- [ ] It has no app name, real logos or unintended text, and the text it does have is spelled right.
- [ ] It reads at the smallest export size.
- [ ] Tier variants keep the same scene and differ by more than hue.
- [ ] It's transparent, centered, with consistent padding where required.
- [ ] It's saved at its **Save as:** path and `npm run art:sync` was run.
