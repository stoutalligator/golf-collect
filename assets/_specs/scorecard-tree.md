# Scorecard tree emblem (engraved)

**Group:** Brand  ·  **Prompt:** [brand/brand.md#scorecard-tree-emblem](../_prompts/brand/brand.md#scorecard-tree-emblem)

**Replaces:** The vector line-art cypress.

## Requirements

| | |
|---|---|
| **Final size** | **640 × 512 px (5:4), transparent** |
| **Request in your image tool** | aspect ratio **1:1**, generate at 1024 × 1024 or larger, on solid cream |
| **Then** | Key out the cream paper to transparency (keep the ink grain), crop to the drawing with ~6% padding, and fit it centered on a 640 × 512 canvas. |
| **Format** | PNG with **transparent** background |
| **Export** | PNG-32, sRGB, 8-bit per channel **with alpha**: transparent background (and transparent window for frames). No white halo at the edges. |
| **File size** | ≤ 200 KB |
| **Files to make** | 1 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Keepsake scorecard, top | 84 pt wide | [05 Scorecard](../../docs/screenshots/05-scorecard.png) |
| Course detail, beside the title | 64 pt wide | [04 Course detail](../../docs/screenshots/04-course-detail.png) |

## Safe zone & composition

The drawing centered, filling about 88% of the width with even padding.

## Notes

**Style:** the Ink sketch block (`{{INK_SKETCH}}` in `_style.md`): loose forest-green field-journal linework with one small orange accent. ✅ Done 2026-11-25.

## Acceptance checklist

- [ ] Reads on paper `#EFE2C8` and cream `#F2E6CF` with no halo.
- [ ] Forest-green ink plus at most one small orange accent.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/scorecard/tree-emblem.png`

  ```text
  Hand-drawn minimalist ink illustration in a loose vintage field-journal sketch style. Drawn with expressive, slightly imperfect forest-green ink strokes on a warm cream paper background. Organic outlines, varied line weight with occasional rough or broken edges, sparse directional hatching, subtle ink grain, and minimal shading. Simple, recognizable silhouettes with very little detail, casually hand-sketched with confident but imperfect strokes. Deep forest green (#1F3D2F) for the primary linework, warm cream (#F2E6CF) for the background, and a restrained muted orange (#BB8B2B) for one small accent. Centered composition with generous negative space. Minimalist, understated, nostalgic and handcrafted, like an illustration from a vintage golf field guide, not a painting or detailed landscape.
  A lone windswept tree with a flat, layered canopy standing on a gentle rise at the left, a golf flagstick with a small orange pennant on a green to the right, a few low rolling mounds suggested with hatching. Wide, low composition centered in the square.
  Avoid: photorealism, oil painting or gouache rendering, watercolor washes, detailed painterly landscapes, heavy crosshatching or engraving, dense textures, perfect geometric vector shapes, thick cartoon outlines, 3D rendering, gradients, excessive colors, text, logos, borders, watermarks.
  ```

