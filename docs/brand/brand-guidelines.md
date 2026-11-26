# Brand Guidelines (v0.2)

*Last updated: November 25, 2026*
*Source boards (Greens Keeper only): [board-02-greens-keeper.png](boards/board-02-greens-keeper.png) (brand, collectibles, tiers, badges) and [board-03-greens-keeper-screens.png](boards/board-03-greens-keeper-screens.png) (screen layouts). The real course names on the boards are visual reference only.*

These guidelines turn the Greens Keeper board into fixed rules, so that every screen, mockup and generated asset looks like it comes from the same app. When the board and this document disagree, **this document wins**. Change this document on purpose. Design ideas that aren't on the board are marked *proposed*.

For how to generate and deliver assets, see [asset-spec.md](asset-spec.md).

---

## 1. Name & voice

**Working name: Greens Keeper.** The repo name, *Golf Collect*, is a placeholder. The name isn't final until trademark and App Store checks are done; "greenskeeper" is a common word.

**Tagline:** **PLAY · TRACK · COLLECT** (adopted 2026-11-25 from the splash art). Set in Inter caps, widely letter-spaced, with gold rules either side. *(Previously: "Your game. Your courses. Your collection.")*

Keep the app name in **one place** in code and config. Collectibles, badges and scorecards must not show the app name.

**Voice:** warm, confident, understated, as in the board's copy:

- "Good Afternoon, John"
- "Collect unique items at each course, with tiers that reflect how you play."
- "Meaningful milestones for your game, your exploration, and your collection."
- "An iconic coastal course renowned for its dramatic scenery, historic lineage, and world-class layout."

Short, sincere sentences. No hype or exclamation marks.

---

## 2. Color

**Refreshed 2026-11-26** (design update brief + the Home mockup): calmer and warmer, lighter page, forest as an anchor rather than a fill. Code tokens keep their names in `src/theme`; only the values changed.

| Token | Hex | Primary use |
| --- | --- | --- |
| `fairway` (forest) | `#173D32` | Titles, wordmark, primary buttons, active tab, the + button |
| `cream` (page) | `#FFFFFF` | Page background on every screen, headers and tab bar (white since 2026-11-26; was `#F6EFE3`) |
| `creamLight` (raised) | `#FFFFFF` | Raised surfaces: grouped lists, stat strips, feed cards, tab bar. White like the page, set apart by the soft warm shadow |
| `paper` | `#F4EFE6` | Scorecard paper, inset fills (score boxes, segmented-control track, icon buttons) |
| `gold` (muted) | `#B39556` | Thin accents only: stat-strip icons, the + ring, progress, tier details |
| `slate` | `#526B78` | Secondary accent, sim track |
| `sage` | `#829977` | Supporting accent |
| `ink` (charcoal) | `#343A34` | Primary text |
| `ink-muted` | `#6A6E64` | Secondary text, captions |
| `rule` (warm line) | `#E2DACB` | Hairlines, dividers, scorecard rules |
| `pennant` | `#D9622B` | The flag pennant in illustrations only. Never use it in UI. |

The brief's suggested `cream` (`#EAE3D3`) read grey on screen next to the mockup, so the page uses the lighter `#F6EFE3` sampled from it; the brief's values are kept for the art prompts.

### Usage rules

- Pages, headers and the tab bar are white (light mode); the warmth lives in the paper insets, gold accents and the paintings; forest is the anchor for titles and primary actions, not a full-screen fill; gold is a thin accent (icons, rims, the + ring, progress).
- Three surface levels only: page (white), raised (white + soft warm shadow, no border), inset (paper). Don't nest raised surfaces.
- Gold is never used for body text on cream.
- The orange-red pennant is the only bright color and appears **only in artwork**.

### Dark mode (2026-11-26)

A night-course palette. Same token names, same three surface levels; the app follows the phone unless the player picks Light or Dark in Settings.

| Token | Dark hex | Note |
| --- | --- | --- |
| `cream` (page) | `#121915` | Deep green-black, not pure black |
| `creamLight` (raised) | `#1B241F` | Cards, grouped lists, tab bar |
| `paper` (inset) | `#25302A` | Tracks, score boxes, icon buttons |
| `fairway` | `#D3E4CC` | Pale green: titles, primary buttons, active states. Text on it is dark (`cream`) |
| `ink` / `ink-muted` | `#ECE6DA` / `#A3A89C` | |
| `gold` | `#CDB073` | Slightly brighter so thin accents still read |
| `rule` | `#3A453E` | |

- Forest and cream swap jobs: a primary button is a pale-green pill with dark text.
- Paintings and the illustrated collectibles are unchanged. Text over a painting is always `onDark` (cream) with a soft shadow.
- The rewards reveal is an always-dark forest screen in both modes.
- Charts keep the diverging to-par scale; in dark the arms get lighter, not darker, away from par.

---

## 3. Typography

From the board's *Brand Elements*:

| Role | Typeface | Usage |
| --- | --- | --- |
| Headings & brand | **Playfair Display** | Greeting, section titles, course names, wordmark |
| Interface & data | **Inter** | Tabs, labels, stat numbers, list rows, buttons, scorecard figures |
| Section labels | **Inter caps, wide letter-spacing (~0.15em)** | `COURSE COLLECTIBLES`, `COURSE SCORECARD`, item captions (`BAG TAG`, `BALL MARKER`) |

- The wordmark is set in all-caps Playfair Display in fairway (`GREENS KEEPER`), with the flag emblem above it and a short gold rule below the tagline.
- The keepsake scorecard's course name is in **Playfair Display Italic**, and the total is in a handwritten style (*78 (+6)*).
- Use Inter tabular figures for every score and stat.

---

## 4. UI language

From the board's three phone screens.

### Navigation

A five-slot tab bar on fairway with cream icons and labels: **Home · Rounds · (+) · Courses · Collection**. The center **+** is a cream circle with a fairway plus that starts a round.

### Screens

| Screen | Pattern (as on the board) |
| --- | --- |
| **Home** | A fairway top bar with the small flag emblem + "Greens Keeper" wordmark on the left and a bell on the right. A painterly coastal hero. A Playfair greeting in cream on the hero. **Four cream stat tiles** (line icon, label, big number): Rounds 42, Avg Score 87.6, Courses 24, Collection 58. A "Recent Rounds" header with "See All ›". A round card with a landscape thumbnail, course name, and "date · score (+to-par)" plus a chevron. |
| **Course detail** | A full-bleed painted hero with a back chevron and bookmark icon on top. A cream sheet with the course name in Playfair (two lines), a small engraved tree emblem on the right, and a pin + location line. Underlined tabs: **Overview · Rounds · Collection**. A short description paragraph. A row of **four collectibles** for the course (ball marker, bag tag, patch, flag pin). An outlined pill button **"Course Collection ›"**. |
| **Keepsake scorecard** | Aged, slightly worn paper. An engraved tree emblem at the top. The course name in Playfair Italic and `COURSE SCORECARD` letter-spaced. Two ruled grids (holes 1–9 + **Out**, holes 10–18 + **In**) with Hole / Par / Score rows. Selected score cells are boxed with a gold fill. "Total *78 (+6)*" on the right. An engraved coastal illustration fills the lower third. |

### Components

- **Stat tile:** cream card with rounded corners (~12pt). A line icon and small Inter label at the top, a large Inter number below.
- **Round card:** cream card with a 2:1 landscape thumbnail on top and the text row below.
- **Outlined pill button:** a thin fairway outline, Inter text and a trailing chevron.
- **Tabs:** text tabs; the active one is fairway with an underline.
- **Icons:** thin line icons, used on the board for the flag, bar chart, map pin, stacked layers (collection), bell, bookmark, home and chevrons.
- **Score markings:** the board boxes selected scores in gold. *Proposed:* keep the gold box and use standard golf notation (circle = under par, square = over par), with the gold fill marking holes that need attention. To be confirmed in scorecard design.

### Texture budget

Paper grain, wear and engraving are for the **keepsake scorecard and collectibles**. The home and course screens are clean, flat cream surfaces with painterly art only in the hero images.

---

### Screen set (board 03)

| Screen | Layout |
| --- | --- |
| **Splash** | Full-bleed painted coastal scene. Emblem, `GREENS KEEPER` wordmark and the tagline sit in the calm sky area. |
| **Home** | Emblem + wordmark + bell header over the hero. Greeting. Three stat tiles: **Rounds · Courses · Collectibles**. Recent Rounds cards. |
| **Course detail** | Hero, back + bookmark. Name + engraved tree, location, description. List rows: **Log a Round**, **View Scorecards**. A "Course Collectibles" carousel. |
| **Scorecard** | Fairway header (back · "Scorecard"). A paper card with an engraving at the top and bottom, the course name in italic, Out/In grids, highlighted score cells, and "Total *76 (+4)*". |
| **My Collection** | Search icon. Chips: All · Bag Tags · Markers · Patches · Pins. A two-column grid of items on cream tiles. |
| **Collectible detail** | The item shown large on a fairway backdrop, a title like "Course Patch", "Course Collectible · Patch", a description, and **Your Tier** (Bronze · Silver · Gold · Platinum) on the **ball marker only**; achievement items (patch, pitch marker, bag tag, pin) show how they were earned, with no tiers. |
| **Achievements** | Chips: All · Game · Courses · Collection. Rows: shield badge, title, rule, gold progress bar, x / y, and a check when earned. |
| **Courses** | Search field. Chips: All · Played · Wishlist. Rows: landscape thumbnail, name, town, and a played check circle. |
| **Rounds** | Chips (All · Scorecards · Stats on the board; we add a **Sim** chip for the separate sim track). Rows: thumbnail, course, date · score (+to-par). |
| **Profile** | Hero with a circular emblem avatar, name, "Member Since", three stats, and a Recent Achievement card. |

## 5. Illustration

There are two styles, both on the board:

1. **Painterly landscape** (heroes, thumbnails, collectible and badge interiors). Gouache or oil texture, bright warm daylight, soft blue sky with clouds, coastal cliffs, ocean, a lighthouse, windswept cypress trees, and wildflowers (orange, pink, yellow) in the foreground.
2. **Engraved line art** (scorecard, small emblems). Pen-and-ink cross-hatching in dark ink on paper.

**Signature motif:** the **lone windswept cypress tree**. It appears on the ball marker, pitch marker, patch, tier coins, the course emblem and the scorecard.

**Secondary motifs:** a flag with an orange pennant on a green, a lighthouse on a headland, coastal cliffs.

---

## 6. Logo & app icon

**Emblem (adopted 2026-11-25, from the splash painting):** a heraldic **shield** with a golf flag on a rounded hill, two small pines and soft mountain outlines inside, flanked by **gold laurel branches**.

- **Light-background version:** a forest-green shield with a cream inner field and gold laurels. Used on cream screens (Profile avatar) and the native splash.
- **Dark-background version:** a cream shield with a gold border and gold laurels. Used in the Home header and the app icon.
- **App icon:** the dark-background emblem centered on forest green, filling ~70%. No text.
- **Wordmark:** "Greens Keeper" in Playfair Display. On the splash it's set large in forest green under the emblem, with the tagline **PLAY · TRACK · COLLECT** between gold rules.

*(Superseded: the board's flag-and-swoosh emblem.)*

## 7. Real-course branding

The board uses **Pebble Beach** as its example course, for internal reference only. Its name, logo and likeness belong to its owners. Public mockups must use **fictional sample courses** (see [asset-spec.md §7](asset-spec.md#7-sample-courses-for-mockups)). Real course names and art appear in the app only where data and licensing allow it.
