# App icon

**Group:** Brand  ·  **Prompt:** [brand/brand.md#app-icon](../_prompts/brand/brand.md#app-icon)

**Replaces:** The default Expo icon (`assets/images/icon.png`).

## Requirements

| | |
|---|---|
| **Final size** | **1024 × 1024 px** |
| **Request in your image tool** | aspect ratio **1:1**, generate at 1024 × 1024 (or larger, square) |
| **Then** | None if generated at 1024; otherwise downscale to 1024 × 1024. Magenta-background art: send to Claude for keying (and splitting, for sheets). |
| **Format** | PNG, **no transparency**, square corners (iOS applies the rounded mask) |
| **Export** | PNG, sRGB, 8-bit per channel, **no alpha channel** (flatten onto the background) |
| **File size** | ≤ 1 MB |
| **Files to make** | 1 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| iPhone home screen | 60 pt | — |
| Spotlight / Settings | 40 pt / 29 pt | — |
| App Store | 1024 px | — |

## Safe zone & composition

Keep the emblem within the center ~70%. iOS masks the corners, so nothing important near them.

## Notes

The cream-and-gold shield emblem centered on forest green, filling ~70%. **Reference image:** `emblem-on-dark.png`. `npm run art:sync` copies it to `assets/images/icon.png`, which `app.json` uses. It shows on a phone after a new build (EAS), not in Expo Go.

## Acceptance checklist

- [ ] Reads clearly at 60 px on a light and on a dark wallpaper.
- [ ] No text.
- [ ] Opaque, square corners, nothing near the corners.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/brand/app-icon.png`

  ```text
  An app icon: a deep forest green (#1F3D2F) square with a subtle paper texture and a soft hand-painted feel. Centered on it, the cream-and-gold shield emblem from the reference image (shield with a golf flag on a hill, pines and mountains inside, gold laurels either side), scaled so the emblem fills about 70% of the square with generous even margins. Crisp, simple shapes that read at very small sizes. No text, no letters, square corners, nothing near the corners.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

