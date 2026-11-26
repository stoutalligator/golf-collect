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
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  A torn fragment of a cream printed golf scorecard with thin forest green printed rules and a few hole columns, a short wooden golf pencil resting across one corner, and the total "99" written by hand in pencil and circled.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/break-90.png`  (Break 90)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  A torn fragment of a cream printed golf scorecard with thin forest green printed rules and a few hole columns, a short wooden golf pencil resting across one corner, and the total "89" written by hand in pencil and circled twice.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/break-80.png`  (Break 80)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  A torn fragment of a cream printed golf scorecard with thin forest green printed rules and a few hole columns, a thin muted-gold foil edge along the torn side, a short wooden golf pencil resting across one corner, and the total "79" written by hand in pencil and circled twice.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/first-birdie.png`  (First Birdie)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  A round enamel lapel pin: a cream enamel disc with a thin muted-gold metal rim, a single small songbird perched on the top of a golf flagstick painted in enamel, a sliver of putting green at the bottom of the disc.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/100-birdies.png`  (100 Birdies)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  A round enamel lapel pin: a cream enamel disc with a thin muted-gold metal rim, a flock of small songbirds in flight crossing the disc above a sliver of green, and the numeral "100" in small forest green enamel along the bottom edge of the disc.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/course-explorer.png`  (Course Explorer)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  An inked round rubber-stamp impression in forest green on a small square of cream passport paper, slightly uneven like a real stamp: a golf flag in the center and the numeral "25" below it, inside a double ring.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/state-traveler.png`  (State Traveler)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  An inked rectangular rubber-stamp impression in slate blue on a small square of cream passport paper, slightly uneven like a real stamp: a small cluster of five simple, unlabeled neighboring US state outlines with a tiny golf flag planted in one of them.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/golf-traveler.png`  (Golf Traveler)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  An inked oval rubber-stamp impression in muted gold on a small square of cream passport paper, slightly uneven like a real stamp: a compass rose behind a golf flag and the numeral "10" at the bottom of the oval.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/parks-and-links.png`  (Parks & Links)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  An inked round rubber-stamp impression in forest green on a small square of cream passport paper, slightly uneven like a real stamp: a simple mountain, a tall pine tree and a golf flag inside a plain ring. Not any official park service emblem or arrowhead shape.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/course-collector.png`  (Course Collector)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  A shallow wooden display tray lined with forest green felt holding exactly five small golf keepsakes in a row, each in its own recess: a round ball marker coin, a pitchfork-shaped divot repair tool, a small leather bag tag with a strap, an embroidered patch and a small enamel pin. Slight three-quarter top view.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/keepsake-50.png`  (Keepsake Keeper)

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  An open wooden keepsake box with a brass hinge and forest green felt lining, filled to the brim with many small round golf ball markers in bronze, silver and gold tones, a few enamel pins and a folded leather bag tag. Slight three-quarter top view.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/sim-break-80.png`  (Sim Break 80 (slate ribbon))

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  In a slate blue (#526B78) and cream palette: a torn fragment of a cream printed golf scorecard clipped to the corner of a small slate-blue rectangular screen that shows a simple painted fairway, the total "79" written by hand in pencil on the card and circled.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/badges/sim-explorer.png`  (Sim Explorer (slate ribbon))

  ```text
  Hand-painted gouache illustration of a single small golf keepsake object that depicts a real golf milestone, visible controlled brushwork and subtle paper texture, warm soft studio light, restrained heritage palette of deep forest green (#173D32), warm cream (#EAE3D3), muted gold (#B49A65), slate blue (#526B78) and sage (#829977). Feels like a cherished physical souvenir from a golf bag or a scorebook, quiet and well made, not a game icon. No shield, no ribbon or banner, no laurels, no stars, no crossed clubs, no wings, no glow or sparkle effects. No words or letters anywhere; numerals only where the description asks for them.
  An inked rectangular rubber-stamp impression in slate blue on a small square of cream paper, slightly uneven like a real stamp: a grid of four tiny golf hole pictures (coastal, desert, mountain, parkland) and the numeral "10" beneath them.
  Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

