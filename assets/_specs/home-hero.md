# Home hero: four seasons (also the Profile banner)

**Group:** Brand  ·  **Prompt:** [brand/brand.md#home-hero-four-seasons](../_prompts/brand/brand.md#home-hero-four-seasons)

**Replaces:** The vector landscape at the top of Home and Profile. One image per season, chosen by today's date.

## Requirements

| | |
|---|---|
| **Final size** | **1290 × 860 px** |
| **Request in your image tool** | aspect ratio **3:2 landscape**, generate at 1536 × 1024 (or any 3:2) |
| **Then** | Downscale to 1290 × 860 (same 3:2 ratio, no cropping). |
| **Format** | PNG, opaque |
| **Export** | PNG, sRGB, 8-bit per channel, **no alpha channel** (flatten onto the background) |
| **File size** | ≤ 1.5 MB each |
| **Files to make** | 4 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Home, top band | 393 × 300 pt (cover) | [02 Home](../../docs/screenshots/02-home.png) |
| Profile, banner | 393 × 190 pt (cover) | [10 Profile](../../docs/screenshots/10-profile.png) |

## Safe zone & composition

Top ~100 pt sits under the status and header bars; the bottom ~60 pt holds the cream greeting and the top of the stat tiles. Keep the subject in the 35–75% height band.

## Notes

**Seasons:** spring Mar–May, summer Jun–Aug, autumn Sep–Nov, winter Dec–Feb (a missing season falls back to any other season). **Make autumn first**, then create the other three by **editing it**, so the composition is identical and only the season changes. **Reference image:** attach your splash painting for brushwork and light, but make it a **different view**. Keep the **lower third darker and calm** in every season: the cream greeting sits there. Preview a season in the web app with `?season=winter`.

## Acceptance checklist

- [ ] Cream greeting text is readable over the lower third in all four seasons.
- [ ] All four share the same composition; only the season changes.
- [ ] Same painted style as the splash, but a distinct view.
- [ ] Subject (green, flag, cliffs) in the middle band; the top ~100 pt is covered by the header.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/home/hero-autumn.png`  (Sep–Nov · make first)

  ```text
  Hand-painted gouache illustration with visible brushwork and subtle paper texture, bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Golf scenery with windswept trees and wildflowers in orange, pink and yellow. A small orange flag pennant is the only bright accent. Premium, crafted, collectible feel.
  Wide landscape looking down a coastal golf hole: a fairway curving along the clifftop toward a green with an orange-pennant flag in the middle distance, rugged cliffs dropping to the ocean on one side, a white lighthouse on a far headland, a single windswept cypress on the opposite side framing the view. Eye-level view from the tee. The upper third is open sky, darkening slightly toward deep forest green at the very top edge. The lower third is calm and darker: shaded fairway and tall grasses in soft shadow, uncluttered, with no bright flowers, so cream text placed over it stays readable.
  Season: early autumn. Golden and russet grasses, a few trees on the far headland turning orange and red, warm low golden light, a crisp clear sky with soft clouds, the ocean a deep slate blue.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/home/hero-winter.png`  (Dec–Feb)

  ```text
  Hand-painted gouache illustration with visible brushwork and subtle paper texture, bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Golf scenery with windswept trees and wildflowers in orange, pink and yellow. A small orange flag pennant is the only bright accent. Premium, crafted, collectible feel.
  Wide landscape looking down a coastal golf hole: a fairway curving along the clifftop toward a green with an orange-pennant flag in the middle distance, rugged cliffs dropping to the ocean on one side, a white lighthouse on a far headland, a single windswept cypress on the opposite side framing the view. Eye-level view from the tee. The upper third is open sky, darkening slightly toward deep forest green at the very top edge. The lower third is calm and darker: shaded fairway and tall grasses in soft shadow, uncluttered, with no bright flowers, so cream text placed over it stays readable.
  Season: late winter on a calm, bright day. A light dusting of snow on the far headland and the cliff tops, pale frosted grass in the middle distance, the cypress deep green, a cool pale blue-gray sky with soft low winter sun. Keep snow out of the lower third, which stays in soft cool shadow.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/home/hero-spring.png`  (Mar–May)

  ```text
  Hand-painted gouache illustration with visible brushwork and subtle paper texture, bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Golf scenery with windswept trees and wildflowers in orange, pink and yellow. A small orange flag pennant is the only bright accent. Premium, crafted, collectible feel.
  Wide landscape looking down a coastal golf hole: a fairway curving along the clifftop toward a green with an orange-pennant flag in the middle distance, rugged cliffs dropping to the ocean on one side, a white lighthouse on a far headland, a single windswept cypress on the opposite side framing the view. Eye-level view from the tee. The upper third is open sky, darkening slightly toward deep forest green at the very top edge. The lower third is calm and darker: shaded fairway and tall grasses in soft shadow, uncluttered, with no bright flowers, so cream text placed over it stays readable.
  Season: spring. Fresh pale-green grass, a few soft pink and white flowering shrubs on the far slopes (kept out of the lower third), a light hazy sky with gentle clouds, fresh morning light, the ocean a soft blue.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/home/hero-summer.png`  (Jun–Aug)

  ```text
  Hand-painted gouache illustration with visible brushwork and subtle paper texture, bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Golf scenery with windswept trees and wildflowers in orange, pink and yellow. A small orange flag pennant is the only bright accent. Premium, crafted, collectible feel.
  Wide landscape looking down a coastal golf hole: a fairway curving along the clifftop toward a green with an orange-pennant flag in the middle distance, rugged cliffs dropping to the ocean on one side, a white lighthouse on a far headland, a single windswept cypress on the opposite side framing the view. Eye-level view from the tee. The upper third is open sky, darkening slightly toward deep forest green at the very top edge. The lower third is calm and darker: shaded fairway and tall grasses in soft shadow, uncluttered, with no bright flowers, so cream text placed over it stays readable.
  Season: high summer. Lush deep-green fairway, a bright clear sky with big cumulus clouds, the ocean a deep sparkling blue, warm late-afternoon light.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

