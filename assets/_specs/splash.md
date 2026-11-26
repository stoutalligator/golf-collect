# Native splash image

**Group:** Brand  ·  **Prompt:** [brand/brand.md#splash-image](../_prompts/brand/brand.md#splash-image)

**Replaces:** The default Expo splash icon.

## Requirements

| | |
|---|---|
| **Final size** | **1024 × 1024 px** |
| **Request in your image tool** | aspect ratio **1:1**, generate at 1024 × 1024 (or larger, square) |
| **Then** | None if generated at 1024; otherwise downscale to 1024 × 1024. Magenta-background art: send to Claude for keying (and splitting, for sheets). |
| **Format** | PNG with **transparent** background |
| **Export** | PNG-32, sRGB, 8-bit per channel **with alpha**: transparent background (and transparent window for frames). No white halo at the edges. |
| **File size** | ≤ 500 KB |
| **Files to make** | 1 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| iOS launch screen (before the app loads) | 200 pt wide on cream `#F2E6CF` | — |

## Safe zone & composition

Emblem centered, filling ~80%.

## Notes

The light-background emblem (generate on flat magenta; Claude keys it). `npm run art:sync` copies it to `assets/images/splash-icon.png`; visible only in real builds, for a moment before the painted splash.

## Acceptance checklist

- [ ] Reads on cream `#F2E6CF`.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/brand/splash.png`

  ```text
  The light-background brand emblem from the reference image (forest-green shield with a golf flag on a hill, pines and mountains inside, gold laurels either side), centered, filling about 80% of the square. No text, no letters.
  The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

