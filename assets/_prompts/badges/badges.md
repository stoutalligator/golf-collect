# Achievement badges (v2: milestone keepsakes)

*Rewritten 2026-11-26. The previous shield + ribbon set stays in `assets/art/badges/` and in the app until you regenerate.*

**Direction:** every badge shows **what the milestone is**, as a small physical golf keepsake. Badges belong to a few **families** that share a material, so the wall reads as one set, but each badge's subject is its own. No shield, no ribbon, no laurels, no stars, no words. The app prints the badge name under the art.

| Family | Material | Badges |
|---|---|---|
| **Scorecard** | Torn fragment of a printed paper scorecard, pencil marks | Break 100, Break 90, Break 80 |
| **Birdie** | Round enamel lapel pin with a painted bird | First Birdie, 100 Birdies |
| **Travel** | Inked rubber-stamp impression on a cream page | Course Explorer, State Traveler, Golf Traveler, Parks & Links |
| **Collecting** | Small wooden keepsake tray or box | Course Collector, Keepsake Keeper |
| **Simulator** | Same subjects, slate-blue palette and a hint of a screen | Sim Break 80, Sim Explorer |

**Format:** 1024×1024 PNG, transparent background in the final file. Generate on solid magenta (#FF00FF), one badge or a family sheet; Claude keys out the magenta and splits sheets. Locked badges are dimmed in code, so generate only the earned look.

**After you regenerate a badge:** save it over the old file, run `npm run art:sync`, and set that badge to `{ "label": false }` in `src/art/badges.json` so the app stops writing a name across it (the old art has a ribbon for the name; the new art doesn't).

---

## Family: Scorecard

```prompt
{{MILESTONE_BADGE}}
A sheet of three matching keepsakes on a perfectly flat, solid pure magenta (#FF00FF) background, in a row with clear magenta gaps so they never touch. Each is a torn fragment of a cream printed golf scorecard with thin forest green printed rules and a few hole columns, a short wooden golf pencil resting across one corner, and one large total score written by hand in pencil and circled. Fragment 1 (left): the total "99". Fragment 2 (middle): the total "89". Fragment 3 (right): the total "79", with a thin muted-gold foil edge along the torn side. Front-facing, straight-on, no shadow on the magenta.
{{NEGATIVE}}
```

### Break 100: shoot a round under 100

- **Save as:** `assets/art/badges/break-100.png`

```prompt
{{MILESTONE_BADGE}}
A torn fragment of a cream printed golf scorecard with thin forest green printed rules and a few hole columns, a short wooden golf pencil resting across one corner, and the total "99" written by hand in pencil and circled.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Break 90: shoot a round under 90

- **Save as:** `assets/art/badges/break-90.png`

```prompt
{{MILESTONE_BADGE}}
A torn fragment of a cream printed golf scorecard with thin forest green printed rules and a few hole columns, a short wooden golf pencil resting across one corner, and the total "89" written by hand in pencil and circled twice.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Break 80: shoot a round under 80

- **Save as:** `assets/art/badges/break-80.png`

```prompt
{{MILESTONE_BADGE}}
A torn fragment of a cream printed golf scorecard with thin forest green printed rules and a few hole columns, a thin muted-gold foil edge along the torn side, a short wooden golf pencil resting across one corner, and the total "79" written by hand in pencil and circled twice.
{{BADGE_BG}}
{{NEGATIVE}}
```

---

## Family: Birdie

```prompt
{{MILESTONE_BADGE}}
Two matching round enamel lapel pins side by side on a perfectly flat, solid pure magenta (#FF00FF) background with a clear magenta gap. Each pin is a cream enamel disc with a thin muted-gold metal rim and a small butterfly clutch peeking from behind. Pin 1 (left): a single small songbird perched on the top of a golf flagstick, painted in enamel. Pin 2 (right): a flock of small songbirds in flight crossing the disc over a sliver of green, with the numeral "100" in small forest green enamel along the bottom of the disc. Front-facing, straight-on, no shadow on the magenta.
{{NEGATIVE}}
```

### First Birdie: make your first birdie

- **Save as:** `assets/art/badges/first-birdie.png`

```prompt
{{MILESTONE_BADGE}}
A round enamel lapel pin: a cream enamel disc with a thin muted-gold metal rim, a single small songbird perched on the top of a golf flagstick painted in enamel, a sliver of putting green at the bottom of the disc.
{{BADGE_BG}}
{{NEGATIVE}}
```

### 100 Birdies: record 100 birdies

- **Save as:** `assets/art/badges/100-birdies.png`

```prompt
{{MILESTONE_BADGE}}
A round enamel lapel pin: a cream enamel disc with a thin muted-gold metal rim, a flock of small songbirds in flight crossing the disc above a sliver of green, and the numeral "100" in small forest green enamel along the bottom edge of the disc.
{{BADGE_BG}}
{{NEGATIVE}}
```

---

## Family: Travel

```prompt
{{MILESTONE_BADGE}}
A sheet of four inked rubber-stamp impressions on small squares of cream passport paper, arranged in a 2×2 grid on a perfectly flat, solid pure magenta (#FF00FF) background with clear magenta gaps. The ink is slightly uneven like a real stamp, in forest green, slate blue or muted gold. Stamp 1: a round stamp with a golf flag in the center and the numeral "25" below it. Stamp 2: a rectangular stamp showing a small cluster of five simple, unlabeled US state outlines. Stamp 3: an oval stamp with a compass rose over a golf flag and the numeral "10". Stamp 4: a round stamp with a mountain, a pine tree and a golf flag, framed by a simple ring. Front-facing, straight-on, no shadow on the magenta.
{{NEGATIVE}}
```

### Course Explorer: play 25 unique courses

- **Save as:** `assets/art/badges/course-explorer.png`

```prompt
{{MILESTONE_BADGE}}
An inked round rubber-stamp impression in forest green on a small square of cream passport paper, slightly uneven like a real stamp: a golf flag in the center and the numeral "25" below it, inside a double ring.
{{BADGE_BG}}
{{NEGATIVE}}
```

### State Traveler: play courses in 5 states

- **Save as:** `assets/art/badges/state-traveler.png`

```prompt
{{MILESTONE_BADGE}}
An inked rectangular rubber-stamp impression in slate blue on a small square of cream passport paper, slightly uneven like a real stamp: a small cluster of five simple, unlabeled neighboring US state outlines with a tiny golf flag planted in one of them.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Golf Traveler: play courses in 10 states

- **Save as:** `assets/art/badges/golf-traveler.png`

```prompt
{{MILESTONE_BADGE}}
An inked oval rubber-stamp impression in muted gold on a small square of cream passport paper, slightly uneven like a real stamp: a compass rose behind a golf flag and the numeral "10" at the bottom of the oval.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Parks & Links: play 5 courses in national parks

- **Save as:** `assets/art/badges/parks-and-links.png`

```prompt
{{MILESTONE_BADGE}}
An inked round rubber-stamp impression in forest green on a small square of cream passport paper, slightly uneven like a real stamp: a simple mountain, a tall pine tree and a golf flag inside a plain ring. Not any official park service emblem or arrowhead shape.
{{BADGE_BG}}
{{NEGATIVE}}
```

---

## Family: Collecting

```prompt
{{MILESTONE_BADGE}}
Two small wooden keepsake pieces side by side on a perfectly flat, solid pure magenta (#FF00FF) background with a clear magenta gap. Piece 1 (left): a shallow wooden display tray lined with forest green felt holding exactly five small golf keepsakes in a row: a round ball marker coin, a pitchfork divot tool, a leather bag tag, an embroidered patch and a small enamel pin. Piece 2 (right): an open wooden keepsake box with a brass hinge, overflowing with many small round golf ball markers and a few enamel pins. Front-facing, slight three-quarter top view, no shadow on the magenta.
{{NEGATIVE}}
```

### Course Collector: complete a full course collection

- **Save as:** `assets/art/badges/course-collector.png`

```prompt
{{MILESTONE_BADGE}}
A shallow wooden display tray lined with forest green felt holding exactly five small golf keepsakes in a row, each in its own recess: a round ball marker coin, a pitchfork-shaped divot repair tool, a small leather bag tag with a strap, an embroidered patch and a small enamel pin. Slight three-quarter top view.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Keepsake Keeper: earn 50 course collectibles

- **Save as:** `assets/art/badges/keepsake-50.png`

```prompt
{{MILESTONE_BADGE}}
An open wooden keepsake box with a brass hinge and forest green felt lining, filled to the brim with many small round golf ball markers in bronze, silver and gold tones, a few enamel pins and a folded leather bag tag. Slight three-quarter top view.
{{BADGE_BG}}
{{NEGATIVE}}
```

---

## Family: Simulator (slate palette)

```prompt
{{MILESTONE_BADGE}}
Two keepsakes side by side on a perfectly flat, solid pure magenta (#FF00FF) background with a clear magenta gap, both in a slate blue (#526B78) and cream palette. Piece 1 (left): a torn fragment of a cream printed golf scorecard clipped to the corner of a small slate-blue rectangular screen showing a simple painted fairway, the total "79" written in pencil and circled. Piece 2 (right): an inked rectangular rubber-stamp impression in slate blue on cream paper, showing a grid of four tiny golf hole pictures (coast, desert, mountain, parkland) and the numeral "10". Front-facing, straight-on, no shadow on the magenta.
{{NEGATIVE}}
```

### Sim Break 80: shoot under 80 in a sim round

- **Save as:** `assets/art/badges/sim-break-80.png`

```prompt
{{MILESTONE_BADGE}}
In a slate blue (#526B78) and cream palette: a torn fragment of a cream printed golf scorecard clipped to the corner of a small slate-blue rectangular screen that shows a simple painted fairway, the total "79" written by hand in pencil on the card and circled.
{{BADGE_BG}}
{{NEGATIVE}}
```

### Sim Explorer: play 10 different sim courses

- **Save as:** `assets/art/badges/sim-explorer.png`

```prompt
{{MILESTONE_BADGE}}
An inked rectangular rubber-stamp impression in slate blue on a small square of cream paper, slightly uneven like a real stamp: a grid of four tiny golf hole pictures (coastal, desert, mountain, parkland) and the numeral "10" beneath them.
{{BADGE_BG}}
{{NEGATIVE}}
```
