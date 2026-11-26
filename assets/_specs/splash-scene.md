# Splash scene (portrait painting)

**Group:** Brand  ·  **Prompt:** [brand/brand.md#splash-scene-portrait](../_prompts/brand/brand.md#splash-scene-portrait)

**Replaces:** The landscape placeholder with a cream wash.

## Requirements

| | |
|---|---|
| **Final size** | **1179 × 2556 px** |
| **Request in your image tool** | aspect ratio **9:16 portrait (tallest most tools allow)**, generate at 1152 × 2048 (or any 9:16) |
| **Then** | Upscale to 1438 × 2556 (keeps 9:16), then crop to 1179 × 2556 by trimming ~130 px from each side. Keep the subject inside the center 1179 px. |
| **Format** | PNG, opaque |
| **Export** | PNG, sRGB, 8-bit per channel, **no alpha channel** (flatten onto the background) |
| **File size** | ≤ 2 MB |
| **Files to make** | 1 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Launch overlay, full screen | 393 × 852 pt (cover) | [01 Splash](../../docs/screenshots/01-splash.png) |

## Safe zone & composition

Top **45%** is calm, light sky: the emblem (y ≈ 110–190 pt), the wordmark (≈ 200–300 pt) and the tagline (≈ 310–345 pt) sit there in forest green. Top 54 pt: the status bar. Keep the subject in the lower half.

## Acceptance checklist

- [ ] Forest-green text is readable over the sky.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/brand/splash-scene.png`

  ```text
  Hand-painted gouache illustration with visible brushwork and subtle paper texture, bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Golf scenery with windswept trees and wildflowers in orange, pink and yellow. A small orange flag pennant is the only bright accent. Premium, crafted, collectible feel.
  Tall portrait composition of a coastal golf landscape: the upper half is a calm, pale warm-cream sky with soft clouds (left nearly empty for a title), the lower half shows rugged cliffs dropping to a blue ocean, a white lighthouse on a distant headland, a golf green with an orange-pennant flag, a windswept cypress, and wildflowers in the foreground at the bottom.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

