# Product Requirements Document: GolfApp

## 1. Feature Name

**GolfApp** — A comprehensive golf companion web app for scoring, GPS, tournaments, and social play.

## 2. Summary

GolfApp is a Progressive Web App (PWA) that serves as an all-in-one golf companion, inspired by Squabbit but with additional features. It allows golfers to select courses, track scores with granular detail (shots, putts, fairways hit, greens in regulation), view GPS distances to pins and hazards, manage tournaments and leagues with live leaderboards, maintain an automatically calculated handicap, and engage in social prediction/betting games — all for free. The app targets South African golfers first but supports worldwide use through OpenStreetMap course data and community contributions.

## 3. Goals

- **Course selection & GPS**: Let users find and select golf courses with full GPS support — distances to pin, hazards, bunkers, yardage circles, satellite map overlay, and shot distance measurement.
- **Detailed scoring**: Provide hole-by-hole scoring that tracks strokes, putts, fairways hit (FIR), greens in regulation (GIR), penalties, club used per shot, and lie type.
- **Handicap tracking**: Automatically calculate and maintain a handicap index (simplified formula initially, upgradeable to full WHS once course rating/slope data is available) that updates after each completed round.
- **Tournaments & leagues**: Allow users to create and manage tournaments and recurring leagues with multiple formats, real-time leaderboards, and easy player invitations.
- **Social betting/predictions**: Enable fun, no-money prediction games where players vote on winners, guess scores, and earn bragging rights.
- **Offline-first**: Work reliably on golf courses with poor cell coverage, syncing data when connectivity returns.
- **Community course data**: Build a growing course database through user contributions, supplementing OpenStreetMap data with detailed scorecards and hole information.

## 4. Non-Goals

- **Native mobile app**: This is a PWA, not a native iOS/Android app (though it should be installable and feel native).
- **Smartwatch app**: No Apple Watch or Wear OS companion app at launch.
- **Real-money betting/gambling**: The prediction system is for fun only — no real money transactions.
- **Tee time booking**: The app does not integrate with course booking systems.
- **Swing analysis or AI coaching**: No video analysis or AI-powered swing tips.
- **E-commerce**: No pro shop, equipment sales, or merchandise.

## 5. User Stories

### Course & GPS
1. As a **golfer**, I want to search for and select the course I'm playing, so that I can see all holes with their par, yardage, and layout.
2. As a **golfer on the course**, I want to see my GPS distance to the pin, front/back of green, and hazards, so that I can make better club selections.
3. As a **golfer**, I want to measure my shot distances using GPS, so that I can track how far I hit each club.
4. As a **golfer**, I want to see a satellite map overlay with yardage circles, so that I can visualize distances on each hole.

### Scoring
5. As a **golfer**, I want to record my score for each hole including strokes, putts, penalties, fairway hit, green in regulation, club used, and lie type, so that I have detailed round statistics.
6. As a **golfer**, I want to view my round summary with stats like total score, putts per round, FIR %, GIR %, and scoring average by hole type (par 3/4/5), so that I can identify areas to improve.
7. As a **golfer**, I want to enter scores while offline and have them sync when I regain connectivity, so that poor cell coverage doesn't disrupt my round.

### Handicap
8. As a **golfer**, I want my handicap index to be automatically calculated and updated after each round using a simplified formula (with future upgrade path to full WHS), so that I always have an up-to-date handicap.
9. As a **golfer**, I want to see my handicap history and how it has changed over time, so that I can track my improvement.

### Tournaments & Leagues
10. As a **tournament organizer**, I want to create a tournament, choose a format (Stroke Play, Stableford, Best Ball, Scramble, Match Play, Ryder Cup, Skins, etc.), and invite players, so that we can compete together.
11. As a **tournament participant**, I want to see a live leaderboard that updates in real-time as scores are entered, so that I know where I stand during the round.
12. As a **league manager**, I want to create recurring league events with season-long leaderboards, so that our group can track standings over multiple rounds.
13. As a **tournament organizer**, I want to easily add new players to a tournament via invite link, even if they don't have an account yet, so that anyone can participate.

### Social & Predictions
14. As a **player in a tournament**, I want to vote on who I think will win, predict scores for specific players, and see prediction results, so that we have fun side competitions.
15. As a **player**, I want to participate in group chat and share photos within a tournament, so that the experience is social and engaging.
16. As a **golfer**, I want to add friends, share completed rounds, and see an activity feed of my friends' rounds, so that I stay connected with my golf network.

### Course Data
17. As a **golfer**, I want to add a new course to the database with hole-by-hole details (par, yardage, handicap index) if my course isn't listed, so that I can still use the app.
18. As a **golfer**, I want to request changes to course data if it is incorrect or outdated, so that admins can review and update the community database.
19. As an **admin**, I want to review and approve/reject course data change requests, so that the database stays accurate and trusted.

### Data Export
20. As a **golfer**, I want to export my scorecards as CSV or PDF, so that I can keep records or share them outside the app.

## 6. Acceptance Criteria

### Course Selection & GPS
- **Given** a user opens the app, **when** they search for a course by name or browse nearby courses, **then** the app returns matching results from the database (OSM + community data).
- **Given** a user selects a course, **when** the course has hole data, **then** all holes are displayed with par, yardage, and handicap index per hole.
- **Given** a user is on the course with GPS enabled, **when** they view a hole, **then** the app shows distance to pin (front/center/back of green), and distances to visible hazards/bunkers.
- **Given** a user enables shot tracking, **when** they mark their shot start and end positions, **then** the app calculates and displays the shot distance.
- **Given** a user views a hole map, **when** satellite imagery is available, **then** yardage circles are overlaid on the map.

### Scoring
- **Given** a user is scoring a hole, **when** they enter their data, **then** the app accepts: strokes, putts, penalty strokes, fairway hit (yes/no/N/A for par 3s), GIR (yes/no), club used per shot, and lie type.
- **Given** a user completes a round, **when** they view the summary, **then** statistics include: total score, score vs par, total putts, putts per hole average, FIR %, GIR %, scoring average by par 3/4/5, up-and-down %, and sand save %.
- **Given** a user loses connectivity mid-round, **when** they continue scoring, **then** scores are saved locally and synced to the server when connectivity returns.

### Handicap
- **Given** a user has completed at least 3 rounds, **when** they view their profile, **then** a handicap index is displayed calculated using a simplified average-based formula (average of best differentials). If course rating/slope data is available, the calculation uses adjusted differentials; otherwise it uses score-vs-par differentials.
- **Given** a user completes a new round, **when** the round is finalized, **then** the handicap index is recalculated automatically.
- **Given** a user views their handicap, **when** they tap on it, **then** they can see the history of handicap changes over time.

### Tournaments & Leagues
- **Given** a user creates a tournament, **when** they configure it, **then** they can select format (Stroke Play, Stableford, Best Ball, Scramble, Match Play, Ryder Cup, Alternate Shot, Skins, Shamble, 2-Person Scramble), set the course, date, number of holes (9 or 18), and a maximum of 20 participants.
- **Given** a tournament is in progress, **when** any participant enters a score, **then** the leaderboard updates in real-time for all participants (within 3 seconds via WebSocket).
- **Given** a user creates a tournament, **when** they share the invite link, **then** recipients can join the tournament with or without an existing account.
- **Given** a league exists, **when** a new event is completed, **then** the season standings are updated automatically.
- **Given** a tournament is complete, **when** a user views results, **then** they can see final leaderboard, per-player scorecards, and stats.

### Predictions / Betting
- **Given** a tournament is created, **when** it hasn't started yet, **then** participants can make predictions: vote for winner, predict specific player scores, predict best/worst performer.
- **Given** predictions are locked (tournament started), **when** the tournament ends, **then** prediction results are displayed with a prediction leaderboard showing who predicted most accurately.
- **Given** a prediction game is active, **then** no real money is involved — it is purely points/bragging rights.

### Social
- **Given** a tournament exists, **when** a participant posts a message or photo, **then** all participants see it in the tournament chat.
- **Given** a user completes a round, **when** they choose to share it, **then** it appears in their friends' activity feeds.
- **Given** a user searches for another user, **when** they send a friend request, **then** the recipient can accept/decline.

### Course Data Community
- **Given** a user's course is not in the database, **when** they add a new course, **then** they can enter: course name, location (GPS or address), and hole-by-hole data (par, yardage per tee set, handicap index).
- **Given** a user finds incorrect course data, **when** they submit a change request, **then** the request is queued for admin review.
- **Given** an admin reviews a course data change request, **when** they approve it, **then** the course data is updated. If rejected, the requester is notified with a reason.

### Data Export
- **Given** a user views a completed round, **when** they export it, **then** they can download a CSV or PDF scorecard.

## 7. Technology Constraints

- **Platform**: Progressive Web App (PWA) — must be installable on mobile devices with service worker support for offline functionality.
- **Course Data Source**: OpenStreetMap via Overpass API (free, worldwide, no API key) for course discovery and GPS coordinates. Supplemented by a community-maintained course database for detailed scorecard data (par, yardages, slope, rating).
- **Map Tiles**: Free map tile providers (e.g., OpenStreetMap tiles, MapTiler free tier, or Stadia Maps free tier) with satellite imagery for course views.
- **GPS**: Browser Geolocation API for GPS positioning.
- **Real-time**: WebSocket or Server-Sent Events for live leaderboard updates and push notifications.
- **Cost**: All external services and APIs must be free or have a sufficient free tier. No paid APIs or data sources.
- **Authentication**: Email/password + Google and Apple social login. Invite links for guest access to tournaments.
- **License compliance**: ODbL attribution required for OpenStreetMap data usage.

## 8. Out of Scope

- **Native mobile apps** (iOS/Android) — deferred to a future phase.
- **Smartwatch companion apps** — deferred.
- **Real-money betting or payment processing** — explicitly excluded.
- **Tee time booking integration** — deferred.
- **AI swing analysis or coaching** — deferred.
- **Video upload and analysis** — deferred.
- **Course condition reporting** (e.g., green speed, wetness) — deferred to a future phase.
- **Weather overlay** — deferred to a future phase (can be added via free weather APIs later).
- **Multi-language / localization** — English only at launch.

## 9. Open Questions

1. **Satellite imagery source**: Free high-quality satellite imagery for course maps is limited. Options include MapTiler (free tier: 100k tiles/month), Stadia Maps, or Bing Maps (free for non-commercial). Which provider offers the best free tier for our needs? Needs investigation during tech spec.
2. **OSM coverage in South Africa**: OpenStreetMap golf course coverage in South Africa needs verification. If coverage is sparse, the app will rely more heavily on community-contributed course data at launch.
3. **Handicap — WHS full compliance**: Resolved — launch with a simplified handicap calculation (average-based differentials using score vs par). Upgrade to full WHS calculation in a future phase once the database has sufficient course rating and slope data.
4. **Moderation**: Resolved — only admins can edit course data. Regular users can submit change requests that admins review and approve/reject.
5. ~~**Push notifications**~~: Resolved — not needed at launch. Deferred to a future phase.
6. **Tournament size limits**: Resolved — maximum 20 participants per tournament at launch. Can be scaled up in future phases.
7. **Data privacy / POPIA compliance**: Since the primary user base is South African, the app must consider POPIA (Protection of Personal Information Act) requirements. Needs review during tech spec.
