# Connecticut National Golf Club: course art

*Putnam, CT · semi-private. Course id `connecticut-national-golf-club`.*

This course is listed in `src/data/config/art-overrides.json`, so it gets its own art in place of the shared region art. How to make a course hero from a photo: [README.md](README.md).

## Variables (edit these first)

`HERO_VIEW` describes what the reference photo shows, in plain landscape terms: the hole, the terrain, trees, water, bunkers and buildings, and where they sit. `SCENE` is a shorter version used by custom collectibles. Never name sponsors, logos or signs.

```vars
COURSE_NAME: Connecticut National Golf Club
SHORT_NAME: Connecticut National
HERO_VIEW: a gently rolling fairway running into a wall of autumn hardwoods and tall pines, mounds of tawny native grass in the foreground, a single tall thin tree standing right of the green, white sand bunkers cut into the slopes to the right
SCENE: a rolling fairway framed by autumn hardwoods and pines, mounds of tawny native grass, a lone tall tree beside the green
```

## Course hero

*Done 2026-11-26: painted from a photo of the course with ChatGPT using `docs/brand/course-hero-from-photo.md`.*

- **Save as:** `assets/art/courses/connecticut-national-golf-club/hero.png`
- **Size:** 1290×860 PNG (3:2), opaque. Top third calm (the status bar and back/save buttons sit over it), subject in the middle band, nothing important in the bottom ~15% (it fades into the page).
- **Reference images (attach both):** 1) the course photo from `assets/_refs/courses/connecticut-national-golf-club/` (layout and landmarks); 2) the region hero `assets/art/regions/new-england/hero.png` (brushwork, palette, light).

```prompt
{{PAINTERLY}}
Match the brushwork, palette and light of the second reference image (the painted region hero).
A wide landscape painting of {{COURSE_NAME}}, based on the first reference image (a photo of the real course): {{HERO_VIEW}}.
Keep the real place recognizable: the same hole shape, terrain, tree lines, water, bunkers and buildings as the photo, in roughly the same arrangement. Repaint everything in the gouache style; do not trace or copy the photo, and simplify fine detail into broad painted shapes.
Eye-level view from the tee or fairway, a green with a flagstick and a small orange pennant in the middle distance, generous open sky in the upper third.
Leave out everything in the photo that is not landscape: people, golf carts, cars, signs, text, logos, flags with writing, yardage markers, tee markers, power lines, fences with signage.
{{NEGATIVE}}
```
