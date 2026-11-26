# Standard collectible frames

Every course's collectibles are **composed in the app** from three layers:

1. the region **vignette**, which shows through the frame's window ([regions/](../regions/))
2. one of these **frames**
3. the **course name**, drawn by the app as text

So these frames must have **no scene, no text and no course identity**. Exact window and label positions are in [`src/art/frames.json`](../../../src/art/frames.json) and the [frame spec](../../_specs/collectible-frames.md).

- **Size:** 1024×1024 PNG. Final files have a **transparent background and a transparent window**.
- **Generate on solid magenta (#FF00FF).** Image tools rarely export transparency, so paint the background **and the window** flat pure magenta. Claude keys the magenta out and measures the window, so exact pixel positions don't matter.
- **Label area:** leave it plain (leather, embroidery or enamel with no text). The app writes the name there.

Make the untiered poker-chip ball marker first, then edit it for each tier so the chip stays identical.

---

## Ball marker: untiered (earned by playing a round)

A **poker-chip** ball marker, the classic course souvenir. The center inlay shows the region vignette (added by the app), and the app prints the course name around the **ring band**, so the band must be **smooth and flat**. Tiers change the chip's color and trim.

✅ Made 2026-11-25 (untiered, bronze, silver accepted). Measured: hole radius ≈ 289, ring band ≈ 320–390 on the 1024 canvas.

- **Save as:** `assets/art/collectibles/frames/ball-marker.png`

```prompt
{{PAINTED_OBJECT}}
A single golf ball marker in the style of a classic golf-course souvenir poker chip, seen straight on: a thick round clay chip with eight evenly spaced rectangular edge inserts around the outer rim, a smooth blank ring band inside the inserts (plain, no lettering), and a large perfectly circular center inlay. The center inlay (about 55% of the chip's diameter) is a perfectly flat, solid pure magenta (#FF00FF) disc: an empty hole, with nothing in it. No text, no numbers, no emblem, no scene. Chip body deep forest green (#1F3D2F) with cream (#F2E6CF) edge inserts and a slightly lighter green ring band.
Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
{{NEGATIVE}}
```

## Ball marker: Bronze (break 100)

✅ Made 2026-11-25.

- **Save as:** `assets/art/collectibles/frames/ball-marker-bronze.png`

```prompt
Same poker-chip ball marker as the reference image, identical size, position, edge inserts and flat magenta (#FF00FF) center and background, but the chip body is warm burnished bronze-brown with cream edge inserts and a thin bronze metallic trim ring at the inner edge of the band. No text.
{{NEGATIVE}}
```

## Ball marker: Silver (break 90)

✅ Made 2026-11-25.

- **Save as:** `assets/art/collectibles/frames/ball-marker-silver.png`

```prompt
Same poker-chip ball marker as the reference image, identical size, position, edge inserts and flat magenta (#FF00FF) center and background, but the chip body is pearl silver-gray with white edge inserts and a fine polished silver trim ring at the inner edge of the band. No text.
{{NEGATIVE}}
```

## Ball marker: Gold (break 80)

⚠ Redo: the first version had ridges across the ring band, which broke up the course-name text.

- **Save as:** `assets/art/collectibles/frames/ball-marker-gold.png`

```prompt
Same poker-chip ball marker as the reference image, identical size, position, edge inserts and flat magenta (#FF00FF) center and background, but the chip body is rich antique gold with deep forest green edge inserts. The ring band between the center inlay and the edge inserts must stay one smooth, flat, evenly colored surface (the app prints the course name on it): no ridges, grooves, rings, bevels or texture inside the band; trim lines only at its very inner and outer edges. Mark the gold tier with a thin polished gold trim line at the inner edge of the band and another at the outer edge (double trim). No text.
{{NEGATIVE}}
```

## Ball marker: Platinum (even par or better)

Optional redo: the first version's trim rings crowd the band slightly.

- **Save as:** `assets/art/collectibles/frames/ball-marker-platinum.png`

```prompt
Same poker-chip ball marker as the reference image, identical size, position, edge inserts and flat magenta (#FF00FF) center and background, but the chip body is lustrous ivory-platinum with a subtle pearlescent sheen and deep forest green edge inserts. The ring band between the center inlay and the edge inserts must stay one smooth, flat, evenly colored surface (the app prints the course name on it): no ridges, grooves, rings, bevels or texture inside the band; trim lines only at its very inner and outer edges. Thin polished platinum trim lines at the inner and outer edges of the band, and one small inlaid star on the outer rim at the top. No text.
{{NEGATIVE}}
```

---

## Pitch marker

Window: the hole in the round head (measured from the art).

- **Save as:** `assets/art/collectibles/frames/pitch-marker.png`

```prompt
{{PAINTED_OBJECT}}
A single brass golf pitch marker divot tool standing upright and filling the height of the square: two straight prongs below and a large round head on top (the head is about 45% of the tool's height). The middle of the round head is a large perfectly flat, solid pure magenta (#FF00FF) disc (an empty hole about 70% of the head's diameter), surrounded by a polished brass rim. No text, no scene.
Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
{{NEGATIVE}}
```

## Patch

Window: the shield interior. Label: the blank banner across the bottom (the app writes the course name there). Both measured from the art.

- **Save as:** `assets/art/collectibles/frames/patch.png`

```prompt
{{PAINTED_OBJECT}}
A single embroidered patch shaped like a rounded heraldic shield with a thick stitched antique-gold border and visible thread texture. The inside of the shield is a perfectly flat, solid pure magenta (#FF00FF) area: an empty window. Across the lower part, a deep forest green embroidered banner ribbon is left completely blank: no text and no letters.
Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
{{NEGATIVE}}
```

## Bag tag

No window. Label: the blank lower half (the app writes the course name in two lines). Measured from the art.

- **Save as:** `assets/art/collectibles/frames/bag-tag.png`

```prompt
{{PAINTED_OBJECT}}
A single golf bag tag: a tall rounded rectangle of deep forest green stitched leather with a gold stitched border, a brown leather strap loop at the top, and a small embossed gold golf-flag emblem in the upper middle. The lower half of the tag is plain blank leather: no text and no letters.
Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
{{NEGATIVE}}
```

## Pin

No window, no label (the same pin for every course).

- **Save as:** `assets/art/collectibles/frames/pin.png`

```prompt
{{PAINTED_OBJECT}}
A single enamel lapel pin shaped like a tiny putting green with a sand bunker and a flagstick with an orange pennant, gold metal edges, glossy enamel, small and charming. No text.
Centered, front-facing, straight-on product view with soft even light. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
{{NEGATIVE}}
```
