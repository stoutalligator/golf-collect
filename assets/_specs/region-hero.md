# Region hero

**Group:** Regions  ·  **Prompt:** [regions/](../_prompts/regions/)

**Replaces:** The vector landscape behind every course in the region.

## Requirements

| | |
|---|---|
| **Final size** | **1290 × 860 px** |
| **Request in your image tool** | aspect ratio **3:2 landscape**, generate at 1536 × 1024 (or any 3:2) |
| **Then** | Downscale to 1290 × 860 (same 3:2 ratio, no cropping). |
| **Format** | PNG, opaque |
| **Export** | PNG, sRGB, 8-bit per channel, **no alpha channel** (flatten onto the background) |
| **File size** | ≤ 1.5 MB |
| **Files to make** | 1 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Course detail, top | 393 × 280 pt (cover) | [04 Course detail](../../docs/screenshots/04-course-detail.png) |
| Home, Recent Rounds card | 361 × 96 pt: a **thin middle strip** | [02 Home](../../docs/screenshots/02-home.png) |
| List thumbnails | 76 × 52 pt | [03 Courses](../../docs/screenshots/03-courses.png) |

## Safe zone & composition

Keep the subject (green, flag, signature trees) in the **center 60% of the width and the 35–75% height band**. The top ~90 pt sits under the back and bookmark buttons.

## Notes

One image represents **every** course in the region, so evoke the region, not one course. Destination courses can override it (see the overrides spec).

## Acceptance checklist

- [ ] Reads as the region at thumbnail size.
- [ ] The middle strip alone reads as a golf scene.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/regions/new-england/hero.png`  (New England: used by 231 course(s))

  ```text
  Hand-painted gouache illustration with visible brushwork and subtle paper texture, bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Golf scenery with windswept trees and wildflowers in orange, pink and yellow. A small orange flag pennant is the only bright accent. Premium, crafted, collectible feel.
  Wide landscape of a golf hole in rolling New England parkland: fairways framed by tall maples, oaks and birches, stone walls, a white clapboard clubhouse in the distance, gentle hills. A green with an orange-pennant flag in the middle distance, eye-level view from the tee, generous open sky in the upper third.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

