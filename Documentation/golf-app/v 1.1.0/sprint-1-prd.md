# Sprint 1 — Production Readiness & Launch Foundation (v1.1.0)

## Feature Name

Sprint 1 — Production Readiness & Launch Foundation

## Summary

This sprint finalizes the GolfApp production environment for the v1.1.0 release. The project is already deployed on Vercel at `https://golf-app-svr.vercel.app`, so the focus is on verifying the production configuration, closing critical pre-launch gaps (forgot password, admin navigation), and adding unit tests for the areas touched. The outcome is a stable, live v1.1.0 release that can be safely demonstrated and used by early users.

## Goals

- Confirm the production deployment on Vercel is fully configured and stable.
- Ensure the production Supabase project is connected correctly and all migrations are applied.
- Add a forgot password flow so users can recover their accounts.
- Expose the existing admin pages through a role-gated navigation item.
- Add unit tests for the forgot password and admin navigation logic.
- Run manual smoke tests on the live URL to verify the core user flow.

## Non-Goals

- This sprint does not add new user-facing features beyond forgot password and admin navigation.
- It does not redesign the UI or introduce new branding.
- It does not add automated end-to-end tests for the full deployment flow.
- It does not migrate to a new hosting platform or a new Supabase project.

## User Stories

- **As a user**, I want to reset my password from the login page, so that I can regain access if I forget it.
- **As an admin**, I want an "Admin" link visible in the navigation, so that I can reach the admin pages without typing a direct URL.
- **As a developer**, I want unit tests for the password reset and admin navigation logic, so that regressions are caught before deployment.
- **As a maintainer**, I want the production environment verified and monitored, so that I can be confident the app is live and healthy.

## Acceptance Criteria

### Production Verification

- [ ] The app loads successfully at `https://golf-app-svr.vercel.app` with no runtime errors.
- [ ] All required environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MAPTILER_KEY`, etc.) are present in Vercel and non-empty.
- [ ] A production build completes without errors (`npm run build`).
- [ ] All Supabase migrations are applied to the production database and match the local schema.

### Custom Domain

- [ ] The Vercel project is configured with the domain `golf-app-svr.vercel.app` (default Vercel domain) and the app is accessible via that URL.

### Monitoring

- [ ] Vercel Analytics and Monitoring are enabled and collecting traffic/performance data.
- [ ] A brief monitoring checklist is documented (what to check after deployment).

### Forgot Password Flow

- [ ] The login page shows a "Forgot password?" link.
- [ ] Clicking the link navigates to `/auth/forgot-password` (or equivalent route).
- [ ] The user can enter their email and request a reset link.
- [ ] The app calls Supabase `resetPasswordForEmail` with the correct redirect URL.
- [ ] A confirmation message is shown regardless of whether the email exists (to prevent email enumeration).
- [ ] A `/auth/reset-password` page exists where the user can enter a new password after clicking the email link.
- [ ] The new password must meet the existing password policy (minimum length, etc.).
- [ ] After resetting, the user is redirected to the login page or dashboard with a success message.

### Admin Navigation

- [ ] A nav item labeled "Admin" appears in the desktop sidebar when the signed-in user's `profiles.role` is `'admin'`.
- [ ] The same "Admin" item appears in the mobile tab bar for admin users.
- [ ] The item is hidden for non-admin users.
- [ ] Clicking the item navigates to the existing admin landing page.
- [ ] Direct URL access to admin pages still works for admins and is still blocked for non-admins.

### Unit Tests

- [ ] Unit tests exist for the forgot password form (email validation, submit handler, error states).
- [ ] Unit tests exist for the reset password form (password validation, mismatch handling, submit handler).
- [ ] Unit tests exist for the admin navigation visibility logic (admin role shows link, non-admin role hides link).
- [ ] All new unit tests pass in CI/local (`npm test`).

### Manual Smoke Tests

- [ ] A smoke test checklist is documented and executed on the live URL.
- [ ] The checklist covers: register → create course → play round → view stats → create tournament → view leaderboard.
- [ ] Any issues found during smoke testing are logged as bugs or fixed within the sprint.

## Technology Constraints

- Hosting must remain on Vercel.
- Authentication must use Supabase Auth.
- The project uses Next.js 14 App Router and React Server Components where appropriate.
- UI components must come from the existing component library (shadcn/ui-based).
- Password reset token expiry must use Supabase defaults.
- Monitoring must use Vercel's built-in Analytics/Monitoring; Sentry is optional and deferred.

## Out of Scope

- Google or Apple OAuth.
- Push or email notifications.
- New tournament formats or gamification.
- Native mobile apps or wearable apps.
- Advanced analytics, CSV/PDF enhancements, or multi-language support.
- Automated end-to-end deployment tests.
- External course data API integrations.
- Admin invite flow or role management UI beyond the nav link.

## Open Questions

- Should the password reset email redirect to `https://golf-app-svr.vercel.app/auth/reset-password`, or do we need a custom redirect URL?
- Should the admin nav item use an icon from the existing icon set, or just text?
- Are there any existing admin pages that need route guards updated beyond the nav link?
