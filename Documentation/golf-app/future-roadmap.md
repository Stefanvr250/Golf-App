# GolfApp — Future Roadmap

Deferred features and enhancements collected during the PRD phase. Items here are explicitly **out of scope** for the initial launch but tracked for future phases.

---

## Phase 1.5 — Production Deployment

Move from localhost development to live production hosting for active use and demonstrations:
- **Hosting platform setup** — Deploy to Vercel (or similar) with environment variables configured (Supabase URL/keys, MapTiler key)
- **Custom domain** — Configure custom domain (e.g., golfapp.com or subdomain) for professional appearance
- **Build optimization** — Ensure production build passes, configure caching headers, optimize bundle size
- **Database migrations** — Run all Supabase migrations on production database
- **Testing on production** - Full user flow testing on live URL: register → create course → play round → view stats → tournament → leaderboard
- **Monitoring** — Set up error tracking (e.g., Sentry) and analytics to monitor production performance

---

## Phase 1.5 — Performance Optimization

Quick wins identified for improving page load responsiveness:
- **Route prefetching** - Add `prefetch={true}` to all navigation links to pre-load routes on hover
- **React.memo** - Memoize list components (CourseCard, TournamentCard, nav links) to prevent unnecessary re-renders
- **Code splitting** - Maps are already dynamically imported, but other heavy components could benefit
- **Supabase query optimization** - Review indexes for frequently queried columns (user_id, course_id)
- **Server-side data fetching** - Convert client-side useEffect data fetching to server components where possible

Target: <2s initial load, <500ms route transitions.

---

## Phase 1.5 — Admin Onboarding & Data Curation

Dedicated admin interface for the first admin account to complete before full launch. These are operational tasks, not public features, but they are critical for launch quality.

### Admin Dashboard
- **Admin home screen** — Show checklist of curation tasks, progress bars, and quick actions.
- **Admin-only navigation items** — Only visible when `profiles.role = 'admin'`.

### Course Curation Checklist
- **Hole-by-hole editor** — Update `par`, `handicap_index`, `pin_location`, `green_front/center/back` for every seeded course.
- **Tee set editor** — Add tee sets per course with `name`, `color`, `course_rating`, `slope_rating`, and per-hole yardages.
- **Course verification wizard** — Confirm course name, address, city, province, GPS coordinates, and number of holes.
- **Bulk course import** — Upload CSV of course names + coordinates to seed new provinces or countries.
- **Change request review** — Admin UI to view, approve/reject user-submitted `course_change_requests` and apply changes to the database.
- **Verified course data system** — Flag courses as "verified" when official data is confirmed (slope, rating, hole details). Display verification badge on course cards. Allow admins to mark courses as verified/unverified.

### Search & Discovery
- **Configurable search radius** — Let users select 25 km, 50 km, 100 km, or 200 km when using 

### Data Sources
- **External course database API integration** — Connect to a comprehensive course data API (e.g., GolfNow, BlueGolf, or similar) to fetch complete course information: par per hole, total course length, hole-by-hole yardage, pin placement data, tee box locations and yardages, hole handicap indexes, course rating, slope rating. Replace/supplement local DB and OSM data with authoritative source.
- **GolfRSA / HNA integration** — If API access becomes available, pull official course ratings, slope ratings, and handicap indexes.
- **OSM fallback deprecation** — Remove OpenStreetMap import entirely; keep only curated community data.

---

## Phase 1.5 — UX & Polish (Post-Deployment)

Items identified during production testing and user feedback session (2025-06-21).

### Play Page & Course Discovery
- **Auto-request GPS on Play page entry** — On page load, request browser geolocation and immediately show nearby courses with configurable search radius (25 km / 50 km / 100 km / 200 km). Fallback to search box if GPS denied.
- **Course detail satellite map** — Show a full satellite map on every course detail page with hole pin markers. Allow browsing holes on the map and seeing hole info overlays.
- **Tap-to-measure on maps** — On any course/hole map, allow the user to tap any point and see the distance in meters/yards from their current GPS position. Useful for planning shots to hazards, lay-up spots, etc.

### Scoring Flow
- **Hole-by-hole "Quick Score" mode** — When starting a round, default to a simplified hole-by-hole view that starts at Hole 1. Show a compact scoring card (strokes, putts, GIR), then a big "Next Hole" button. Include a "View Full Scorecard" button at the top that takes you to the existing grid view.
- **Casual round guest players** — When starting a standalone (non-tournament) round, allow the user to add friends by name even if they don't have an account. Scores are saved under a "guest player" concept so the user can track scores for their foursome.

### Predictions
- **Allow self-selection in predictions** — Remove the `otherParticipants` filter so a user can predict themselves as winner, best performer, etc.

### Authentication
- **Forgot password flow** — Add "Forgot password?" link to the login page. Trigger Supabase `resetPasswordForEmail` and build a password reset page at `/auth/reset-password`.

### Admin
- **Admin nav link** — Show an "Admin" nav item (desktop sidebar + mobile tab bar) only when `profiles.role = 'admin'`. Currently the admin pages exist but are unreachable without direct URL access.

### Performance (Production)
- **Investigate 3-5s page loads** — All pages feel sluggish on production. Profile bundle size, Supabase query latency, and Vercel cold-start impact. Consider edge caching for static course data and optimizing Supabase indexes.

---

## Phase 2 — Enhanced Features

### Handicap
- **Full WHS compliance** — Upgrade from simplified average-based handicap to full World Handicap System calculation (best 8 of last 20 differentials with course rating and slope adjustments) once the database has sufficient course rating/slope data.

### Tournaments
- **Scale tournament size** — Increase the 20-participant limit as infrastructure allows.
- **Additional formats** — Add more tournament formats beyond the initial set (e.g., Mixed, Shamble variations, custom scoring rules).

### Authentication
- **Google OAuth** — Sign in with Google via Supabase Auth for faster onboarding.
- **Apple OAuth** — Sign in with Apple for iOS/Safari users.

### Notifications
- **Push notifications** — Browser push notifications for score updates, leaderboard changes, tournament invitations, and friend activity.
- **Email notifications** — Fallback notification system for platforms with poor push support (e.g., iOS Safari).

### Course Data
- **Course condition reporting** — Allow users to report green speed, course wetness, maintenance status, and general conditions.
- **Weather overlay** — Integrate a free weather API to show current and forecasted weather conditions for the course being played.

### Gamification
- **Achievements & badges** — Unlock badges for milestones like "First Eagle", "Break 80", "Hole in One", "Consecutive rounds under par", "100 rounds played". Display badge collection on profile.
- **Streak tracking** — Track consecutive rounds under par, consecutive rounds with no 3-putts, consecutive rounds with FIR > 50%. Show streak counters on profile and dashboard.
- **Leaderboards** — Beyond tournaments, add course record leaderboards (best score per course), seasonal rankings (best performers over time period), and skill-based leaderboards (by handicap range).
- **Points system** — Earn points for completing rounds, sharing scores, participating in tournaments, referring friends. Points unlock visual rewards or status indicators.

---

## Phase 3 — Platform Expansion

### Native Mobile Apps
- **iOS app** — Native Swift/SwiftUI app with full feature parity.
- **Android app** — Native Kotlin app with full feature parity.

### Smartwatch
- **Apple Watch app** — Distance to pin (front/center/back), shot distance measurement, hole score entry from the wrist.
- **Wear OS app** — Same feature set as Apple Watch for Android users.

---

## Phase 4 — Advanced Features

### Monetization
- **Freemium model** — Core features remain free. Premium tier for advanced analytics, detailed stat breakdowns, trend analysis, and historical comparisons.

### Social & Engagement
- **Real-money betting integration** — Optional integration with licensed betting platforms (subject to regulatory review).
- **AI swing tips / coaching** — Video upload with AI-powered swing analysis and improvement suggestions.
- **Tee time booking** — Integration with course booking systems.
- **Local golf communities** — Create or join local golf groups, organize meetups, find playing partners based on skill level and location.

### Data & Analytics
- **Advanced statistics dashboard** — Strokes gained analysis, scoring trends, club distance averages over time, course-specific performance breakdowns.
- **CSV/PDF enhancements** — Richer export formats, season summaries, shareable round graphics.
- **Friend performance comparisons** — Compare stats directly against friends: scoring average, handicap trends, head-to-head records, course performance comparisons, stat-by-stat breakdowns (FIR %, GIR %, putts/round). Visual comparison charts.

### Content
- **Multi-language / localization** — Support for Afrikaans and other languages beyond English.
- **E-commerce / pro shop** — Equipment recommendations or partnerships (if monetization is pursued).

---

## Phase 5 — Ecosystem

- **Video upload and analysis** — Record and review swings with annotation tools.
- **Course reviews and ratings** — Community reviews and star ratings for courses.
- **Integration with external handicap systems** — Sync with official golf unions (e.g., GolfRSA) if API access becomes available.

---

*This document is a living roadmap. Items may be reprioritized, split, or removed as the project evolves.*
