# Emblem: shield + laurels (two versions)

**Group:** Brand  ·  **Prompt:** [brand/brand.md#emblem-for-light-backgrounds](../_prompts/brand/brand.md#emblem-for-light-backgrounds)

**Replaces:** The vector flag-and-swoosh mark.

## Requirements

| | |
|---|---|
| **Final size** | **1024 × 1024 px** |
| **Request in your image tool** | aspect ratio **1:1**, generate at 1024 × 1024 (or larger, square) |
| **Then** | None if generated at 1024; otherwise downscale to 1024 × 1024. Magenta-background art: send to Claude for keying (and splitting, for sheets). |
| **Format** | PNG with **transparent** background (generate on flat magenta; Claude keys it) |
| **Export** | PNG-32, sRGB, 8-bit per channel **with alpha**: transparent background (and transparent window for frames). No white halo at the edges. |
| **File size** | ≤ 500 KB each |
| **Files to make** | 2 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Home header, left of the wordmark (on-dark version) | 34 pt on fairway | [02 Home](../../docs/screenshots/02-home.png) |
| Profile avatar (light version) | 64 pt on cream | [10 Profile](../../docs/screenshots/10-profile.png) |

## Safe zone & composition

Square composition, emblem centered, filling ~85%. Bold, flat shapes with few details: it must read at 34 pt.

## Notes

Adopted 2026-11-25 from the splash painting: a shield with a flag on a hill, pines and mountains, flanked by gold laurels. **Reference image:** the splash (for the light version), then edit the light version into the on-dark version so the shapes match exactly. The app picks the version by background and falls back to the other if one is missing.

## Acceptance checklist

- [ ] Reads at 34 pt on `#1F3D2F` (on-dark version) and at 64 pt on `#F2E6CF` (light version).
- [ ] Both versions have identical shapes; only colors differ.
- [ ] No text.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/brand/emblem.png`  (for light backgrounds: forest-green shield, cream inside, gold laurels)

  ```text
  A single flat, crisp brand emblem, centered, front-facing: a heraldic shield emblem: inside the shield, a simple flat-color scene of a golf flag on a rounded green hill with two small pine trees on the left and soft mountain outlines behind; two gold laurel branches curve up either side of the shield's lower half. Clean, bold, flat emblem shapes (like an embroidered club crest or an enamel pin), few details, so it reads at very small sizes. Colors: deep forest green (#1F3D2F) shield with a thin cream (#F2E6CF) inner border, the inner scene in forest green on cream, laurels in antique gold (#BB8B2B). No text, no letters.
  The emblem fills about 85% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/brand/emblem-on-dark.png`  (for dark backgrounds: cream/gold shield; edit of the first)

  ```text
  The same brand emblem as the reference image with identical shapes and layout, recolored for use on a dark forest-green background: the shield is warm cream (#F2E6CF) with a thin antique-gold (#BB8B2B) border, the inner scene in deep forest green (#1F3D2F) on cream, the laurels in bright antique gold. No text, no letters.
  The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

