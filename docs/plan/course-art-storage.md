# Course-specific art: where to store it

**Status:** open, revisit when we have ~10 course heroes (noted 2026-11-26). Today there's **one**: Connecticut National.

## How it works today

- Course heroes are **bundled into the app**, like all other art. A painting saved as `assets/art/courses/<course-id>/hero.png` and registered with `npm run art:sync` is compiled into the app through `src/art/registry.generated.ts`.
- The app looks for art in this order: course hero → region hero → vector placeholder (`courseHeroKeys` in `src/art/index.ts`). So a course without its own painting still looks finished.
- Course **facts** already live in the database (Supabase) and update without an app release. Course **art** doesn't: every new hero needs a new TestFlight/App Store build before anyone sees it.

## Why this won't scale

| | Today | At 100 course heroes |
|---|---|---|
| Size per hero | ~2 MB PNG (1290 × 860) | ~200 MB added to the app download |
| Getting a new hero to players | New app build + App Store review | Same, for every batch |
| Who can add one | Someone with the repo and a build | Same |

All bundled art is ~41 MB today. Region heroes and brand art are few and rarely change, so they should stay bundled; course heroes are the part that grows without limit.

## Options

### A. Supabase Storage + a `course_art` table (recommended)

- A **public Storage bucket** (`course-art`) holds the images, served through Supabase's CDN.
- A small table records what exists, so the app knows which courses have art without probing URLs:
  `course_art (course_id, kind ['hero' | 'engraving' | collectible id], path, width, height, version, credit, updated_at)`.
  It loads with the course index at launch (it's tiny), with read-only access for everyone signed in.
- The app shows them with **`expo-image`** (already installed), which caches on disk, so each image downloads once per phone and works offline afterwards. While it loads, the bundled region hero shows (or a blurhash stored in the table), so nothing flashes empty.
- An upload script (`npm run art:upload`) resizes and converts the painting, uploads it, and upserts the row. The repo keeps the source paintings and the record of what's uploaded, the same way course facts work (`npm run db:import-courses`).
- **Pros:** we already run Supabase (no new vendor); new heroes go live without an app build; works with the existing fallback order; cheap at our scale. **Cons:** first view needs a network connection; one more table and script to maintain.

### B. A separate image CDN (Cloudflare R2 + Images, imgix, Cloudinary)

On-the-fly resizing and format conversion (one master, many sizes). Better if art grows into thousands of images or needs many crops. Another vendor, account and bill; overkill for now.

### C. Keep bundling, but ship art with EAS Update

Over-the-air updates can deliver new bundled art without App Store review. It still grows the app with every hero, and every phone downloads all of them, so it only delays the problem. Fine as a stopgap for a handful more.

### D. Keep bundling, but shrink

Convert heroes to WebP or high-quality JPEG (~200–350 KB instead of ~2 MB). This is worth doing whichever option we choose; on its own, it buys room for a few dozen heroes.

## Suggested path

1. **Now (a few heroes):** keep bundling. Optionally convert course heroes to WebP when we add the next ones.
2. **At ~10 heroes, or before the first big batch:** build option A.
   - Migration for the `course_art` table and the public bucket.
   - `npm run art:upload` script.
   - App lookup: course art from the table (remote), then the bundled region hero, then the placeholder.
   - Move the bundled course heroes to Storage, then drop them from the app.
3. **Later, if needed:** add a thumbnail size per hero for lists and cards (or move to option B if we need many sizes).

## Open questions

- **Rights:** heroes are painted from course photos. Keep the source photo and its permission (ours, or from the course) recorded in the `credit` column or in the repo, out of the public bucket.
- **Updates:** when a hero is repainted, bump `version` in the table so phones fetch the new one instead of a cached copy.
- **Other per-course art:** custom collectibles and scorecard engravings could use the same table and bucket (`kind`).
- **Courses that ask:** a course might supply its own art or ask us to remove it. That becomes a table edit, not an app release.
