# Course overrides (optional, one-off)

**Group:** Overrides  ·  **Prompt:** [overrides/](../_prompts/overrides/)

**Replaces:** The shared region/frame art, for **one** course. Used for destination courses or a special collectible.

## Requirements

| | |
|---|---|
| **Final size** | **Hero 1290 × 860 · engraving 1200 × 400 · collectible 1024 × 1024** |
| **Format** | Same as the shared asset it replaces; a collectible override is the **complete finished item** (the app adds no layers or text) |
| **Export** | Same as the shared asset it replaces (hero: opaque; engraving and collectible: with alpha). |
| **File size** | Same as the shared asset |
| **Files to make** | 0 |

## Where it appears

| Screen | Rendered size | Screenshot |
|---|---|---|
| Same places as the shared asset | — | — |

## Safe zone & composition

Same safe zones as the region hero, region engraving and frames.

## Notes

List the course in `src/data/config/art-overrides.json` (`hero`, `scorecardEngraving`, `collectibles: [ids]`), then run `npm run art:prompts` to get its prompt file. Lookup order: course override → region → vector placeholder.

## Acceptance checklist

- [ ] Only for courses that deserve it. Everything else uses shared art.
- [ ] Saved at the exact path below, then `npm run art:sync`.

## Files & prompts

*None configured.*
