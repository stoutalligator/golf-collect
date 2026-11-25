# Brand Guidelines (v0.2)

*Last updated: November 25, 2026*
*Source board: [board-02-greens-keeper.png](boards/board-02-greens-keeper.png). This board is the **only** design reference.*

These guidelines turn the Greens Keeper board into fixed rules, so that every screen, mockup and generated asset looks like it comes from the same app. When the board and this document disagree, **this document wins**. Change this document on purpose. Design ideas that aren't on the board are marked *proposed*.

For how to generate and deliver assets, see [asset-spec.md](asset-spec.md).

---

## 1. Name & voice

**Working name: Greens Keeper.** The repo name, *Golf Collect*, is a placeholder. The name isn't final until trademark and App Store checks are done; "greenskeeper" is a common word.

**Tagline:** *Your game. Your courses. Your collection.*

Keep the app name in **one place** in code and config. Collectibles, badges and scorecards must not show the app name.

**Voice:** warm, confident, understated, as in the board's copy:

- "Good Afternoon, John"
- "Collect unique items at each course, with tiers that reflect how you play."
- "Meaningful milestones for your game, your exploration, and your collection."
- "An iconic coastal course renowned for its dramatic scenery, historic lineage, and world-class layout."

Short, sincere sentences. No hype or exclamation marks.

---

## 2. Color

These five swatches are from the board's *Brand Elements* section. The hex values were **sampled from the board image** and should be fine-tuned once they're seen in real UI.

| Token | Hex (sampled) | Primary use |
| --- | --- | --- |
| `fairway` | `#1F3D2F` | Brand color: home header, tab bar, app icon background, wordmark, ribbon banners |
| `cream` | `#F2E6CF` | App background, cards, stat tiles, course sheet |
| `gold` | `#BB8B2B` | Accent: wordmark rule, icon emblem, collectible rims, highlighted score cells |
| `slate` | `#486E8B` | Supporting: ocean/sky in illustration, secondary accents |
| `sage` | `#748056` | Supporting: foliage in illustration, muted tags and states |

Supporting neutrals (*proposed*, based on board surfaces):

| Token | Hex | Use |
| --- | --- | --- |
| `paper` | `#EFE2C8` | Aged keepsake scorecard surface |
| `ink` | `#22281F` | Body text and scorecard print on cream/paper |
| `ink-muted` | `#5E6459` | Secondary text, captions |
| `rule` | `#D9CBB0` | Hairlines, scorecard grid lines |
| `pennant` | `#D9622B` | The flag pennant in illustrations only. Never use it in UI. |

### Usage rules

- Most surfaces are cream; fairway anchors the header and tab bar; gold is a thin accent (rules, rims, highlights).
- Gold is never used for body text on cream.
- The orange-red pennant is the only bright color and appears **only in artwork**.

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

## 5. Illustration

There are two styles, both on the board:

1. **Painterly landscape** (heroes, thumbnails, collectible and badge interiors). Gouache or oil texture, bright warm daylight, soft blue sky with clouds, coastal cliffs, ocean, a lighthouse, windswept cypress trees, and wildflowers (orange, pink, yellow) in the foreground.
2. **Engraved line art** (scorecard, small emblems). Pen-and-ink cross-hatching in dark ink on paper.

**Signature motif:** the **lone windswept cypress tree**. It appears on the ball marker, pitch marker, patch, tier coins, the course emblem and the scorecard.

**Secondary motifs:** a flag with an orange pennant on a green, a lighthouse on a headland, coastal cliffs.

---

## 6. Logo & app icon

- **Emblem:** a flag on a pole rising from a sweeping curved green, drawn as a gold swoosh with a fairway shadow.
- **App icon:** the emblem in gold/cream on a **fairway** rounded-square background, with no text.
- **Wordmark:** `GREENS KEEPER` in Playfair Display caps, stacked in two lines when large, with the emblem above.

---

## 7. Real-course branding

The board uses **Pebble Beach** as its example course, for internal reference only. Its name, logo and likeness belong to its owners. Public mockups must use **fictional sample courses** (see [asset-spec.md §7](asset-spec.md#7-sample-courses-for-mockups)). Real course names and art appear in the app only where data and licensing allow it.
