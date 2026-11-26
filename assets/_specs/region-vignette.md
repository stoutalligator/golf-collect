# Region collectible vignette

**Group:** Regions  ·  **Prompt:** [regions/](../_prompts/regions/)

**Replaces:** The vector scene inside ball markers, pitch markers and patches.

## Requirements

| | |
|---|---|
| **Final size** | **1024 × 1024 px** |
| **Request in your image tool** | aspect ratio **1:1**, generate at 1024 × 1024 (or larger, square) |
| **Then** | None if generated at 1024; otherwise downscale to 1024 × 1024. Magenta-background art: send to Claude for keying (and splitting, for sheets). |
| **Format** | PNG, opaque |
| **Export** | PNG, sRGB, 8-bit per channel, **no alpha channel** (flatten onto the background) |
| **File size** | ≤ 800 KB |
| **Files to make** | 1 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Through the window of ball markers / pitch markers / patches | ~30–160 pt circle or shield crop | [06 Collection](../../docs/screenshots/06-collection.png) |

## Safe zone & composition

**One bold subject, centered and close; not a vista.** A ball marker shows only the center circle (about the middle 70%), and the patch shows most of the square as a shield. Nothing important in the corners. Large simple shapes; the flag and tree must survive shrinking to a small circle.

## Notes

**Style:** thick gouache/oil brushwork matching the region hero. No ink outlines, no watercolor washes, no pen linework. **Attach the region hero as the reference image.** Sky is soft cream-blue, not saturated blue. Quick test before saving: shrink the result to ~60 px and squint; you should still see a tree, a green and a flag.

## Acceptance checklist

- [ ] Same brushwork and light as the region hero (side by side, they look like one set).
- [ ] Still reads at ~60 px / a 40 pt circle: tree, green and flag visible.
- [ ] Square 1:1, full-bleed, no border, no text.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/regions/new-england/vignette.png`  (New England: used by 16 course(s))

  ```text
  Hand-painted gouache illustration with visible brushwork and subtle paper texture, bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Golf scenery with windswept trees and wildflowers in orange, pink and yellow. A small orange flag pennant is the only bright accent. Premium, crafted, collectible feel.
  Thick gouache/oil brushwork matching the reference image: no ink outlines, no watercolor washes, no pen linework.
  A close, centered square composition of a single flaming red-orange maple standing beside a round green with an orange-pennant flag, a low fieldstone wall in front, soft rolling hills behind. Large simple shapes fill the square; the tree, the green and the flag stay clearly readable when the image is shrunk to a small circle. Soft cream-blue sky (not saturated blue). Full-bleed painting with no border, no frame, no text. Square 1:1.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

