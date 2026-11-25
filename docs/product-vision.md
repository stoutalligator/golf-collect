# Golf App — Product Vision & Working Notes

*Last updated: November 25, 2026*
*Status: Early concept / brainstorming*

## 1. Vision

Build an iOS golf app inspired by the useful parts of **18Birdies** and **Golf GameBook**, combined with the course discovery, collecting, and progression ideas from **Parks Pal**.

The goal is to create a golf app that can become a golfer's primary place to:

- Track rounds and scores.
- Keep a history of courses played.
- Collect course-specific keepsakes and achievement badges.
- Track personal golf statistics and milestones.
- Share rounds and friendly competition with friends.
- Organize leagues, tournaments, and scheduled rounds.

The app should feel like more than a scorecard with badges added. The collecting and personal golf journey should be central to its identity.

Initially, the app may be used by the founders, family, and friends. It should be designed sensibly so it could eventually be released publicly on the App Store.

## 2. Product principles

1. **Score tracking is a core feature.** The app should be useful during and after a round, even without GPS mapping.
2. **Collecting is a major differentiator.** Visiting courses, playing well, and reaching milestones should create meaningful digital keepsakes.
3. **Make the golf journey visible.** Users should be able to look back on courses visited, rounds played, scores, and accomplishments.
4. **Social features should be intentional.** Friends can share rounds and react to one another, without requiring a public, everyone-can-see-everything feed.
5. **Keep future GPS support possible.** GPS and hole maps are desirable future features, but should not block the first useful version.
6. **Build an extensible achievement system.** New badges, collectibles, challenges, and rules should be easy to add over time.
7. **Keep course-data providers interchangeable.** Avoid designing the app around one vendor before coverage, licensing, and costs are understood.

## 3. Core feature areas

### A. Rounds and score tracking

A full round-tracking experience is part of the intended product, not merely a later add-on.

Potential scorecard inputs include:

- Score per hole.
- Par and hole information.
- Putts.
- Fairway hit/miss.
- Green in regulation / missed green.
- Miss direction (for example, left or right).
- Chips and other short-game information.
- Other round statistics that may be useful to analyze performance.

Users should be able to:

- Start and record a regular round.
- View a list and history of their rounds.
- Review the scorecard and statistics from a completed round.
- Play with friends and enter or follow scores as the round progresses.
- Associate a round with a league or tournament when applicable.

The exact set of per-hole inputs should be refined during product design. Keep the score-entry experience practical on the course and avoid making it cumbersome.

### B. Personal profile and golf dashboard

A profile area (or potentially the app's home dashboard) should summarize both golf performance and collecting progress.

Potential information:

- Golf statistics and performance trends.
- Total rounds played.
- Total courses visited.
- Courses visited by region or state.
- Furthest distance traveled to play a course.
- Career birdies and eagles.
- Personal bests.
- Milestones such as breaking 100, 90, or 80.
- Collectibles and badges earned.
- Progress toward course and regional collections.

The dashboard should make it easy to see both **how the user plays** and **where the user has played**.

### C. Course directory and discovery

Users need to find and explore courses.

Initial capabilities:

- Search courses by name and location.
- Start with Connecticut if useful, while allowing the data model to expand to the US and potentially international courses.
- Show where a course is located.
- Identify whether a course is public or private, where reliable information is available.
- Show course details such as description, difficulty, scorecard, and other useful information.
- Display course imagery and/or a course logo when available and permitted.

A map-based directory is not required for the initial experience. A searchable list with useful course details may be a better starting point.

Course information may come from an API, licensed data provider, or appropriately permitted public sources. Do not assume that website text or images can be scraped or reused without checking terms and permissions.

### D. Course collectibles

A central idea is to give every course a unique digital collectible, inspired by physical golf ball markers and course souvenirs.

Possible design:

- A distinctive ball-marker-style collectible for each course.
- Use the course logo, imagery, or another visual identity where permitted.
- Different tiers or treatments based on performance at that course.
- A visual collection that users can browse and feel proud of completing.

Illustrative tiers could include bronze, silver, gold, or platinum. The exact scoring thresholds should be configurable and tested rather than hard-coded as universal standards.

A user's course page could bring together:

- The course collectible and its tier.
- Best score at the course.
- Number of rounds played there.
- Birdies or other stats recorded there.
- Round history at that course.

### E. Badges, achievements, and progression

The app should support a flexible system for achievements based on both performance and participation.

Potential achievement examples:

- First birdie.
- Career birdie milestones (for example, 100 or 500 birdies).
- First eagle.
- Breaking 100, 90, or 80.
- Playing a certain number of rounds.
- Visiting a certain number of courses.
- Playing courses across multiple states or regions.
- Completing a collection or challenge.
- Seasonal or time-based accomplishments.

The achievement system should be designed so new achievement types, thresholds, and rules can be added without major rework.

### F. Friends and social interaction

Users should be able to connect with friends and share golf activity.

Desired capabilities:

- Add or connect with friends.
- See friends' shared rounds and scorecards.
- View scores from friends playing in the same round, potentially as scores are entered.
- Comment on a friend's round.
- React with an emoji or similar lightweight response.

**Product preference:** Do not build a broad public feed where users can browse everyone's posts or scorecards by default. The emphasis should be on a more intentional friends-based experience.

Privacy and sharing controls should be considered from the beginning.

### G. Rounds, leagues, and tournaments

The app should support more than standalone rounds.

Potential capabilities:

- Schedule rounds in advance.
- Create leagues.
- Create tournaments.
- Invite or organize participants.
- Associate a played round with a league or tournament.
- Configure league and tournament rules and settings.
- Support different scoring formats and point systems.
- Aggregate results across rounds so a round contributes to a larger competition.

A normal round should remain a first-class option. A round can be standalone or linked to a league or tournament.

The rules engine should be flexible enough to support different formats without requiring a separate implementation for every competition type.

### H. Events and public challenges (possible later feature)

If the app becomes a public product, events could be an interesting extension.

Examples:

- Complete a specified number of holes within a time window.
- Participate in a time-limited challenge.
- Compare results on an event leaderboard.
- Join public or community challenges.

This is not considered essential for an initial friends-and-family version. Its priority depends on whether the app becomes a public platform.

### I. GPS and hole maps (planned future capability)

GPS is a desired future feature, but it is not a prerequisite for the first useful version.

The founder's personal use case may not require GPS to replace an existing golf app. Other golfers may consider it important, so the app should leave a clear path to add it.

The desired simple experience may be:

- Show an image or map of the current hole.
- Overlay the golfer's GPS position.
- Show the distance to the pin or selected target.
- Allow the golfer to drag or tap on the hole image/map and see the distance to that location.

The initial version does **not** necessarily need:

- Detailed fairway boundary lines.
- Bunker and out-of-bounds overlays.
- Advanced hazard mapping.
- Sophisticated green contours.

A simpler hole image with georeferenced coordinates may be sufficient, if accurate and legally usable data can be obtained. This is an idea to investigate, not yet a confirmed technical approach.

#### GPS technical considerations

Potential iOS building blocks:

- Core Location for the golfer's current position.
- MapKit or a suitable custom map view for presentation.
- Geographic coordinate data for the hole, green, and pin/target.
- Distance calculations performed by the app.

Important distinction:

- Distance to the front, middle, and back of the green can be calculated from mapped green coordinates.
- Distance to the actual daily pin requires the day's pin location, or a way for the user/course to specify it.

GPS accuracy varies, so the interface should communicate approximate distances appropriately.

#### Course mapping data

The key dependency is not basic course discovery. It is reliable **hole-level geographic mapping data**.

Potential data elements:

- Hole imagery or hole outlines.
- Green location and boundaries.
- Front, middle, and back green coordinates.
- Tee locations.
- Optionally fairways, bunkers, water, and other hazards.

Potential providers discussed:

- Golf Intelligence / StrackaGolf.
- GolfCore.
- Other providers or permitted data sources may be evaluated.

No provider has been selected. Coverage, licensing, pricing, caching rules, and the level of detail must be verified before committing.

The app should use a provider-independent course-data layer so a provider can be replaced without redesigning the product.

#### Data coverage and licensing questions

Before selecting a provider, investigate:

1. How many courses are listed in the provider's directory?
2. How many have complete hole-level GPS data?
3. What is the coverage for Connecticut, including municipal and smaller courses?
4. Are course images and logos available, and what are the reuse rights?
5. Can the data be used in a public, commercial iOS app?
6. Are there limits on users, requests, credits, downloads, or caching?
7. Can downloaded course data be stored and reused by the app?
8. How are course layout changes handled?

Previously discussed Golf Intelligence pricing and credit figures were preliminary and must be rechecked directly with the provider before making a decision. Do not treat any quoted plan, credit allowance, or licensing interpretation in these notes as confirmed current terms.

A GPS prototype for one Connecticut course could eventually validate the experience, but it is not a blocker to continuing product design.

## 4. Scorecard visual direction

The scorecard should feel more personal and memorable than a generic table of 18 hole scores.

Design inspiration:

- A physical golf scorecard.
- Course-specific identity, including a logo or course imagery where permitted.
- A polished layout that feels like a keepsake.
- A completed scorecard that users might want to revisit or share.

The scorecard itself could become part of the collecting experience: a round is not just a row in a history list, but a record associated with a particular course and day.

The design still needs to balance visual personality with fast, legible score entry during play.

## 5. Initial navigation / product structure to explore

These are candidate feature destinations, not a finalized navigation design:

- **Play / Rounds:** Start a round, enter scores, view active rounds and round history.
- **Courses:** Search and discover courses; view course details and personal history there.
- **Collection:** Browse course collectibles and regional collections.
- **Achievements:** View badges, milestones, and progress.
- **Profile / Dashboard:** Personal golf stats, courses visited, performance, and overall journey.
- **Friends:** Friends, shared rounds, reactions, and comments.
- **Leagues / Tournaments:** Organize and follow structured competitions.

Some of these may be combined in the final navigation. The information architecture should be designed after the feature set is refined.

## 6. Initial scope and later expansion

### Core experience to design around now

- User profile and personal dashboard.
- Course directory and course details.
- Round creation and score tracking.
- Round history and statistics.
- Course collectibles.
- Badges and achievements.
- Friends and shared rounds.
- Basic league and tournament concepts.
- A distinctive, keepsake-like scorecard.

### Future or optional capabilities

- GPS location and hole maps.
- Distance to green and selected targets.
- Detailed course hazards and advanced mapping.
- Shot tracking and advanced golf analytics.
- Public events and challenges.
- Broader public discovery and competition features.

This is a prioritization guide, not a final release commitment. The first release scope still needs to be agreed.

## 7. Key product decisions still open

- What exact statistics should be captured on each hole?
- Which scoring formats should be supported initially?
- How should course collectible tiers be calculated?
- Should users be able to earn multiple tiers at the same course as their performance improves?
- Which achievements should ship first?
- How should friends, comments, reactions, and privacy work?
- What league and tournament formats are needed first?
- How should a round be linked to one or more competitions?
- What course details and imagery should appear on a course page?
- What should the primary navigation be?
- What should the visual identity and overall tone feel like?
- Which course-data provider offers the best combination of coverage, accuracy, licensing, and cost?

## 8. Suggested next steps

1. Refine and organize the feature list into product areas.
2. Define the round and scorecard data that must be captured.
3. Explore the physical-scorecard-inspired visual direction.
4. Define the profile/dashboard and collection experience.
5. Work through friends, leagues, and tournaments.
6. Keep GPS as a planned module and document the integration points.
7. Compare course-data providers and actual Connecticut mapping coverage before selecting one.
8. Once the product structure is clear, develop screen flows and an initial MVP scope.

---

## Working product statement

*A golf app for tracking your game, discovering courses, collecting the places you've played, and sharing the journey with friends. It combines practical round tracking with course-specific keepsakes, achievements, and friendly competition—while leaving room to grow into a full GPS golf companion.*

*This is a living vision document. Update it as ideas are discussed, decisions are made, and priorities change.*

## 9. Brand direction (working)

### Positioning

A **premium, modern golf collection**: a practical golf companion that makes the places people play, the rounds they remember, and the accomplishments they earn feel worth keeping.

The app should combine:

- A clean, contemporary iOS experience.
- The charm and character of golf heritage.
- A sense of exploration and discovery.
- A collectible, personal-golf-journey identity.

It should feel welcoming to golfers at municipal courses as well as destination and private courses. Avoid making the brand feel exclusive, stuffy, overly traditional, or like generic golf software.

### Visual personality

Working attributes:

- Premium, but approachable.
- Modern, but not sterile.
- Heritage-inspired, but not old-fashioned.
- Distinctive and memorable, not a generic settings/dashboard aesthetic.
- Collectible and expressive, without making the core interface visually cluttered.

### Initial visual direction

The preferred direction is a blend of **Heritage Club** and **Golf Explorer**.

The app interface should remain modern, clear, and easy to use. Heritage and exploration can come through in the artwork, course collectibles, scorecards, badges, typography details, and supporting visual elements.

Potential palette to explore (not finalized):

- Deep forest green as a grounding brand color.
- Warm cream / ivory for warmth and a paper-like heritage reference.
- Muted brass or antique gold as a restrained accent.
- Slate blue as a balancing secondary color.
- Charcoal or deep neutral for readable text and contrast.

Potential design language:

- Modern, highly legible typography for navigation, score entry, statistics, and controls.
- A restrained serif or editorial typeface for selected display moments, course names, or collectible titles.
- Carefully considered textures or paper-inspired details in collectible and scorecard surfaces, rather than throughout every screen.
- Distinctive course artwork and collectible silhouettes.
- Strong, consistent iconography and a recognizable app mark.

### Design guardrails

- Do not make every screen look like a vintage scorecard.
- Do not rely on generic golf clichés or default green-and-white sports-app styling.
- Keep score entry and live-round controls highly legible and efficient.
- Use decorative detail where it adds character; avoid compromising usability.
- Treat course collectibles as a visual system that can accommodate different formats, not one mandatory ball-marker template.

### Open brand decisions

- App name and naming territory.
- Final logo and app icon.
- Exact color values and light/dark appearance.
- Typography pairing.
- Illustration style and level of texture.
- How the brand expresses destination courses versus everyday/local courses.
- Whether the app has a mascot, emblem, monogram, or purely typographic identity.
