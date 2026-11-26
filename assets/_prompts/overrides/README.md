# Course hero art from a reference photo

Every course shows its **region's** painted hero until it gets its own. This is how to give a course a hero painted from what it really looks like: a photo guides the layout and landmarks, and the region hero sets the style, so the course looks like itself but still belongs in the same set.

**Where it shows:** the top of the course page (full width and edge to edge: the status bar and the back and save buttons sit over its top, and its bottom fades into the page above the course name), the course's round cards on Home and in the feed (a thin strip from the middle band), and list thumbnails. The app uses `assets/art/courses/<course-id>/hero.png` as soon as that file exists and has been synced; until then it falls back to the region hero.

## What you need

| | |
|---|---|
| **Reference photo** | One photo of the course's signature view (see below). Saved in `assets/_refs/courses/<course-id>/`, which git ignores. |
| **Style reference** | The region hero, e.g. `assets/art/regions/new-england/hero.png`. Always attach it, so every course hero matches. |
| **Output** | `assets/art/courses/<course-id>/hero.png`, 1290 × 860 PNG (3:2), opaque |
| **Generate at** | 1536 × 1024 (any 3:2), then downscale to 1290 × 860 without cropping |

### Choosing the photo

- **Rights:** use your own photo, or one the course has given you permission to use. The painting must be a new illustration, never a trace. Course photos stay in `assets/_refs/` and are never committed or shipped.
- **View:** the hole people remember (signature par 3, the view from the first tee, the 18th up to the clubhouse). Eye level, looking down the hole toward the green.
- **Orientation:** landscape. Avoid drone or overhead shots; they paint as maps, not places.
- **Light:** daylight, clear or partly cloudy. The painting will be warm and bright whatever the photo's season, so leaves and grass color don't matter.
- **Clean frame:** few people, carts or signs (they're painted out anyway, but they hide the landscape). Find the course id on its page URL (`/course/<id>`) or in `data/courses/<st>.json`.

## Steps

1. **List the course** in `src/data/config/art-overrides.json`:
   ```json
   "courses": {
     "keney-park": { "hero": true }
   }
   ```
2. **Generate its prompt file:** `npm run art:prompts`. This creates `assets/_prompts/overrides/<course-id>.md` (it's never overwritten after that).
3. **Describe the photo** in that file's `HERO_VIEW` line, in plain landscape terms: the shape of the hole, the terrain, the trees, water, bunkers and buildings, and where each sits. For example: *a downhill par 3 over a small pond to a two-tier green, tall oaks behind the green, the white clubhouse on the rise to the right.* Don't name sponsors, logos or signs. `npm run art:prompts` again warns until it's filled in.
4. **Compile:** `npm run art:prompts`, then open `assets/_prompts/compiled/overrides/<course-id>.md`.
5. **Generate:** paste the prompt into the image tool and attach **both** images in this order: (1) the course photo, (2) the region hero. Ask for 3:2 landscape.
6. **Check** it against the list below, and iterate (tips below) until it passes.
7. **Save** it as `assets/art/courses/<course-id>/hero.png` (lowercase, `.png`, 1290 × 860).
8. **Sync:** `npm run art:sync`, then open `/course/<course-id>` in the app and look at the course page and a round card from that course.

## The prompt, line by line

The compiled prompt is built from these parts. Edit `HERO_VIEW` per course; edit the shared style in `assets/_prompts/_style.md` and the template in `scripts/art/art.mjs` (`heroSection`).

| Part | Why it's there |
|---|---|
| `{{PAINTERLY}}` | The house gouache style and palette shared by every hero |
| "Match the brushwork… second reference image" | Pins the style to the region hero, so course heroes sit with the rest |
| "based on the first reference image… {{HERO_VIEW}}" | The real course: the photo plus your words for what matters in it |
| "Keep the real place recognizable… do not trace" | Same layout and landmarks, repainted in broad shapes, never a filtered photo |
| "green with a flagstick and a small orange pennant… open sky in the upper third" | Composition rules for every hero: the one bright accent, and a calm top for the status bar and buttons |
| "Leave out… people, golf carts, signs, text, logos…" | Nothing branded or temporary ends up in the art |
| `{{NEGATIVE}}` | The shared avoid list (no photorealism, no logos, no watermark) |

## Acceptance checklist

- [ ] Someone who plays the course would recognize the hole (shape, water, trees, buildings in the right places).
- [ ] It looks painted, like the region hero: visible gouache brushwork, same palette and warm light. Not a photo with a filter.
- [ ] The upper third is calm sky, so the status bar and the round back and save buttons read clearly over it. Nothing important in the bottom ~15%, which fades into the page.
- [ ] The main subject (green, flag, key landmark) sits in the middle band, so the thin round-card strip still shows something.
- [ ] One small orange pennant is the only bright accent.
- [ ] No people, carts, cars, signs, text, logos, yardage or tee markers.
- [ ] 1290 × 860, opaque PNG, saved at the exact path, synced.

## When it's not right

| Problem | Try |
|---|---|
| Looks like a filtered photo | Add "looser, broader brushwork; simplify the trees into painted masses" at the end of the prompt. Or attach a smaller, lower-resolution copy of the photo. |
| Layout drifts from the real hole | Crop the photo to just the hole, and make `HERO_VIEW` more specific about positions ("pond front-left of the green"). |
| Style doesn't match the other heroes | Make sure the region hero is attached second, and regenerate. |
| Subject too high or too low | Add "horizon at about 40% from the top" and re-run. |
| Too dark, moody, or wrong season | Add "bright late-summer afternoon light". |
| Text or a logo crept in | Regenerate; if it persists, name the object in the leave-out list ("the scoreboard by the 18th green"). |

## Related

- Region heroes and the full prompt workflow: [../README.md](../README.md)
- Sizes and safe zones for every asset: [../../_specs/README.md](../../_specs/README.md)
- Custom collectibles and scorecard engravings for a course use the same `art-overrides.json` entry (`scorecardEngraving: true`, `collectibles: [...]`).
