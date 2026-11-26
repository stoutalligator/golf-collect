# Achievement badges

**Form** (from board 02): an arched-top shield with an antique gold rim and a painted scene inside. A ribbon banner wraps across the lower third: deep forest green for course badges, slate blue for sim badges. **The ribbon is left blank**; the app writes the badge name on it (no garbled lettering, and renames need no new art).

- **Size:** 1024×1024 PNG each, transparent background in the final file.
- **Generate on solid magenta (#FF00FF)**, one badge or a sheet of several. Claude keys out the magenta, splits sheets and measures each ribbon.
- **Every badge uses the same shield silhouette, rim and ribbon shape**, so the set looks like one family. Only the scene inside changes.
- Locked badges are dimmed in code; generate only the earned look.

Generate in three sheets: **A: Game** (5), **B: Courses & Collection** (6), **C: Sim** (2). Each sheet has a ready-to-paste sheet prompt below, and each badge also has its own prompt if you'd rather make them one at a time.

---

## Sheet A: Game

```prompt
{{PAINTED_BADGE}}
A sheet of five matching golf achievement badges on a perfectly flat, solid pure magenta (#FF00FF) background, arranged three on the top row and two centered on the bottom row, evenly spaced with clear magenta gaps so they never touch. Every badge has exactly the same shape: an arched-top heraldic shield with a polished antique-gold rim, a painted scene inside, and a deep forest green ribbon banner wrapping across the lower third. Every ribbon is completely blank, with no letters or words on it. Each badge is front-facing and straight-on, with no shadow on the magenta.
Badge 1 (top left): a paper golf scorecard with a pencil, the number "100" written on the card, on a green background.
Badge 2 (top middle): a paper golf scorecard with a pencil and the number "90" written on it, sprigs of laurel.
Badge 3 (top right): a paper golf scorecard with a pencil and the number "80" written on it, framed by golden laurel leaves.
Badge 4 (bottom left): a small songbird perched on a flagstick above a putting green.
Badge 5 (bottom right): a flock of small birds rising over a green with an orange-pennant flag, golden light.
{{NEGATIVE}}
```

### Break 100: shoot a round under 100

- **Save as:** `assets/art/badges/break-100.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a paper golf scorecard with a pencil and the number "100" written on the card, on a green background. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Break 90: shoot a round under 90

- **Save as:** `assets/art/badges/break-90.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a paper golf scorecard with a pencil and the number "90" written on it, sprigs of laurel. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Break 80: shoot a round under 80

- **Save as:** `assets/art/badges/break-80.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a paper golf scorecard with a pencil and the number "80" written on it, framed by golden laurel leaves. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### First Birdie: make your first birdie

- **Save as:** `assets/art/badges/first-birdie.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a small songbird perched on a flagstick above a putting green. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### 100 Birdies: record 100 birdies

- **Save as:** `assets/art/badges/100-birdies.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a flock of small birds rising over a green with an orange-pennant flag, golden light. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

---

## Sheet B: Courses & Collection

```prompt
{{PAINTED_BADGE}}
A sheet of six matching golf achievement badges on a perfectly flat, solid pure magenta (#FF00FF) background, arranged in two rows of three, evenly spaced with clear magenta gaps so they never touch. Every badge has exactly the same shape: an arched-top heraldic shield with a polished antique-gold rim, a painted scene inside, and a deep forest green ribbon banner wrapping across the lower third. Every ribbon is completely blank, with no letters or words on it. Each badge is front-facing and straight-on, with no shadow on the magenta.
Badge 1 (top left): a putting green with an orange-pennant flag, dark pine trees, distant rolling hills.
Badge 2 (top middle): a gold silhouette map of the United States on a slate blue field.
Badge 3 (top right): a weathered wooden signpost with arrows pointing different directions, rolling green hills and distant mountains.
Badge 4 (bottom left): snow-capped mountain peaks, dark pine forest, a fairway winding through a valley.
Badge 5 (bottom middle): a classic golf bag with clubs standing against a warm sunset sky and green hills.
Badge 6 (bottom right): an open wooden keepsake box holding golf ball markers, a bag tag and an embroidered patch.
{{NEGATIVE}}
```

### Course Explorer: play 25 unique courses

- **Save as:** `assets/art/badges/course-explorer.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a putting green with an orange-pennant flag, dark pine trees, distant rolling hills. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### State Traveler: play courses in 5 states

- **Save as:** `assets/art/badges/state-traveler.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a gold silhouette map of the United States on a slate blue field. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Golf Traveler: play courses in 10 states

- **Save as:** `assets/art/badges/golf-traveler.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a weathered wooden signpost with arrows pointing different directions, rolling green hills and distant mountains. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Parks & Links: play 5 courses in National Parks

- **Save as:** `assets/art/badges/parks-and-links.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: snow-capped mountain peaks, dark pine forest, a fairway winding through a valley. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Course Collector: complete a full course collection

- **Save as:** `assets/art/badges/course-collector.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a classic golf bag with clubs standing against a warm sunset sky and green hills. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Keepsake Keeper: earn 50 course collectibles

- **Save as:** `assets/art/badges/keepsake-50.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: an open wooden keepsake box holding golf ball markers, a bag tag and an embroidered patch. A deep forest green ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

---

## Sheet C: Sim (slate ribbon)

```prompt
{{PAINTED_BADGE}}
Two matching golf achievement badges side by side on a perfectly flat, solid pure magenta (#FF00FF) background, evenly spaced with a clear magenta gap. Both have exactly the same shape: an arched-top heraldic shield with a polished antique-gold rim, a painted scene inside, and a slate blue (#486E8B) ribbon banner wrapping across the lower third. Both ribbons are completely blank, with no letters or words. Front-facing, straight-on, no shadow on the magenta.
Badge 1 (left): a golf ball on a tee in front of a glowing simulator screen showing a painted fairway, the number "80" small in the corner of the screen.
Badge 2 (right): several small framed screens each showing a different painted golf hole (coast, desert, mountain), arranged like a gallery wall.
{{NEGATIVE}}
```

### Sim Break 80

- **Save as:** `assets/art/badges/sim-break-80.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: a golf ball on a tee in front of a glowing simulator screen showing a painted fairway, the number "80" small in the corner of the screen. A slate blue (#486E8B) ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Sim Explorer: play 10 different sim courses

- **Save as:** `assets/art/badges/sim-explorer.png`

```prompt
{{PAINTED_BADGE}}
A golf achievement badge: an arched-top heraldic shield with a polished antique-gold rim. Inside: several small framed screens each showing a different painted golf hole (coast, desert, mountain), arranged like a gallery wall. A slate blue (#486E8B) ribbon banner wraps across the lower third and is completely blank, with no letters.
{{BADGE_BG}}
{{NEGATIVE}}
```
