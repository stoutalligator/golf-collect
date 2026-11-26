# {{REGION_NAME}}: shared course art

Every course in **{{REGION_NAME}}** ({{STATES}}) uses these three images unless it has a destination override. That's {{COURSE_COUNT}} course(s) right now.

## Variables (edit these first)

`SCENE` describes the region's look (hero and engraving). `VIGNETTE` is the one bold, centered subject for collectibles. Make it feel like *this region*, not a specific course.

```vars
REGION_NAME: {{REGION_NAME}}
SCENE: {{REGION_SCENE}}
SCENE_SKETCH: the region, drawn with a few signature trees and landforms
VIGNETTE: a single signature tree of the region standing beside a round green with an orange-pennant flag, simple landforms behind
```

---

## Hero

Shown at the top of course pages, on Home round cards (as a thin middle strip) and as list thumbnails.

- **Save as:** `assets/art/regions/{{REGION_ID}}/hero.png`
- **Size:** 1290×860 PNG (3:2). Keep the top third calm (the title overlays it) and the subject in the middle band.

```prompt
{{PAINTERLY}}
Wide landscape of a golf hole in {{SCENE}}. A green with an orange-pennant flag in the middle distance, eye-level view from the tee, generous open sky in the upper third.
{{NEGATIVE}}
```

## Scorecard engraving

The wide sketch along the bottom of every keepsake scorecard from this region. It uses the same **ink-sketch** style as the scorecard tree emblem at the top of the card.

- **Save as:** `assets/art/regions/{{REGION_ID}}/scorecard-engraving.png`
- **Size:** 1200×400 PNG (3:1), transparent background. Generate wide on solid cream; the paper is keyed out afterward.
- **Reference image:** attach the scorecard tree emblem so the linework matches.

```prompt
{{INK_SKETCH}}
A wide, low panoramic sketch of a golf landscape in {{SCENE_SKETCH}}. Long horizontal composition with a low horizon: gentle rolling fairway lines sweeping across the full width, a green with a small flagstick carrying a little orange pennant (the one accent), a few simple tree silhouettes spaced out, and the suggestion of distant hills. Generous empty cream paper above the horizon. Nothing touches the top edge.
{{INK_SKETCH_AVOID}}
```

## Collectible vignette

The small painted scene that shows through the window of ball markers, pitch markers and patches for every course in this region. It is cropped to a **small circle** (ball marker, ~30–80 pt on screen) or a shield (patch), so it must be **one bold subject, centered and close**. It is not a vista.

- **Save as:** `assets/art/regions/{{REGION_ID}}/vignette.png`
- **Size:** 1024×1024 PNG, opaque, square
- **Reference image:** attach this region's **hero** so the brushwork and light match.

```prompt
{{PAINTERLY}}
Thick gouache/oil brushwork matching the reference image: no ink outlines, no watercolor washes, no pen linework.
A close, centered square composition of {{VIGNETTE}}. Large simple shapes fill the square; the tree, the green and the flag stay clearly readable when the image is shrunk to a small circle. Soft cream-blue sky (not saturated blue). Full-bleed painting with no border, no frame, no text. Square 1:1.
{{NEGATIVE}}
```
