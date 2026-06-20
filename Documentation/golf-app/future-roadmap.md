# GolfApp — Future Roadmap

Deferred features and enhancements collected during the PRD phase. Items here are explicitly **out of scope** for the initial launch but tracked for future phases.

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

### Search & Discovery
- **Configurable search radius** — Let users select 25 km, 50 km, 100 km, or 200 km when using 

### Data Sources
- **GolfRSA / HNA integration** — If API access becomes available, pull official course ratings, slope ratings, and handicap indexes.
- **OSM fallback deprecation** — Remove OpenStreetMap import entirely; keep only curated community data.

---

## Phase 2 — Enhanced Features

### Handicap
- **Full WHS compliance** — Upgrade from simplified average-based handicap to full World Handicap System calculation (best 8 of last 20 differentials with course rating and slope adjustments) once the database has sufficient course rating/slope data.

### Tournaments
- **Scale tournament size** — Increase the 20-participant limit as infrastructure allows.
- **Additional formats** — Add more tournament formats beyond the initial set (e.g., Mixed, Shamble variations, custom scoring rules).

### Notifications
- **Push notifications** — Browser push notifications for score updates, leaderboard changes, tournament invitations, and friend activity.
- **Email notifications** — Fallback notification system for platforms with poor push support (e.g., iOS Safari).

### Course Data
- **Course condition reporting** — Allow users to report green speed, course wetness, maintenance status, and general conditions.
- **Weather overlay** — Integrate a free weather API to show current and forecasted weather conditions for the course being played.

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

### Data & Analytics
- **Advanced statistics dashboard** — Strokes gained analysis, scoring trends, club distance averages over time, course-specific performance breakdowns.
- **CSV/PDF enhancements** — Richer export formats, season summaries, shareable round graphics.

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
