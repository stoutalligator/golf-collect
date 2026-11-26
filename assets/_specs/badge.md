# Achievement badges

**Group:** Badges  ·  **Prompt:** [badges/badges.md](../_prompts/badges/badges.md)

**Replaces:** The vector shield badges.

## Requirements

| | |
|---|---|
| **Final size** | **1024 × 1024 px** |
| **Request in your image tool** | aspect ratio **1:1**, generate at 1024 × 1024 (or larger, square) |
| **Then** | None if generated at 1024; otherwise downscale to 1024 × 1024. Magenta-background art: send to Claude for keying (and splitting, for sheets). |
| **Format** | PNG with **transparent** background |
| **Export** | PNG-32, sRGB, 8-bit per channel **with alpha**: transparent background (and transparent window for frames). No white halo at the edges. |
| **File size** | ≤ 500 KB each |
| **Files to make** | 13 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Achievements list | 64 pt (dimmed in code when locked) | [08 Achievements](../../docs/screenshots/08-achievements.png) |
| Profile, Recent Achievement | 56 pt | [10 Profile](../../docs/screenshots/10-profile.png) |

## Safe zone & composition

Shield centered with ~6% padding; the ribbon spans the lower third and is **left blank**: the app writes the badge name on it (measured per badge).

## Notes

**Generate on solid magenta (#FF00FF)**, singly or as sheets (A: Game · B: Courses & Collection · C: Sim); Claude keys, splits and measures each ribbon. Same shield silhouette, gold rim and ribbon shape on every badge; only the inner scene changes. Course badges have a forest-green ribbon, sim badges slate blue.

## Acceptance checklist

- [ ] Ribbon is blank (no letters).
- [ ] All badges share the same shield silhouette, rim and ribbon shape.
- [ ] Scene reads at 64 pt.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/badges/break-100.png`  (Break 100)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a paper golf scorecard with a pencil and the number "100" written on the card, on a green background. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/break-90.png`  (Break 90)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a paper golf scorecard with a pencil and the number "90" written on it, sprigs of laurel. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/break-80.png`  (Break 80)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a paper golf scorecard with a pencil and the number "80" written on it, framed by golden laurel leaves. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/first-birdie.png`  (First Birdie)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a small songbird perched on a flagstick above a putting green. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/100-birdies.png`  (100 Birdies)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a flock of small birds rising over a green with an orange-pennant flag, golden light. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/course-explorer.png`  (Course Explorer)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a putting green with an orange-pennant flag, dark pine trees, distant rolling hills. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/state-traveler.png`  (State Traveler)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a gold silhouette map of the United States on a slate blue field. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/golf-traveler.png`  (Golf Traveler)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a weathered wooden signpost with arrows pointing different directions, rolling green hills and distant mountains. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/parks-and-links.png`  (Parks & Links)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: snow-capped mountain peaks, dark pine forest, a fairway winding through a valley. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/course-collector.png`  (Course Collector)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a classic golf bag with clubs standing against a warm sunset sky and green hills. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/keepsake-50.png`  (Keepsake Keeper)

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: an open wooden keepsake box holding golf ball markers, a bag tag and an embroidered patch. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/sim-break-80.png`  (Sim Break 80 (slate ribbon))

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a golf ball on a tee in front of a glowing simulator screen showing a painted fairway, the number "80" small in the corner of the screen. A slate blue (#486E8B) ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/sim-explorer.png`  (Sim Explorer (slate ribbon))

  ```text
  Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
  A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: several small framed screens each showing a different painted golf hole (coast, desert, mountain), arranged like a gallery wall. A slate blue (#486E8B) ribbon banner wraps across the lower third and is completely blank, with no letters.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

