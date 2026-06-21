# GolfApp — Future Roadmap

Deferred features and enhancements collected during the PRD phase, organized into sprints. Items here are explicitly **out of scope** for the initial launch but tracked for future phases.

---

## Sprint Planning Notes

- Sprints are ordered by dependency and launch priority.
- Each sprint has a goal, a set of items, and a deliverable definition.
- Time estimates are relative; actual duration depends on available time and blockers.
- Items can be reprioritized, split, or removed as the project evolves.

---

## Sprint 1 — Production Readiness & Launch Foundation
**Release:** v1.1.0

**Goal:** Move the app from localhost to a live, stable production environment.

- **Hosting platform setup** — Deploy to Vercel with environment variables configured (Supabase URL/keys, MapTiler key).
- **Custom domain** — Configure a custom domain or professional subdomain.
- **Build optimization** — Ensure production build passes, configure caching headers, optimize bundle size.
- **Database migrations** — Run all Supabase migrations on the production database.
- **Production smoke testing** — Full user flow on the live URL: register → create course → play round → view stats → tournament → leaderboard.
- **Monitoring** — Set up error tracking (e.g., Sentry) and analytics for production performance.
- **Forgot password flow** — Add "Forgot password?" link to login, trigger Supabase `resetPasswordForEmail`, and build a reset page at `/auth/reset-password`.
- **Admin nav link** — Show "Admin" in desktop sidebar and mobile tab bar only when `profiles.role = 'admin'`.

**Deliverable:** App is live on a custom domain, core monitoring is in place, and critical pre-launch gaps (password recovery, admin access) are closed.

---

## Sprint 2 — Performance & Speed
**Release:** v1.2.0

**Goal:** Make the app feel fast in production.

- **Route prefetching** — Add `prefetch={true}` to all navigation links.
- **React.memo** — Memoize list components (CourseCard, TournamentCard, nav links) to prevent unnecessary re-renders.
- **Code splitting** — Apply dynamic imports beyond maps where bundle analysis shows heavy components.
- **Supabase query optimization** — Review and add indexes for frequently queried columns (`user_id`, `course_id`).
- **Server-side data fetching** — Convert client-side `useEffect` data fetching to server components where possible.
- **Production performance investigation** — Profile bundle size, Supabase query latency, and Vercel cold-start impact; implement edge caching for static course data.

**Deliverable:** Initial page load <2s and route transitions <500ms on average.

---

## Sprint 3 — Core UX Polish
**Release:** v1.3.0

**Goal:** Improve the daily scoring and course discovery experience.

- **Auto-request GPS on Play page entry** — Request browser geolocation on load, show nearby courses with configurable search radius (25 km / 50 km / 100 km / 200 km), fallback to search box if denied.
- **Configurable search radius** — Let users select radius when searching by location.
- **Quick Score mode** — Default to a simplified hole-by-hole view when starting a round, with compact scoring (strokes, putts, GIR) and a "Next Hole" button; include a "View Full Scorecard" link.
- **Course detail satellite map** — Full satellite map on every course detail page with hole pin markers and overlays.
- **Tap-to-measure on maps** — Tap any point on a course/hole map to see distance from current GPS position.
- **Casual round guest players** — Allow adding friends by name during a standalone round, saved as guest players.
- **Allow self-selection in predictions** — Remove the `otherParticipants` filter so users can predict themselves.

**Deliverable:** The core play and scoring flow is significantly smoother and more usable on mobile.

---

## Sprint 4 — Admin Curation & Data Quality
**Release:** v1.4.0

**Goal:** Give admins the tools to curate and verify course data.

- **Admin dashboard home screen** — Checklist of curation tasks, progress bars, and quick actions.
- **Admin-only navigation** — Navigation items visible only when `profiles.role = 'admin'`.
- **Hole-by-hole editor** — Update `par`, `handicap_index`, `pin_location`, and `green_front/center/back` for every course.
- **Tee set editor** — Add tee sets per course with name, color, `course_rating`, `slope_rating`, and per-hole yardages.
- **Course verification wizard** — Confirm course name, address, city, province, GPS coordinates, and number of holes.
- **Verified course data system** — Flag courses as verified, display verification badge, and allow admins to mark verified/unverified.
- **Change request review** — Admin UI to view, approve/reject user-submitted `course_change_requests` and apply changes.
- **Bulk course import** — Upload CSV of course names + coordinates to seed new provinces or countries.

**Deliverable:** Admins can fully verify and maintain course data without manual database edits.

---

## Sprint 5 — Data Sources & Advanced Course Info
**Release:** v1.5.0

**Goal:** Enrich course data with authoritative sources and accurate handicap support.

- **External course database API integration** — Connect to a comprehensive course data API (e.g., GolfNow, BlueGolf) for par, yardage, ratings, and hole details.
- **GolfRSA / HNA integration** — Pull official course ratings, slope ratings, and handicap indexes if API access is available.
- **OSM fallback deprecation** — Remove OpenStreetMap import and rely on curated/community data.
- **Full WHS compliance** — Upgrade from simplified average-based handicap to full World Handicap System calculation (best 8 of 20 differentials with course rating/slope adjustments).
- **Course condition reporting** — Let users report green speed, wetness, maintenance status, and general conditions.
- **Weather overlay** — Integrate a free weather API for current and forecasted conditions at the course being played.

**Deliverable:** Course data is authoritative and handicaps follow WHS rules.

---

## Sprint 6 — Engagement & Social Features
**Release:** v1.6.0

**Goal:** Increase user retention, sharing, and competition.

- **Google OAuth** — Sign in with Google via Supabase Auth.
- **Apple OAuth** — Sign in with Apple for iOS/Safari users.
- **Push notifications** — Browser push for score updates, leaderboard changes, tournament invitations, and friend activity.
- **Email notifications** — Fallback for platforms with poor push support.
- **Tournament scaling** — Increase the 20-participant limit as infrastructure allows.
- **Additional tournament formats** — Add Mixed, Shamble variations, and custom scoring rules.
- **Achievements & badges** — Milestone badges like "First Eagle", "Break 80", "Hole in One", "100 rounds played".
- **Streak tracking** — Consecutive rounds under par, no 3-putts, FIR > 50%, shown on profile and dashboard.
- **Leaderboards** — Course records, seasonal rankings, and skill-based leaderboards.
- **Points system** — Earn points for rounds, shares, tournaments, and referrals; unlock visual rewards.

**Deliverable:** Users can sign in faster, get notified, compete in more formats, and track achievements.

---

## Sprint 7 — Native & Wearable Apps
**Release:** v2.0.0

**Goal:** Expand to native platforms with full feature parity.

- **iOS app** — Native Swift/SwiftUI app with full feature parity.
- **Android app** — Native Kotlin app with full feature parity.
- **Apple Watch app** — Distance to pin (front/center/back), shot distance measurement, and hole score entry.
- **Wear OS app** — Same feature set as Apple Watch.

**Deliverable:** Core GolfApp features are available natively on iOS and Android, plus wearable score entry.

---

## Sprint 8 — Monetization & Ecosystem
**Release:** v3.0.0

**Goal:** Build a sustainable product and broader community.

- **Freemium model** — Core features free; premium tier for advanced analytics, stat breakdowns, trend analysis, and historical comparisons.
- **Advanced statistics dashboard** — Strokes gained analysis, scoring trends, club distance averages, and course-specific performance.
- **CSV/PDF enhancements** — Richer exports, season summaries, and shareable round graphics.
- **Friend performance comparisons** — Head-to-head stats, scoring average, handicap trends, and visual charts.
- **Multi-language / localization** — Support for Afrikaans and other languages.
- **Course reviews and ratings** — Community reviews and star ratings for courses.
- **Video upload and analysis** — Record/review swings with annotation tools.
- **AI swing tips / coaching** — AI-powered swing analysis and improvement suggestions.
- **Tee time booking** — Integration with course booking systems.
- **Local golf communities** — Create or join local golf groups, organize meetups, find playing partners.
- **Real-money betting integration** — Optional integration with licensed betting platforms.
- **E-commerce / pro shop** — Equipment recommendations or partnerships.
- **Integration with external handicap systems** — Sync with official golf unions (e.g., GolfRSA) if API access is available.

**Deliverable:** Premium tier, community features, and ecosystem integrations are available.

---

*This document is a living roadmap. Sprints and items may be reprioritized, split, or removed as the project evolves.*
