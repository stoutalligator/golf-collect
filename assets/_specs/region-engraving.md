# Region scorecard engraving

**Group:** Regions  ·  **Prompt:** [regions/](../_prompts/regions/)

**Replaces:** The vector engraved strip on keepsake scorecards.

## Requirements

| | |
|---|---|
| **Final size** | **1200 × 400 px (3:1), transparent** |
| **Request in your image tool** | aspect ratio **3:1 wide (if unavailable: 16:9 or 2:1)**, generate at 1536 × 512 (3:1), or 1792 × 1024 (16:9), on solid cream paper |
| **Then** | Send to Claude: the cream paper is keyed out to transparency (keeping the ink grain), cropped to 3:1 around the drawing and sized to 1200 × 400. |
| **Format** | PNG with **transparent** background (laid over the paper) |
| **Export** | PNG-32, sRGB, 8-bit per channel **with alpha**: transparent background (and transparent window for frames). No white halo at the edges. |
| **File size** | ≤ 500 KB |
| **Files to make** | 1 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Keepsake scorecard, bottom | full card width (~327 pt) at 3:1 | [05 Scorecard](../../docs/screenshots/05-scorecard.png) |

## Safe zone & composition

A low horizon across the full width; leave the top ~25% empty (it sits just under the "Total" line). The drawing should span edge to edge so the strip feels continuous.

## Notes

**Style:** the Ink sketch block (`{{INK_SKETCH}}` in `_style.md`), matching the scorecard tree emblem: loose forest-green field-journal linework on cream, one small orange accent (the flag pennant). Attach the tree emblem as the reference image.

## Acceptance checklist

- [ ] Matches the tree emblem linework (side by side, one hand drew both).
- [ ] Forest-green ink plus a single small orange pennant.
- [ ] Wide and low; nothing important in the top quarter.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/regions/new-england/scorecard-engraving.png`  (New England: used by 16 course(s))

  ```text
  Hand-drawn minimalist ink illustration in a loose vintage field-journal sketch style. Drawn with expressive, slightly imperfect forest-green ink strokes on a warm cream paper background. Organic outlines, varied line weight with occasional rough or broken edges, sparse directional hatching, subtle ink grain, and minimal shading. Simple, recognizable silhouettes with very little detail, casually hand-sketched with confident but imperfect strokes. Deep forest green (#1F3D2F) for the primary linework, warm cream (#F2E6CF) for the background, and a restrained muted orange (#BB8B2B) for one small accent. Centered composition with generous negative space. Minimalist, understated, nostalgic and handcrafted, like an illustration from a vintage golf field guide, not a painting or detailed landscape.
  A wide, low panoramic sketch of a golf landscape in New England: a low fieldstone wall running along the fairway, a lone maple and a pair of slender birches, a white clapboard clubhouse small in the distance, soft rolling hills. Long horizontal composition with a low horizon: gentle rolling fairway lines sweeping across the full width, a green with a small flagstick carrying a little orange pennant (the one accent), a few simple tree silhouettes spaced out, and the suggestion of distant hills. Generous empty cream paper above the horizon. Nothing touches the top edge.
  Avoid: photorealism, oil painting or gouache rendering, watercolor washes, detailed painterly landscapes, heavy crosshatching or engraving, dense textures, perfect geometric vector shapes, thick cartoon outlines, 3D rendering, gradients, excessive colors, text, logos, borders, watermarks.
  ```

