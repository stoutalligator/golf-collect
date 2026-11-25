# Asset Specification & Generation Guide (v0.2)

*Last updated: November 25, 2026*
*Design source: [board-02-greens-keeper.png](boards/board-02-greens-keeper.png) only.*

This guide keeps every generated or illustrated asset consistent with the Greens Keeper board. Use it alongside [brand-guidelines.md](brand-guidelines.md).

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

From the board: *"Earn higher-level versions based on your best round."* Tiers are shown on the **ball marker**.

| Tier | Board rule (placeholder; lives in config) | Material line for prompts |
| --- | --- | --- |
| **Standard** | Play the course | `warm bronze-gold coin rim, matte enamel, light patina` |
| **Silver** | Beat par *(a course-relative target to be defined)* | `polished silver coin rim, cool satin finish, silvered scene tones` |
| **Gold** | Shoot 75 or better | `bright polished gold coin rim, glossy enamel, rich gold tones` |

- **The scene is identical across tiers.** Generate Standard first, then make Silver and Gold by editing it (img2img) so the scene doesn't drift.
- Tiers must be told apart by more than hue. Add a finer rim engraving for Silver and a double rim for Gold, so the difference survives color blindness and small sizes.
- The rules are placeholders. "Beat par" and "75 or better" need to be scaled for handicap and course difficulty before launch.

---

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

```
assets/
  brand/            emblem, wordmark, app-icon/
  collectibles/
    <course-slug>/  bag-tag.png, ball-marker-{standard|silver|gold}.png,
                    pitch-marker.png, patch.png, pin.png
  badges/           <badge-slug>.png
  courses/
    <course-slug>/  hero.png, thumb.png, scorecard-engraving.png, emblem.png
  _source/          prompts.md + raw generations (not shipped)
```

- Slugs are kebab-case (`harbor-bluff-golf-links`, `break-80`).
- Log every accepted asset's final prompt, model, seed (if available) and date in `assets/_source/prompts.md`.

---

## 10. Review checklist

- [ ] It matches the board: painterly gouache or engraved ink, coastal light, and the cypress motif where relevant.
- [ ] It uses only palette colors, plus the orange pennant in artwork.
- [ ] It has no app name, real logos or unintended text, and the text it does have is spelled right.
- [ ] It reads at the smallest export size.
- [ ] Tier variants keep the same scene and differ by more than hue.
- [ ] It's transparent, centered, with consistent padding where required.
- [ ] The prompt is logged in `assets/_source/prompts.md`.
