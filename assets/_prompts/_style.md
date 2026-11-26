# Shared style blocks

These blocks are the **single source of truth** for the look of every generated asset. Prompt files reference them as `{{PAINTERLY}}`, `{{ENGRAVED}}` and `{{NEGATIVE}}`. Edit them here, run `npm run art:prompts`, and every compiled prompt picks up the change.

Keep each block inside its fenced code block. The compiler reads the text between ` ```block NAME ` and the closing fence.

## Painterly (heroes, collectibles, badges)

```block PAINTERLY
Hand-painted gouache illustration with visible brushwork and subtle paper texture, bright warm daylight, soft blue sky with drifting clouds, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Golf scenery with windswept trees and wildflowers in orange, pink and yellow. A small orange flag pennant is the only bright accent. Premium, crafted, collectible feel.
```

## Engraved (scorecard art, small emblems)

```block ENGRAVED
Fine pen-and-ink engraving with cross-hatching, single dark ink color (#22281F) on aged cream paper (#EFE2C8), vintage etching style, generous negative space, no color fills.
```

## Ink sketch (small marks: scorecard tree emblem; field-journal style)

Adopted 2026-11-25 from the scorecard tree emblem. A loose, minimalist ink-and-pencil sketch: forest-green ink on cream paper, with one small orange accent.

```block INK_SKETCH
Hand-drawn minimalist ink illustration in a loose vintage field-journal sketch style. Drawn with expressive, slightly imperfect forest-green ink strokes on a warm cream paper background. Organic outlines, varied line weight with occasional rough or broken edges, sparse directional hatching, subtle ink grain, and minimal shading. Simple, recognizable silhouettes with very little detail, casually hand-sketched with confident but imperfect strokes. Deep forest green (#1F3D2F) for the primary linework, warm cream (#F2E6CF) for the background, and a restrained muted orange (#BB8B2B) for one small accent. Centered composition with generous negative space. Minimalist, understated, nostalgic and handcrafted, like an illustration from a vintage golf field guide, not a painting or detailed landscape.
```

```block INK_SKETCH_AVOID
Avoid: photorealism, oil painting or gouache rendering, watercolor washes, detailed painterly landscapes, heavy crosshatching or engraving, dense textures, perfect geometric vector shapes, thick cartoon outlines, 3D rendering, gradients, excessive colors, text, logos, borders, watermarks.
```

## Painted object (collectible frames)

For the standard frames (coin rims, patch, bag tag, pitch marker, pin): the same hand-painted look as the scenes, but describing an object with no scenery.

```block PAINTED_OBJECT
Hand-painted gouache rendering of a single crafted keepsake object with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like a cherished souvenir. No landscape, no scenery and no sky anywhere in the image.
```

## Object isolation (collectibles and badges)

```block OBJECT
Centered, front-facing product view, soft even light with a subtle drop shadow, isolated on a transparent background, object fills about 85% of the frame.
```

## Painted badge (achievement badges)

Like the collectible frames (crafted keepsake object), but each badge holds a small painted scene inside its shield.

```block PAINTED_BADGE
Hand-painted gouache rendering of crafted keepsake achievement badges with visible brushwork and subtle paper texture, warm soft studio light, heritage palette of deep forest green (#1F3D2F), warm cream (#F2E6CF), antique gold (#BB8B2B), slate blue (#486E8B) and sage (#748056). Premium, crafted, collectible feel, like cherished enamel-and-gold souvenirs. Each badge holds a small, simple painted scene inside its shield; outside the badges there is no landscape or sky, only the flat background.
```

## Badge background (single badges)

```block BADGE_BG
Centered, front-facing, straight-on, filling about 88% of the square. The background is a perfectly flat, solid pure magenta (#FF00FF) with no shadow, gradient or texture.
```

## Negative (appended to every prompt)

```block NEGATIVE
Avoid: any text other than what is specified, app names, real golf course logos or trademarks, photorealism, 3D render look, neon or saturated greens, pure white background, people, watermark, signature.
```
