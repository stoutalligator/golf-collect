---
name: course-research
description: Research and add real golf courses to Greens Keeper's course data (scorecards, tees, ratings/slope, access, county, biome) with sources and a verification level. Use whenever adding, correcting, re-checking or expanding courses (a new course, a new state, "research courses in X", fixing a scorecard), or when a course's facts are questioned.
---

# Course research

Greens Keeper only ships **researched** course facts. Every number traces to a source, every course carries a verification level, and anything we can't confirm is left out or flagged, never guessed. This skill is the procedure.

## Ground rules

- **Facts only.** Name, town, county, state, access type, holes, par and stroke index per hole, tees (name, total yards, hole yardages, men's/women's rating and slope), coordinates, website, architect, year opened. That's it.
- **Never copy** course descriptions, marketing text, logos, photos or hole diagrams. Descriptions are generated from verified facts by the build script.
- **Never guess.** If a value can't be confirmed, omit it (`yardages: null`, no rating, no biome) and say why in `verification.notes`. A blank is better than a plausible wrong number.
- **Don't use golf-station** data or code, and don't scrape sites whose terms forbid it. Reading a public scorecard page to cross-check is fine; bulk-copying a provider's database is not.
- **Licensing:** OpenGolfAPI data is © OpenStreetMap contributors, ODbL 1.0. Keep the attribution and source entries intact; ODbL share-alike applies if we publish a derived database (open question in `docs/product-vision.md`).
- **Don't hand-edit** `src/data/seed/courses.ct.json`. Change the research config and rebuild.

## Where things live

| File | Role |
|---|---|
| `scripts/courses/ct-courses.json` | The research config: which courses, our display name and county, cross-checks, overrides, biome. **This is what you edit.** |
| `scripts/courses/build-ct-seed.mjs` | Fetches OpenGolfAPI (cached in `scripts/courses/.cache`, gitignored), runs the automated checks, applies overrides and writes the seed. |
| `src/data/seed/courses.ct.json` | Generated output the app reads (through `src/data`). |
| `src/data/seed/SOURCES.md` | Human-readable method + per-course table and extra sources. Update it by hand after every rebuild. |
| `src/data/config/regions.json` | State → art region. A new state must already be in a region. |

The pipeline is Connecticut-only today. For another state, generalize the builder (state code and config file as arguments, e.g. `scripts/courses/<st>-courses.json` → `src/data/seed/courses.<st>.json`) and load the extra seed in `src/data/repository.ts`. Keep course ids globally unique.

## Procedure (per course)

1. **Check it isn't already there.** Search `ct-courses.json` for the name and town. Ids are kebab-case slugs of our display name (`lyman-orchards-jones`). Multi-course facilities get one entry per course.

2. **Find it in OpenGolfAPI.** The state index is `GET https://api.opengolfapi.org/v1/courses/state/<ST>?offset=0&limit=100` (paginate until `total`). Copy the exact `name` into `ogapi`. Course detail is `GET https://api.opengolfapi.org/api/v1/courses/<id>`. Send a generic `User-Agent` (no personal details). If it isn't in OpenGolfAPI, stop and report it; an official-card-only course needs a full override (step 6), which is fine but should be a deliberate choice.

3. **Add the entry** to `courses` in the config: `id`, `name` (our display name), `county`, `ogapi`. Add `access` only if you've confirmed it (step 7).

4. **Build and read the checks:** `node scripts/courses/build-ct-seed.mjs` (add `--refresh` to re-fetch). The script fails on: not 18 holes, stroke index not exactly 1-18, par outside 3-6. It drops a tee's hole yardages when they're more than 1.5% off the stated total and notes it. Read every note it prints for the course.

5. **Cross-check against a second, independent source.** In order of preference: the course's **official scorecard** (site or PDF/image), then a **GolfPass** scorecard page, then another reputable scorecard listing. Compare:
   - par for every hole and stroke index for every hole,
   - hole yardages for at least two tees,
   - rating and slope for each tee and gender.

   If they match, add a `crossCheck` block naming exactly what matched:
   ```json
   "crossCheck": { "name": "GolfPass scorecard", "url": "https://…/scorecard-and-layout", "matched": "par, stroke index, Blue & White hole yardages, tee ratings" }
   ```

6. **Resolve conflicts with the official card.** If OpenGolfAPI disagrees with the course's own scorecard, the official card wins. Add an override and point the entry at it with `"override": "<key>"`:
   ```json
   "overrides": {
     "<key>": {
       "source": { "name": "<Course> official scorecard (where it was found)", "url": "…" },
       "status": "official",
       "note": "What disagreed, what we used, and anything disregarded (e.g. an older layout).",
       "par": [18 numbers], "handicap": [18 numbers],
       "tees": [{ "id": "blue", "name": "Blue", "yardages": [18 numbers], "ratings": { "men": { "rating": 66, "slope": 106 } } }]
     }
   }
   ```
   If sources conflict and there's no official card, keep OpenGolfAPI's values, leave the course `single-source`, and write the disagreement in a note. Watch for **renovated or rerouted layouts**: an older card can disagree for good reason, so prefer the newest dated source and say which layout you used.

7. **Access type** (`public`, `municipal`, `semi-private`, `private`). OpenGolfAPI's `type` is often wrong. Confirm it on the official site (membership-only language means private, town or city ownership means municipal) and record it:
   ```json
   "access": "private",
   "accessSource": { "name": "<Course> official site", "url": "…", "note": "Site describes itself as a private, membership club" }
   ```

8. **County** comes from the town (a town-to-county lookup or the state's official list), not from the course's mailing address if those differ.

9. **Biome** (optional): one of `parkland`, `coastal`, `links`, `mountain`, `desert`, `lakeside`, `prairie`, `lowcountry` (see `regions.json`). Only tag it when a source says so, and record the source and the phrase that justifies it in `biomeSource`. Otherwise leave it off.

10. **Rebuild**, then update `SOURCES.md`: the course table row (town, county, access, par, status, tees with hole yardages, notes) and the "Extra sources" list. Bump the `checked` date in the config when you re-verify.

11. **Verify in the app.** `npx tsc --noEmit` and `npm test`, then open the course page in the web preview (`/course/<id>`): par, tees and yardages should read correctly, and the scorecard should render.

## Verification levels

- **official**: matches the course's own published scorecard (override applied or verified against it).
- **cross-checked**: two independent sources agree on the matched fields.
- **single-source**: OpenGolfAPI only, and all automated checks pass. Fine for the mock; needs a cross-check before public release.

## Report back

Finish with a short table per course: id, status, what was cross-checked against what, any dropped or overridden data, and open questions (e.g. "Red tee hole yardages unavailable", "access type unconfirmed"). Flag courses that need a human to look at a scorecard image or call the pro shop.

## When the database exists

Course facts will move to Supabase (`courses`, `course_tees`, `course_holes`, `course_sources`; see `docs/plan/database.md`). The research output stays the same, and the seed JSON becomes the import file for those tables, so keep doing this procedure through the config and build script, not by editing rows directly.
