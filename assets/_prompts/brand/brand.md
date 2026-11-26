# Brand assets

Design source: the Greens Keeper boards and the splash painting. **Emblem (adopted 2026-11-25): the shield-and-laurel mark from the splash.**

---

## Emblem: for light backgrounds

The official mark (adopted 2026-11-25 from the splash painting): a shield with a flag on a hill, pines and mountains, flanked by gold laurels. Used on cream and light screens (Profile avatar).

- **Save as:** `assets/art/brand/emblem.png`
- **Size:** 1024×1024 PNG. Generate on **solid magenta (#FF00FF)**; Claude keys it to transparency.
- **Reference image:** attach the splash painting (the mark at its top).

```prompt
A single flat, crisp brand emblem, centered, front-facing: a heraldic shield emblem: inside the shield, a simple flat-color scene of a golf flag on a rounded green hill with two small pine trees on the left and soft mountain outlines behind; two gold laurel branches curve up either side of the shield's lower half. Clean, bold, flat emblem shapes (like an embroidered club crest or an enamel pin), few details, so it reads at very small sizes. Colors: deep forest green (#1F3D2F) shield with a thin cream (#F2E6CF) inner border, the inner scene in forest green on cream, laurels in antique gold (#BB8B2B). No text, no letters.
The emblem fills about 85% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
{{NEGATIVE}}
```

## Emblem: for dark backgrounds

The same mark, reversed for the dark green header on Home (and the app icon).

- **Save as:** `assets/art/brand/emblem-on-dark.png`
- **Size:** 1024×1024 PNG. Generate on **solid magenta (#FF00FF)**.
- **Reference image:** the light-background emblem above (edit it so the shapes stay identical).

```prompt
The same brand emblem as the reference image with identical shapes and layout, recolored for use on a dark forest-green background: the shield is warm cream (#F2E6CF) with a thin antique-gold (#BB8B2B) border, the inner scene in deep forest green (#1F3D2F) on cream, the laurels in bright antique gold. No text, no letters.
The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
{{NEGATIVE}}
```

## App icon

- **Save as:** `assets/art/brand/app-icon.png`
- **Size:** 1024×1024 PNG, **no transparency, square corners** (iOS rounds them)
- **Reference image:** the dark-background emblem.
- **Check:** reads clearly at 60px; no text

```prompt
An app icon: a deep forest green (#1F3D2F) square with a subtle paper texture and a soft hand-painted feel. Centered on it, the cream-and-gold shield emblem from the reference image (shield with a golf flag on a hill, pines and mountains inside, gold laurels either side), scaled so the emblem fills about 70% of the square with generous even margins. Crisp, simple shapes that read at very small sizes. No text, no letters, square corners, nothing near the corners.
{{NEGATIVE}}
```

## Native splash image

The brief logo iOS shows before the app loads (on cream), right before the painted splash fades in.

- **Save as:** `assets/art/brand/splash.png`
- **Size:** 1024×1024 PNG. Generate on **solid magenta (#FF00FF)**; shown 200 pt wide centered on cream.

```prompt
The light-background brand emblem from the reference image (forest-green shield with a golf flag on a hill, pines and mountains inside, gold laurels either side), centered, filling about 80% of the square. No text, no letters.
The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
{{NEGATIVE}}
```

---

## Splash scene (portrait)

The full-screen painting behind the GREENS KEEPER wordmark when the app opens (board 03, first phone).

- **Save as:** `assets/art/brand/splash-scene.png`
- **Size:** 1179×2556 PNG (iPhone portrait). Keep the **top 45% calm, light sky**: the emblem, wordmark and tagline sit there in forest green.

```prompt
{{PAINTERLY}}
Tall portrait composition of a coastal golf landscape: the upper half is a calm, pale warm-cream sky with soft clouds (left nearly empty for a title), the lower half shows rugged cliffs dropping to a blue ocean, a white lighthouse on a distant headland, a golf green with an orange-pennant flag, a windswept cypress, and wildflowers in the foreground at the bottom.
{{NEGATIVE}}
```

---

## Home hero (four seasons)

The landscape behind the greeting and stat tiles on Home (also the Profile banner). **One image per season**, chosen by today's date: spring Mar–May, summer Jun–Aug, autumn Sep–Nov, winter Dec–Feb. All four use the **same composition**: make the autumn one first, then make each other season by **editing it** (same view, change only the season). A different view from the splash, in the same painted style; attach the splash as a style reference.

- **Size (all four):** 1290×860 PNG (3:2). Top third calm sky (under the header), subject in the middle band, **lower third darker and calm** (the cream greeting sits there).

### Autumn (Sep–Nov) · make this one first

- **Save as:** `assets/art/home/hero-autumn.png`

```prompt
{{PAINTERLY}}
Wide landscape looking down a coastal golf hole: a fairway curving along the clifftop toward a green with an orange-pennant flag in the middle distance, rugged cliffs dropping to the ocean on one side, a white lighthouse on a far headland, a single windswept cypress on the opposite side framing the view. Eye-level view from the tee. The upper third is open sky, darkening slightly toward deep forest green at the very top edge. The lower third is calm and darker: shaded fairway and tall grasses in soft shadow, uncluttered, with no bright flowers, so cream text placed over it stays readable.
Season: early autumn. Golden and russet grasses, a few trees on the far headland turning orange and red, warm low golden light, a crisp clear sky with soft clouds, the ocean a deep slate blue.
{{NEGATIVE}}
```

### Winter (Dec–Feb)

- **Save as:** `assets/art/home/hero-winter.png`

```prompt
{{PAINTERLY}}
Wide landscape looking down a coastal golf hole: a fairway curving along the clifftop toward a green with an orange-pennant flag in the middle distance, rugged cliffs dropping to the ocean on one side, a white lighthouse on a far headland, a single windswept cypress on the opposite side framing the view. Eye-level view from the tee. The upper third is open sky, darkening slightly toward deep forest green at the very top edge. The lower third is calm and darker: shaded fairway and tall grasses in soft shadow, uncluttered, with no bright flowers, so cream text placed over it stays readable.
Season: late winter on a calm, bright day. A light dusting of snow on the far headland and the cliff tops, pale frosted grass in the middle distance, the cypress deep green, a cool pale blue-gray sky with soft low winter sun. Keep snow out of the lower third, which stays in soft cool shadow.
{{NEGATIVE}}
```

### Spring (Mar–May)

- **Save as:** `assets/art/home/hero-spring.png`

```prompt
{{PAINTERLY}}
Wide landscape looking down a coastal golf hole: a fairway curving along the clifftop toward a green with an orange-pennant flag in the middle distance, rugged cliffs dropping to the ocean on one side, a white lighthouse on a far headland, a single windswept cypress on the opposite side framing the view. Eye-level view from the tee. The upper third is open sky, darkening slightly toward deep forest green at the very top edge. The lower third is calm and darker: shaded fairway and tall grasses in soft shadow, uncluttered, with no bright flowers, so cream text placed over it stays readable.
Season: spring. Fresh pale-green grass, a few soft pink and white flowering shrubs on the far slopes (kept out of the lower third), a light hazy sky with gentle clouds, fresh morning light, the ocean a soft blue.
{{NEGATIVE}}
```

### Summer (Jun–Aug)

- **Save as:** `assets/art/home/hero-summer.png`

```prompt
{{PAINTERLY}}
Wide landscape looking down a coastal golf hole: a fairway curving along the clifftop toward a green with an orange-pennant flag in the middle distance, rugged cliffs dropping to the ocean on one side, a white lighthouse on a far headland, a single windswept cypress on the opposite side framing the view. Eye-level view from the tee. The upper third is open sky, darkening slightly toward deep forest green at the very top edge. The lower third is calm and darker: shaded fairway and tall grasses in soft shadow, uncluttered, with no bright flowers, so cream text placed over it stays readable.
Season: high summer. Lush deep-green fairway, a bright clear sky with big cumulus clouds, the ocean a deep sparkling blue, warm late-afternoon light.
{{NEGATIVE}}
```

## Scorecard tree emblem

The small mark beside the course name on course pages and at the top of every keepsake scorecard. ✅ Made 2026-11-25 (this prompt reproduces its style).

- **Save as:** `assets/art/scorecard/tree-emblem.png`
- **Size:** 640×512 PNG (5:4), transparent background. Generate 1:1 on cream; the background is keyed out and the drawing cropped to 5:4.

```prompt
{{INK_SKETCH}}
A lone windswept tree with a flat, layered canopy standing on a gentle rise at the left, a golf flagstick with a small orange pennant on a green to the right, a few low rolling mounds suggested with hatching. Wide, low composition centered in the square.
{{INK_SKETCH_AVOID}}
```
