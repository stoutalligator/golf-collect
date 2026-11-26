# Standard collectible frames

**Group:** Collectibles  ·  **Prompt:** [collectibles/frames.md](../_prompts/collectibles/frames.md)

**Replaces:** The vector collectibles. The app layers the region vignette **under** the frame and draws the course name **on top**.

## Requirements

| | |
|---|---|
| **Final size** | **1024 × 1024 px** |
| **Request in your image tool** | aspect ratio **1:1**, generate at 1024 × 1024 (or larger, square) |
| **Then** | None if generated at 1024; otherwise downscale to 1024 × 1024. Magenta-background art: send to Claude for keying (and splitting, for sheets). |
| **Format** | PNG with **transparent** background **and a transparent window** |
| **Export** | PNG-32, sRGB, 8-bit per channel **with alpha**: transparent background (and transparent window for frames). No white halo at the edges. |
| **File size** | ≤ 600 KB each |
| **Files to make** | 9 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Collection grid | 118 pt | [06 Collection](../../docs/screenshots/06-collection.png) |
| Course detail row | 78 pt | [04 Course detail](../../docs/screenshots/04-course-detail.png) |
| Collectible detail | 230 pt; tier row 58 pt | [07 Collectible detail](../../docs/screenshots/07-collectible-detail.png) |

## Safe zone & composition

- **ball-marker**: **transparent circle**, center (512, 512), radius 292; ring label band between radius 314 and 396 around the center: keep it a **plain blank band**; the app prints the course name on the top arc and town · state on the bottom arc
- **pitch-marker**: **transparent shield**, bounding box (332, 155)–(691, 511); exact outline: `M500 155 L466 161 L447 167 L433 173 L422 179 L412 185 L404 191 L397 197 L390 203 L384 209 L379 215 L373 221 L368 227 L364 233 L360 239 L356 245 L353 251 L350 257 L347 263 L345 269 L343 275 L340 281 L338 287 L337 293 L336 299 L334 305 L334 311 L333 317 L332 323 L332 329 L332 335 L332 341 L333 347 L334 353 L334 359 L336 365 L336 371 L338 377 L340 383 L341 389 L344 395 L347 401 L349 407 L352 413 L355 419 L359 425 L362 431 L366 437 L371 443 L376 449 L381 455 L387 461 L393 467 L400 473 L408 479 L417 485 L427 491 L438 497 L455 503 L479 509 L488 511 L536 511 L545 509 L569 503 L585 497 L596 491 L605 485 L615 479 L623 473 L630 467 L637 461 L642 455 L647 449 L652 443 L657 437 L661 431 L665 425 L668 419 L671 413 L674 407 L677 401 L680 395 L682 389 L683 383 L685 377 L687 371 L688 365 L689 359 L690 353 L691 347 L691 341 L691 335 L691 329 L691 323 L691 317 L690 311 L689 305 L688 299 L687 293 L685 287 L683 281 L682 275 L679 269 L676 263 L673 257 L671 251 L667 245 L664 239 L660 233 L655 227 L650 221 L644 215 L639 209 L633 203 L626 197 L618 191 L610 185 L600 179 L589 173 L576 167 L557 161 L526 155 Z`; no label (no course name)
- **patch**: **transparent shield**, bounding box (178, 152)–(855, 622); exact outline: `M512 152 L500 158 L488 164 L475 170 L462 176 L449 182 L435 188 L420 194 L404 200 L386 206 L371 212 L350 218 L330 224 L306 230 L279 236 L249 242 L211 248 L185 254 L182 260 L181 266 L181 272 L180 278 L180 284 L180 290 L180 296 L180 302 L179 308 L180 314 L179 320 L178 326 L179 332 L179 338 L179 344 L179 350 L179 356 L180 362 L180 368 L180 374 L180 380 L180 386 L180 392 L181 398 L182 404 L182 410 L183 416 L183 422 L184 428 L185 434 L185 440 L187 446 L187 452 L189 458 L189 464 L191 470 L192 476 L194 482 L194 488 L196 494 L198 500 L199 506 L201 512 L202 518 L204 524 L206 530 L207 536 L210 542 L211 548 L213 554 L215 560 L217 566 L220 572 L222 578 L225 584 L227 590 L230 596 L232 602 L235 608 L237 614 L242 620 L245 622 L787 622 L789 620 L793 614 L796 608 L799 602 L802 596 L805 590 L808 584 L811 578 L813 572 L815 566 L817 560 L820 554 L822 548 L824 542 L826 536 L828 530 L830 524 L831 518 L833 512 L835 506 L837 500 L839 494 L840 488 L841 482 L842 476 L843 470 L844 464 L846 458 L848 452 L848 446 L849 440 L849 434 L850 428 L851 422 L851 416 L853 410 L853 404 L853 398 L854 392 L854 386 L854 380 L855 374 L855 368 L855 362 L855 356 L855 350 L855 344 L855 338 L855 332 L855 326 L855 320 L855 314 L855 308 L855 302 L854 296 L853 290 L853 284 L853 278 L853 272 L852 266 L852 260 L849 254 L820 248 L785 242 L754 236 L724 230 L700 224 L680 218 L660 212 L644 206 L626 200 L609 194 L596 188 L582 182 L568 176 L555 170 L542 164 L530 158 L518 152 Z`; label: 1 line(s) centered at x 512, y 688, up to 500 px wide; keep it **blank**
- **bag-tag**: no window; label: 2 line(s) centered at x 512, y 767, up to 395 px wide; keep it **blank**
- **pin**: no window; no label (no course name)

Coordinates are in pixels on the 1024 canvas (source of truth: `src/art/frames.json`). If your painted frame ends up slightly different, adjust the JSON to match the art rather than repainting.

## Notes

No scene, no text, no course identity: these frames are shared by every course. Ball-marker tiers must be the same coin with a different rim (Silver: engraved border; Gold: double rim; Platinum: double rim plus a star), so they differ by more than color.

## Acceptance checklist

- [ ] The window is truly transparent (check on a dark background).
- [ ] The label areas (patch banner, lower bag tag) are blank.
- [ ] All five ball markers line up exactly (same size and position).
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

- [ ] `assets/art/collectibles/frames/ball-marker.png`  (untiered: play a round)

  ```text
  Hand-painted gouache rendering of a single crafted keepsake object with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like a cherished souvenir. No landscape, no scenery and no sky anywhere in the image.
  A single golf ball marker in the style of a classic golf-course souvenir poker chip, seen straight on: a thick round clay chip with eight evenly spaced rectangular edge inserts around the outer rim, a smooth blank ring band inside the inserts (plain, no lettering), and a large perfectly circular center inlay. The center inlay (about 55% of the chip's diameter) is a perfectly flat, solid pure magenta (#FF00FF) disc: an empty hole, with nothing in it. No text, no numbers, no emblem, no scene. Chip body deep forest green (#1F3D2F) with cream (#F2E6CF) edge inserts and a slightly lighter green ring band.
  Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/collectibles/frames/ball-marker-bronze.png`  (break 100)

  ```text
  Same poker-chip ball marker as the reference image, identical size, position, edge inserts and flat magenta (#FF00FF) center and background, but the chip body is warm burnished bronze-brown with cream edge inserts and a thin bronze metallic trim ring at the inner edge of the band. No text.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/collectibles/frames/ball-marker-silver.png`  (break 90)

  ```text
  Same poker-chip ball marker as the reference image, identical size, position, edge inserts and flat magenta (#FF00FF) center and background, but the chip body is pearl silver-gray with white edge inserts and a fine polished silver trim ring at the inner edge of the band. No text.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/collectibles/frames/ball-marker-gold.png`  (break 80)

  ```text
  Same poker-chip ball marker as the reference image, identical size, position, edge inserts and flat magenta (#FF00FF) center and background, but the chip body is rich antique gold with deep forest green edge inserts. The ring band between the center inlay and the edge inserts must stay one smooth, flat, evenly colored surface (the app prints the course name on it): no ridges, grooves, rings, bevels or texture inside the band; trim lines only at its very inner and outer edges. Mark the gold tier with a thin polished gold trim line at the inner edge of the band and another at the outer edge (double trim). No text.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/collectibles/frames/ball-marker-platinum.png`  (even par or better)

  ```text
  Same poker-chip ball marker as the reference image, identical size, position, edge inserts and flat magenta (#FF00FF) center and background, but the chip body is lustrous ivory-platinum with a subtle pearlescent sheen and deep forest green edge inserts. The ring band between the center inlay and the edge inserts must stay one smooth, flat, evenly colored surface (the app prints the course name on it): no ridges, grooves, rings, bevels or texture inside the band; trim lines only at its very inner and outer edges. Thin polished platinum trim lines at the inner and outer edges of the band, and one small inlaid star on the outer rim at the top. No text.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/collectibles/frames/pitch-marker.png`

  ```text
  Hand-painted gouache rendering of a single crafted keepsake object with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like a cherished souvenir. No landscape, no scenery and no sky anywhere in the image.
  A single brass golf pitch marker divot tool standing upright and filling the height of the square: two straight prongs below and a large round head on top (the head is about 45% of the tool's height). The middle of the round head is a large perfectly flat, solid pure magenta (#FF00FF) disc (an empty hole about 70% of the head's diameter), surrounded by a polished brass rim. No text, no scene.
  Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/collectibles/frames/patch.png`

  ```text
  Hand-painted gouache rendering of a single crafted keepsake object with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like a cherished souvenir. No landscape, no scenery and no sky anywhere in the image.
  A single embroidered patch shaped like a rounded heraldic shield with a thick stitched antique-gold border and visible thread texture. The inside of the shield is a perfectly flat, solid pure magenta (#FF00FF) area: an empty window. Across the lower part, a deep forest green embroidered banner ribbon is left completely blank: no text and no letters.
  Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/collectibles/frames/bag-tag.png`

  ```text
  Hand-painted gouache rendering of a single crafted keepsake object with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like a cherished souvenir. No landscape, no scenery and no sky anywhere in the image.
  A single golf bag tag: a tall rounded rectangle of deep forest green stitched leather with a gold stitched border, a brown leather strap loop at the top, and a small embossed gold golf-flag emblem in the upper middle. The lower half of the tag is plain blank leather: no text and no letters.
  Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

- [ ] `assets/art/collectibles/frames/pin.png`

  ```text
  Hand-painted gouache rendering of a single crafted keepsake object with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like a cherished souvenir. No landscape, no scenery and no sky anywhere in the image.
  A single enamel lapel pin shaped like a tiny putting green with a sand bunker and a flagstick with an orange pennant, gold metal edges, glossy enamel, small and charming. No text.
  Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
  Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
  ```

