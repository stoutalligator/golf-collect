# Generates assets/_specs/*.md (one spec per asset type). Run: npm run art:specs
# Shared art model: per-region heroes/engravings/vignettes, standard collectible frames
# (course name drawn by the app), optional per-course overrides from art-overrides.json.
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parents[2]
out = root / 'assets' / '_specs'
out.mkdir(parents=True, exist_ok=True)
for old in out.glob('*.md'):
    old.unlink()


def load(*p):
    return json.loads(root.joinpath(*p).read_text(encoding='utf-8'))


courses = load('src', 'data', 'seed', 'courses.ct.json')['courses']
REGIONS = load('src', 'data', 'config', 'regions.json')['regions']
FRAMES = load('src', 'art', 'frames.json')['frames']
OVERRIDES = {k: v for k, v in load('src', 'data', 'config', 'art-overrides.json')['courses'].items() if not k.startswith('_')}
used_regions = [r for r in REGIONS if any(c['region'] == r['id'] for c in courses)]

# Paste-ready prompts by output path, parsed from assets/_prompts/compiled (run `npm run art:prompts` first).
import re
PROMPTS = {}
for f in (root / 'assets' / '_prompts' / 'compiled').rglob('*.md'):
    text = f.read_text(encoding='utf-8')
    for m in re.finditer(r"\*\*Save as:\*\*\s*`([^`]+)`[\s\S]*?```text\n([\s\S]*?)\n```", text):
        PROMPTS.setdefault(m.group(1), m.group(2).strip())

# Generation settings shared by spec types. Image tools rarely output exact sizes:
# request the ratio, generate at the suggested size, then resize/crop to the final size.
GEN = {
    'square': dict(ratio='1:1', generate='1024 × 1024 (or larger, square)', final='1024 × 1024 px', post='None if generated at 1024; otherwise downscale to 1024 × 1024. Magenta-background art: send to Claude for keying (and splitting, for sheets).'),
    'tree': dict(ratio='1:1', generate='1024 × 1024 or larger, on solid cream', final='640 × 512 px (5:4), transparent', post='Key out the cream paper to transparency (keep the ink grain), crop to the drawing with ~6% padding, and fit it centered on a 640 × 512 canvas.'),
    'hero': dict(ratio='3:2 landscape', generate='1536 × 1024 (or any 3:2)', final='1290 × 860 px', post='Downscale to 1290 × 860 (same 3:2 ratio, no cropping).'),
    'engraving': dict(ratio='3:1 wide (if unavailable: 16:9 or 2:1)', generate='1536 × 512 (3:1), or 1792 × 1024 (16:9), on solid cream paper', final='1200 × 400 px (3:1), transparent', post='Send to Claude: the cream paper is keyed out to transparency (keeping the ink grain), cropped to 3:1 around the drawing and sized to 1200 × 400.'),
    'portrait': dict(ratio='9:16 portrait (tallest most tools allow)', generate='1152 × 2048 (or any 9:16)', final='1179 × 2556 px', post='Upscale to 1438 × 2556 (keeps 9:16), then crop to 1179 × 2556 by trimming ~130 px from each side. Keep the subject inside the center 1179 px.'),
}
EXPORT_OPAQUE = 'PNG, sRGB, 8-bit per channel, **no alpha channel** (flatten onto the background)'
EXPORT_ALPHA = 'PNG-32, sRGB, 8-bit per channel **with alpha**: transparent background (and transparent window for frames). No white halo at the edges.'
TIERS = ('bronze', 'silver', 'gold', 'platinum')
BADGES = [('break-100', 'Break 100'), ('break-90', 'Break 90'), ('break-80', 'Break 80'), ('first-birdie', 'First Birdie'),
          ('100-birdies', '100 Birdies'), ('course-explorer', 'Course Explorer'), ('state-traveler', 'State Traveler'),
          ('golf-traveler', 'Golf Traveler'), ('parks-and-links', 'Parks & Links'), ('course-collector', 'Course Collector'),
          ('keepsake-50', 'Keepsake Keeper'), ('sim-break-80', 'Sim Break 80 (slate ribbon)'), ('sim-explorer', 'Sim Explorer (slate ribbon)')]
SS = '../../docs/screenshots/'


def shot(n, label):
    return f'[{label}]({SS}{n}.png)'


def region_files(name):
    return [(f"assets/art/regions/{r['id']}/{name}.png", f"{r['name']}: used by {sum(c['region'] == r['id'] for c in courses)} course(s)") for r in used_regions]


def window_text(kind):
    f = FRAMES[kind]
    parts = []
    w = f['window']
    if w is None:
        parts.append('no window')
    elif w['type'] == 'circle':
        parts.append(f"**transparent circle**, center ({w['cx']}, {w['cy']}), radius {w['r']}")
    else:
        x0, y0, x1, y1 = w['box']
        parts.append(f"**transparent shield**, bounding box ({x0}, {y0})–({x1}, {y1}); exact outline: `{w['d']}`")
    lab = f['label']
    if lab is None:
        parts.append('no label (no course name)')
    elif lab.get('type') == 'ring':
        parts.append(f"ring label band between radius {lab['rTop'] - 20} and {lab['rBottom'] + 20} around the center: keep it a **plain blank band**; the app prints the course name on the top arc and town · state on the bottom arc")
    else:
        parts.append(f"label: {lab['lines']} line(s) centered at x {lab['x']}, y {lab['y']}, up to {lab['maxWidth']} px wide; keep it **blank**")
    return '; '.join(parts)


SPECS = [
    dict(slug='app-icon', gen=GEN['square'], export=EXPORT_OPAQUE, maxsize='≤ 1 MB', title='App icon', group='Brand', prompt='brand/brand.md#app-icon',
         replaces='The default Expo icon (`assets/images/icon.png`).',
         files=[('assets/art/brand/app-icon.png', '')], canvas='1024 × 1024 px',
         fmt='PNG, **no transparency**, square corners (iOS applies the rounded mask)',
         shown=[('iPhone home screen', '60 pt', ''), ('Spotlight / Settings', '40 pt / 29 pt', ''), ('App Store', '1024 px', '')],
         safe='Keep the emblem within the center ~70%. iOS masks the corners, so nothing important near them.',
         extra='The cream-and-gold shield emblem centered on forest green, filling ~70%. **Reference image:** `emblem-on-dark.png`. `npm run art:sync` copies it to `assets/images/icon.png`, which `app.json` uses. It shows on a phone after a new build (EAS), not in Expo Go.',
         checks=['Reads clearly at 60 px on a light and on a dark wallpaper.', 'No text.', 'Opaque, square corners, nothing near the corners.']),
    dict(slug='emblem', gen=GEN['square'], export=EXPORT_ALPHA, maxsize='≤ 500 KB each', title='Emblem: shield + laurels (two versions)', group='Brand', prompt='brand/brand.md#emblem-for-light-backgrounds',
         replaces='The vector flag-and-swoosh mark.',
         files=[('assets/art/brand/emblem.png', 'for light backgrounds: forest-green shield, cream inside, gold laurels'), ('assets/art/brand/emblem-on-dark.png', 'for dark backgrounds: cream/gold shield; edit of the first')],
         canvas='1024 × 1024 px', fmt='PNG with **transparent** background (generate on flat magenta; Claude keys it)',
         shown=[('Home header, left of the wordmark (on-dark version)', '34 pt on fairway', shot('02-home', '02 Home')), ('Profile avatar (light version)', '64 pt on cream', shot('10-profile', '10 Profile'))],
         safe='Square composition, emblem centered, filling ~85%. Bold, flat shapes with few details: it must read at 34 pt.',
         extra='Adopted 2026-11-25 from the splash painting: a shield with a flag on a hill, pines and mountains, flanked by gold laurels. **Reference image:** the splash (for the light version), then edit the light version into the on-dark version so the shapes match exactly. The app picks the version by background and falls back to the other if one is missing.',
         checks=['Reads at 34 pt on `#1F3D2F` (on-dark version) and at 64 pt on `#F2E6CF` (light version).', 'Both versions have identical shapes; only colors differ.', 'No text.']),
    dict(slug='splash', gen=GEN['square'], export=EXPORT_ALPHA, maxsize='≤ 500 KB', title='Native splash image', group='Brand', prompt='brand/brand.md#splash-image',
         replaces='The default Expo splash icon.', files=[('assets/art/brand/splash.png', '')], canvas='1024 × 1024 px',
         fmt='PNG with **transparent** background', shown=[('iOS launch screen (before the app loads)', '200 pt wide on cream `#F2E6CF`', '')],
         safe='Emblem centered, filling ~80%.',
         extra='The light-background emblem (generate on flat magenta; Claude keys it). `npm run art:sync` copies it to `assets/images/splash-icon.png`; visible only in real builds, for a moment before the painted splash.',
         checks=['Reads on cream `#F2E6CF`.']),
    dict(slug='splash-scene', gen=GEN['portrait'], export=EXPORT_OPAQUE, maxsize='≤ 2 MB', title='Splash scene (portrait painting)', group='Brand', prompt='brand/brand.md#splash-scene-portrait',
         replaces='The landscape placeholder with a cream wash.', files=[('assets/art/brand/splash-scene.png', '')],
         canvas='1179 × 2556 px (iPhone portrait, 3×)', fmt='PNG, opaque',
         shown=[('Launch overlay, full screen', '393 × 852 pt (cover)', shot('01-splash', '01 Splash'))],
         safe='Top **45%** is calm, light sky: the emblem (y ≈ 110–190 pt), the wordmark (≈ 200–300 pt) and the tagline (≈ 310–345 pt) sit there in forest green. Top 54 pt: the status bar. Keep the subject in the lower half.',
         checks=['Forest-green text is readable over the sky.']),
    dict(slug='home-hero', gen=GEN['hero'], export=EXPORT_OPAQUE, maxsize='≤ 1.5 MB each', title='Home hero: four seasons (also the Profile banner)', group='Brand', prompt='brand/brand.md#home-hero-four-seasons',
         replaces="The vector landscape at the top of Home and Profile. One image per season, chosen by today's date.",
         files=[('assets/art/home/hero-autumn.png', 'Sep–Nov · make first'), ('assets/art/home/hero-winter.png', 'Dec–Feb'), ('assets/art/home/hero-spring.png', 'Mar–May'), ('assets/art/home/hero-summer.png', 'Jun–Aug')],
         canvas='1290 × 860 px (3:2)', fmt='PNG, opaque',
         shown=[('Home, top band', '393 × 300 pt (cover)', shot('02-home', '02 Home')), ('Profile, banner', '393 × 190 pt (cover)', shot('10-profile', '10 Profile'))],
         safe='Top ~100 pt sits under the status and header bars; the bottom ~60 pt holds the cream greeting and the top of the stat tiles. Keep the subject in the 35–75% height band.',
         extra='**Seasons:** spring Mar–May, summer Jun–Aug, autumn Sep–Nov, winter Dec–Feb (a missing season falls back to any other season). **Make autumn first**, then create the other three by **editing it**, so the composition is identical and only the season changes. **Reference image:** attach your splash painting for brushwork and light, but make it a **different view**. Keep the **lower third darker and calm** in every season: the cream greeting sits there. Preview a season in the web app with `?season=winter`.',
         checks=['Cream greeting text is readable over the lower third in all four seasons.', 'All four share the same composition; only the season changes.', 'Same painted style as the splash, but a distinct view.', 'Subject (green, flag, cliffs) in the middle band; the top ~100 pt is covered by the header.']),
    dict(slug='scorecard-tree', gen=GEN['tree'], export=EXPORT_ALPHA, maxsize='≤ 200 KB', title='Scorecard tree emblem (engraved)', group='Brand', prompt='brand/brand.md#scorecard-tree-emblem',
         replaces='The vector line-art cypress.', files=[('assets/art/scorecard/tree-emblem.png', '')],
         canvas='640 × 512 px (5:4)', fmt='PNG with **transparent** background',
         shown=[('Keepsake scorecard, top', '84 pt wide', shot('05-scorecard', '05 Scorecard')), ('Course detail, beside the title', '64 pt wide', shot('04-course-detail', '04 Course detail'))],
         safe='The drawing centered, filling about 88% of the width with even padding.', extra='**Style:** the Ink sketch block (`{{INK_SKETCH}}` in `_style.md`): loose forest-green field-journal linework with one small orange accent. ✅ Done 2026-11-25.', checks=['Reads on paper `#EFE2C8` and cream `#F2E6CF` with no halo.', 'Forest-green ink plus at most one small orange accent.']),
    dict(slug='region-hero', gen=GEN['hero'], export=EXPORT_OPAQUE, maxsize='≤ 1.5 MB', title='Region hero', group='Regions', prompt='regions/',
         replaces='The vector landscape behind every course in the region.', files=region_files('hero'),
         canvas='1290 × 860 px (3:2)', fmt='PNG, opaque',
         shown=[('Course detail, top', '393 × 280 pt (cover)', shot('04-course-detail', '04 Course detail')),
                ('Home, Recent Rounds card', '361 × 96 pt: a **thin middle strip**', shot('02-home', '02 Home')),
                ('List thumbnails', '76 × 52 pt', shot('03-courses', '03 Courses'))],
         safe='Keep the subject (green, flag, signature trees) in the **center 60% of the width and the 35–75% height band**. The top ~90 pt sits under the back and bookmark buttons.',
         extra='One image represents **every** course in the region, so evoke the region, not one course. Destination courses can override it (see the overrides spec).',
         checks=['Reads as the region at thumbnail size.', 'The middle strip alone reads as a golf scene.']),
    dict(slug='region-engraving', gen=GEN['engraving'], export=EXPORT_ALPHA, maxsize='≤ 500 KB', title='Region scorecard engraving', group='Regions', prompt='regions/',
         replaces='The vector engraved strip on keepsake scorecards.', files=region_files('scorecard-engraving'),
         canvas='1200 × 400 px (3:1)', fmt='PNG with **transparent** background (laid over the paper)',
         shown=[('Keepsake scorecard, bottom', 'full card width (~327 pt) at 3:1', shot('05-scorecard', '05 Scorecard'))],
         safe='A low horizon across the full width; leave the top ~25% empty (it sits just under the \"Total\" line). The drawing should span edge to edge so the strip feels continuous.',
         extra='**Style:** the Ink sketch block (`{{INK_SKETCH}}` in `_style.md`), matching the scorecard tree emblem: loose forest-green field-journal linework on cream, one small orange accent (the flag pennant). Attach the tree emblem as the reference image.',
         checks=['Matches the tree emblem linework (side by side, one hand drew both).', 'Forest-green ink plus a single small orange pennant.', 'Wide and low; nothing important in the top quarter.']),
    dict(slug='region-vignette', gen=GEN['square'], export=EXPORT_OPAQUE, maxsize='≤ 800 KB', title='Region collectible vignette', group='Regions', prompt='regions/',
         replaces='The vector scene inside ball markers, pitch markers and patches.', files=region_files('vignette'),
         canvas='1024 × 1024 px (square)', fmt='PNG, opaque',
         shown=[('Through the window of ball markers / pitch markers / patches', '~30–160 pt circle or shield crop', shot('06-collection', '06 Collection'))],
         safe='**One bold subject, centered and close; not a vista.** A ball marker shows only the center circle (about the middle 70%), and the patch shows most of the square as a shield. Nothing important in the corners. Large simple shapes; the flag and tree must survive shrinking to a small circle.',
         extra='**Style:** thick gouache/oil brushwork matching the region hero. No ink outlines, no watercolor washes, no pen linework. **Attach the region hero as the reference image.** Sky is soft cream-blue, not saturated blue. Quick test before saving: shrink the result to ~60 px and squint; you should still see a tree, a green and a flag.',
         checks=['Same brushwork and light as the region hero (side by side, they look like one set).', 'Still reads at ~60 px / a 40 pt circle: tree, green and flag visible.', 'Square 1:1, full-bleed, no border, no text.']),
    dict(slug='collectible-frames', gen=GEN['square'], export=EXPORT_ALPHA, maxsize='≤ 600 KB each', title='Standard collectible frames', group='Collectibles', prompt='collectibles/frames.md',
         replaces='The vector collectibles. The app layers the region vignette **under** the frame and draws the course name **on top**.',
         files=[('assets/art/collectibles/frames/ball-marker.png', 'untiered: play a round')]
               + [(f'assets/art/collectibles/frames/ball-marker-{t}.png', {'bronze': 'break 100', 'silver': 'break 90', 'gold': 'break 80', 'platinum': 'even par or better'}[t]) for t in TIERS]
               + [(f'assets/art/collectibles/frames/{k}.png', '') for k in ('pitch-marker', 'patch', 'bag-tag', 'pin')],
         canvas='1024 × 1024 px', fmt='PNG with **transparent** background **and a transparent window**',
         shown=[('Collection grid', '118 pt', shot('06-collection', '06 Collection')), ('Course detail row', '78 pt', shot('04-course-detail', '04 Course detail')),
                ('Collectible detail', '230 pt; tier row 58 pt', shot('07-collectible-detail', '07 Collectible detail'))],
         safe='\n'.join(f'- **{k}**: {window_text(k)}' for k in ('ball-marker', 'pitch-marker', 'patch', 'bag-tag', 'pin'))
              + '\n\nCoordinates are in pixels on the 1024 canvas (source of truth: `src/art/frames.json`). If your painted frame ends up slightly different, adjust the JSON to match the art rather than repainting.',
         extra='No scene, no text, no course identity: these frames are shared by every course. Ball-marker tiers must be the same coin with a different rim (Silver: engraved border; Gold: double rim; Platinum: double rim plus a star), so they differ by more than color.',
         checks=['The window is truly transparent (check on a dark background).', 'The label areas (patch banner, lower bag tag) are blank.',
                 'All five ball markers line up exactly (same size and position).']),
    dict(slug='badge', gen=GEN['square'], export=EXPORT_ALPHA, maxsize='≤ 500 KB each', title='Achievement badges', group='Badges', prompt='badges/badges.md', replaces='The vector shield badges.',
         files=[(f'assets/art/badges/{b}.png', n) for b, n in BADGES], canvas='1024 × 1024 px', fmt='PNG with **transparent** background',
         shown=[('Achievements list', '64 pt (dimmed in code when locked)', shot('08-achievements', '08 Achievements')), ('Profile, Recent Achievement', '56 pt', shot('10-profile', '10 Profile'))],
         safe='Shield centered with ~6% padding; the ribbon spans the lower third and is **left blank**: the app writes the badge name on it (measured per badge).',
         extra='**Generate on solid magenta (#FF00FF)**, singly or as sheets (A: Game · B: Courses & Collection · C: Sim); Claude keys, splits and measures each ribbon. Same shield silhouette, gold rim and ribbon shape on every badge; only the inner scene changes. Course badges have a forest-green ribbon, sim badges slate blue.',
         checks=['Ribbon is blank (no letters).', 'All badges share the same shield silhouette, rim and ribbon shape.', 'Scene reads at 64 pt.']),
]

override_files = []
for cid, o in OVERRIDES.items():
    if o.get('hero'):
        override_files.append((f'assets/art/courses/{cid}/hero.png', 'destination hero'))
    if o.get('scorecardEngraving'):
        override_files.append((f'assets/art/courses/{cid}/scorecard-engraving.png', 'destination engraving'))
    for i in o.get('collectibles', []):
        override_files.append((f'assets/art/courses/{cid}/collectibles/{i}.png', 'complete one-off collectible'))
SPECS.append(dict(
    slug='course-overrides', gen=None, export='Same as the shared asset it replaces (hero: opaque; engraving and collectible: with alpha).', maxsize='Same as the shared asset', title='Course overrides (optional, one-off)', group='Overrides', prompt='overrides/',
    replaces="The shared region/frame art, for **one** course. Used for destination courses or a special collectible.",
    files=override_files, canvas='Hero 1290 × 860 · engraving 1200 × 400 · collectible 1024 × 1024', fmt='Same as the shared asset it replaces; a collectible override is the **complete finished item** (the app adds no layers or text)',
    shown=[('Same places as the shared asset', '—', '')],
    safe='Same safe zones as the region hero, region engraving and frames.',
    extra='List the course in `src/data/config/art-overrides.json` (`hero`, `scorecardEngraving`, `collectibles: [ids]`), then run `npm run art:prompts` to get its prompt file. Lookup order: course override → region → vector placeholder.',
    checks=['Only for courses that deserve it. Everything else uses shared art.']))

index = ['# Asset specs', '',
         '**Shared art model:** courses never need their own art. Each **region** has a hero, a scorecard engraving and a collectible vignette; collectibles are **standard frames** with the region vignette and the course name layered in by the app. Destination courses can optionally override any of it.', '',
         'One spec per asset type: what it replaces, the files to make, canvas and format, **where it appears and at what size**, safe zones, and an acceptance checklist. Prompts live in [`assets/_prompts/`](../_prompts/README.md). Screenshots are phone-size captures from `npm run screens`.', '',
         '**Workflow:** make the image → save it at its exact path → `npm run art:sync` → reload the app (or `npm run screens`).', '',
         '*Generated from `regions.json`, `frames.json`, `art-overrides.json` and the course seed. Run `npm run art:specs` after changes.*', '',
         '| Asset | Group | Files | Final size |', '|---|---|---|---|']
for s in SPECS:
    L = [f"# {s['title']}", '', f"**Group:** {s['group']}  ·  **Prompt:** [{s['prompt']}](../_prompts/{s['prompt']})", '', f"**Replaces:** {s['replaces']}", '',
         '## Requirements', '', '| | |', '|---|---|',
         f"| **Final size** | **{s['gen']['final'] if s.get('gen') else s['canvas']}** |",
         *( [f"| **Request in your image tool** | aspect ratio **{s['gen']['ratio']}**, generate at {s['gen']['generate']} |",
             f"| **Then** | {s['gen']['post']} |"] if s.get('gen') else [] ),
         f"| **Format** | {s['fmt']} |", f"| **Export** | {s['export']} |", f"| **File size** | {s['maxsize']} |",
         f"| **Files to make** | {len(s['files'])} |", '',
         '## Where it appears', '', '| Screen | Rendered size | Screenshot |', '|---|---|---|']
    L += [f'| {a} | {b} | {c or "—"} |' for a, b, c in s['shown']]
    L += ['', '## Safe zone & composition', '', s['safe'], '']
    if s.get('extra'):
        L += ['## Notes', '', s['extra'], '']
    L += ['## Acceptance checklist', ''] + [f'- [ ] {c}' for c in s['checks']] + ['- [ ] Saved at the exact path below, then `npm run art:sync`.', '']
    L += ['## Files & prompts', '']
    if not s['files']:
        L += ['*None configured.*']
    for f, note in s['files']:
        L += [f'- [ ] `{f}`' + (f'  ({note})' if note else '')]
        if f in PROMPTS:
            L += ['', '  ```text'] + ['  ' + line for line in PROMPTS[f].splitlines()] + ['  ```', '']
    if s['files'] and not any(f in PROMPTS for f, _ in s['files']):
        L += ['', f"*Prompts: see [{s['prompt']}](../_prompts/{s['prompt']}) (run `npm run art:prompts`).*"]
    (out / f"{s['slug']}.md").write_text('\n'.join(L) + '\n', encoding='utf-8')
    index.append(f"| [{s['title']}]({s['slug']}.md) | {s['group']} | {len(s['files'])} | {s['gen']['final'] if s.get('gen') else s['canvas']} |")
total = sum(len(s['files']) for s in SPECS)
index += ['', f'**Total: {total} images**, independent of how many courses exist (+3 per new region, + any overrides). The app works with any subset; missing images keep their vector placeholder.', '']
(out / 'README.md').write_text('\n'.join(index), encoding='utf-8')
print(len(SPECS), 'specs,', total, 'files')
