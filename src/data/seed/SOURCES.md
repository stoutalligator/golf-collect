# Course data sources

*Generated from `courses.ct.json` on 2026-11-25. Rebuild with `node scripts/courses/build-ct-seed.mjs` (add `--refresh` to re-fetch).*

## Method

1. **Primary source: [OpenGolfAPI](https://opengolfapi.org)** (data © OpenStreetMap contributors, **ODbL 1.0**). It provides par, stroke index, tees, rating/slope, hole yardages and coordinates.
2. **Automated checks** on every course: 18 holes, stroke index is exactly 1–18, pars between 3 and 6, and the hole pars sum to the listed par. If a tee's hole yardages are more than 1.5% off its stated total, they are **dropped** (set to `null`) rather than guessed.
3. **Second-source cross-checks** against GolfPass scorecards, plus official course sites or scorecards where the sources conflicted.
4. **Descriptions** are generated from the verified facts. No text, logos or photos are copied from any source.

## Verification levels

- **official**: matches the course's own published scorecard.
- **cross-checked**: two independent sources agree.
- **single-source**: OpenGolfAPI only, and all automated checks pass. Good enough for the mock; verify before any public release.

## Licensing note

ODbL requires **attribution** ("© OpenStreetMap contributors (ODbL 1.0) via OpenGolfAPI") anywhere the data is shown publicly. It also requires **share-alike** if we publish a derived database. Settle this before App Store release; see the provider questions in [product-vision.md](../../../docs/product-vision.md).

## Courses

| Course | Town | County | Access | Par | Status | Tees (with hole yds) | Notes |
|---|---|---|---|---|---|---|---|
| Keney Park Golf Course | Windsor | Hartford | public | 70 | **cross-checked** | 4 (4) | Cross-checked: par, stroke index, Gold & Blue hole yardages, all tee ratings. |
| Wintonbury Hills Golf Course | Bloomfield | Hartford | municipal | 70 | **single-source** | 4 (4) | — |
| Airways Golf Course | West Suffield | Hartford | public | 71 | **official** | 3 (3) | OpenGolfAPI par and stroke index match the official card; its Blue hole yardages did not, so all hole yardages and ratings come from the official card. GolfPass shows an older par-69 layout and was disregarded. |
| Simsbury Farms Golf Club | Simsbury | Hartford | public | 72 | **single-source** | 4 (3) | Blue: hole yardages sum to 6597 vs. stated 6509. White: hole yardages sum to 6178 vs. stated 6119. Gold: hole yardages sum to 5781 vs. stated 5800. Red: hole yardages sum to 4655 vs. stated 5400; hole breakdown omitted. |
| Timberlin Golf Club | Berlin | Hartford | municipal | 72 | **single-source** | 5 (5) | — |
| TPC River Highlands | Cromwell | Middlesex | private | 70 | **single-source** | 6 (6) | Tournament: hole yardages sum to 6852 vs. stated 6841. |
| Lyman Orchards (Player Course) | Middlefield | Middlesex | public | 71 | **single-source** | 4 (0) | Gold: hole yardages sum to 4698 vs. stated 6725; hole breakdown omitted. Blue: hole yardages sum to 6115 vs. stated 6325; hole breakdown omitted. White: hole yardages sum to 5633 vs. stated 5890; hole breakdown omitted. Red: hole yardages sum to 3744 vs. stated 4900; hole breakdown omitted. |
| Lyman Orchards (Jones Course) | Middlefield | Middlesex | public | 72 | **single-source** | 4 (4) | — |
| Fox Hopyard Golf Club | East Haddam | Middlesex | private | 71 | **single-source** | 5 (1) | Blue: hole yardages sum to 6382 vs. stated 6512; hole breakdown omitted. White: hole yardages sum to 5920 vs. stated 6109; hole breakdown omitted. Gold: hole yardages sum to 5399 vs. stated 5657; hole breakdown omitted. Red: hole yardages sum to 4775 vs. stated 5111; hole breakdown omitted. Site describes itself as a private, membership club. |
| Shennecossett Golf Course | Groton | New London | municipal | 71 | **cross-checked** | 3 (2) | Cross-checked: par, stroke index, Blue & White hole yardages, tee ratings. |
| Lake of Isles (North Course) | North Stonington | New London | public | 72 | **single-source** | 5 (5) | — |
| Alling Memorial Golf Course | New Haven | New Haven | municipal | 72 | **single-source** | 3 (3) | — |
| Richter Park Golf Course | Danbury | Fairfield | public | 71 | **single-source** | 4 (0) | Blue: hole yardages sum to 6547 vs. stated 6744; hole breakdown omitted. White: hole yardages sum to 6119 vs. stated 6304; hole breakdown omitted. Gold: hole yardages sum to 5335 vs. stated 5531; hole breakdown omitted. Red: hole yardages sum to 4922 vs. stated 5114; hole breakdown omitted. |
| Tashua Knolls Golf Course | Trumbull | Fairfield | municipal | 72 | **single-source** | 6 (4) | — |
| H. Smith Richardson Golf Course | Fairfield | Fairfield | municipal | 72 | **single-source** | 3 (2) | Black: hole yardages sum to 6734 vs. stated 6704. |
| Crestbrook Park Golf Course | Watertown | Litchfield | municipal | 71 | **single-source** | 5 (4) | — |
| Norwich Golf Club | Norwich | New London | municipal | 71 | **cross-checked** | 4 (4) | OpenGolfAPI hole pars garbled; hole pars and yardages from GolfPass (pars total 71, stroke index matches OpenGolfAPI, all tee totals match). Ratings conflict (GolfPass Blue 69.4/125 vs. 70/131); OpenGolfAPI's kept. Club site unreachable (expired certificate): needs the current card. |
| Cedar Knob Golf Course | Somers | Tolland | public | 72 | **cross-checked** | 4 (4) | OpenGolfAPI hole pars garbled; hole pars and yardages from GolfPass (stroke index matches OpenGolfAPI). Course site confirms Blue/White/Red totals and ratings. Gold has no rating. |
| Chippanee Golf Club | Bristol | Hartford | private | 70 | **official** | 3 (3) | Official card on chippanee.com. OpenGolfAPI's 2 extra holes dropped; Red hole 18 is 345 (others show 305); card's White 18 '56' is a typo for 356. Ratings from the card (match GolfPass). |

### Extra sources

- **Keney Park Golf Course**: [GolfPass scorecard](https://www.golfpass.com/travel-advisor/courses/341-keney-park-golf-club/scorecard-and-layout)
- **Airways Golf Course**: [Airways Golf Course official scorecard (airwaysgolf.com/golf.html, scorecard images)](http://www.airwaysgolf.com/golf.html)
- **Fox Hopyard Golf Club**: [Fox Hopyard official site](https://www.foxhopyard.com/)
- **Shennecossett Golf Course**: [GolfPass scorecard](https://www.golfpass.com/courses/4366-shennecossett-golf-club/scorecard-and-layout)
- **Norwich Golf Club**: [GolfPass scorecard](https://www.golfpass.com/courses/4403-norwich-golf-club/scorecard-and-layout) · [City of Norwich: Golf Course Authority](https://norwichct.gov/141/Golf-Course-Authority)
- **Cedar Knob Golf Course**: [GolfPass scorecard](https://www.golfpass.com/courses/4426-cedar-knob-golf-course/scorecard-and-layout) · [Cedar Knob course details](http://www.cedarknobgolfcourse.com/course-details) · [rates](http://www.cedarknobgolfcourse.com/rates)
- **Chippanee Golf Club**: [Chippanee official scorecard](https://chippanee.com/FACILITIES/Golf.aspx) · [GolfPass scorecard](https://www.golfpass.com/courses/4322-chippanee-golf-club/scorecard-and-layout)
