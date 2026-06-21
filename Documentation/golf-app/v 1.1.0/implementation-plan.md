# Sprint 1 — Implementation Plan

## Overview

This plan breaks the Sprint 1 technical specification into milestones, tasks, dependencies, and validation steps. The goal is to deliver a stable GolfApp v1.1.0 release with a forgot password flow, admin navigation, unit tests, and verified production deployment.

## Milestones

### Milestone 1 — Production Verification & Setup

Verify the existing production environment is healthy and ready for the v1.1.0 release.

**Tasks:**

1. **Verify Vercel Analytics integration** — Confirm `<Analytics />` from `@vercel/analytics` is rendered in `src/app/layout.tsx`. Add it if missing.
2. **Confirm Vercel environment variables** — Verify `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `MAPTILER_KEY` are set in the Vercel project.
3. **Run local production build** — Execute `npm run build` locally and resolve any errors.
4. **Verify Supabase migrations** — Confirm the production database schema matches `supabase/migrations/`.
5. **Document monitoring checklist** — Create a short checklist of what to verify after deployment (build status, analytics, error rates, core user flows).

**Exit criteria:**

- Local production build passes.
- Vercel Analytics component is rendered.
- Environment variables are present.
- Monitoring checklist is documented.

### Milestone 2 — Forgot Password Flow

Implement the full password reset flow.

**Tasks:**

1. **Extract shared password schema** — Move the password validation rules from `registerSchema` into a reusable `passwordSchema` in `src/lib/validations/auth.ts`.
2. **Add auth validation schemas** — Create `forgotPasswordSchema` and `resetPasswordSchema` using the shared `passwordSchema`.
3. **Create auth server actions** — Add `requestPasswordReset(email)` and `updatePassword(newPassword, code)` in `src/lib/actions/auth.ts`.
4. **Add public auth paths to middleware** — Include `/auth/forgot-password` and `/auth/reset-password` in `publicPaths` in `src/middleware.ts`.
5. **Create forgot password page** — Add `src/app/(auth)/forgot-password/page.tsx` with email form, server action call, and success message.
6. **Create reset password page** — Add `src/app/(auth)/reset-password/page.tsx` with new password + confirm password form, code extraction from URL, and server action call.
7. **Add forgot password link to login page** — Insert a "Forgot password?" link in `src/app/(auth)/login/page.tsx`.

**Exit criteria:**

- User can request a reset email from `/auth/forgot-password`.
- User can reset their password from `/auth/reset-password`.
- Password validation matches the registration form.
- Middleware allows public access to the new auth routes.

### Milestone 3 — Admin Navigation

Expose the admin pages through role-gated navigation.

**Tasks:**

1. **Fetch user role in root layout** — Update `src/app/layout.tsx` to fetch the current user's `profiles.role` server-side.
2. **Pass role to AppShell** — Update `AppShell` props to accept `isAdmin` (or `userRole`) and use it to conditionally render the admin nav item.
3. **Add admin link to desktop sidebar** — Insert an "Admin" nav item in the desktop sidebar when `isAdmin` is true.
4. **Add admin link to mobile tab bar** — Insert an "Admin" nav item in the mobile bottom tab bar when `isAdmin` is true.
5. **Verify middleware route guard** — Confirm `/admin/*` routes still redirect non-admins to `/`.

**Exit criteria:**

- Admin users see "Admin" in both desktop and mobile nav.
- Non-admin users do not see the "Admin" link.
- Direct `/admin` access is still protected by middleware.

### Milestone 4 — Unit Testing

Add a testing framework and unit tests for the new logic.

**Tasks:**

1. **Install Vitest and testing libraries** — Add `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom` as dev dependencies.
2. **Configure Vitest** — Create `vitest.config.ts` and update `package.json` scripts to add `test` and `test:ci`.
3. **Write schema tests** — Test `passwordSchema`, `forgotPasswordSchema`, and `resetPasswordSchema` (valid inputs, invalid emails, weak passwords, mismatched passwords).
4. **Write forgot password form tests** — Test the forgot password form component: email validation, submit handler, loading state, error state, and success message.
5. **Write reset password form tests** — Test the reset password form component: password validation, mismatch handling, submit handler, and error state.
6. **Write admin navigation tests** — Test `AppShell` to confirm the admin link renders when `isAdmin` is true and is hidden when false.
7. **Run the full test suite** — Execute `npm test` and fix any failures.

**Exit criteria:**

- `npm test` runs and passes.
- Tests cover password validation, forgot password form, reset password form, and admin nav visibility.

### Milestone 5 — Validation & Deployment

Final verification and release.

**Tasks:**

1. **Run production build** — Execute `npm run build` and resolve any errors.
2. **Run lint** — Execute `npm run lint` and resolve any issues.
3. **Run smoke tests on live URL** — Test the full flow on `https://golf-app-svr.vercel.app`: register → create course → play round → view stats → create tournament → view leaderboard.
4. **Test forgot password flow end-to-end** — Request a reset email and complete the reset on the live URL.
5. **Test admin navigation** — Log in as an admin and verify the "Admin" link appears and navigates correctly.
6. **Log and fix issues** — Document any bugs found and either fix them in the sprint or backlog them.

**Exit criteria:**

- Build and lint pass.
- Smoke tests pass on the live URL.
- Forgot password flow works in production.
- Admin navigation works for admin users.
- v1.1.0 is considered release-ready.

## Parallelization Map

**Can run in parallel:**

- Milestone 1 (verification) and Milestone 2 setup tasks (validation schemas, server actions) can start together.
- Milestone 3 (admin nav) is mostly independent of Milestone 2 after shared utilities are in place.
- Milestone 4 test setup can begin as soon as Milestones 2 and 3 are far enough along to know what to test.

**Must run sequentially:**

- Server actions (M2.3) must exist before the forgot/reset password pages (M2.5, M2.6) can call them.
- Auth validation schemas (M2.1, M2.2) must exist before the forms (M2.5, M2.6) and tests (M4.3) can use them.
- `AppShell` prop changes (M3.2) must be done before admin nav tests (M4.6).
- Production build (M5.1) must pass before deployment smoke tests (M5.3).

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Supabase reset password email goes to spam or is delayed | Test with a known email provider; verify Supabase email templates and sender configuration. |
| Reset password code exchange fails in production | Ensure redirect URL matches production domain exactly; verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel. |
| Admin nav causes hydration mismatch | Fetch role server-side and pass as a simple prop to `AppShell`. |
| Vitest setup conflicts with existing Next.js config | Use `@vitejs/plugin-react` and a minimal `vitest.config.ts`; keep tests co-located or under `src/__tests__`. |
| Smoke tests reveal unrelated production bugs | Log them as separate issues; fix only critical blockers within Sprint 1. |

## Validation Strategy

- **Unit tests:** Run `npm test` in CI/local before any deployment.
- **Build validation:** Run `npm run build` after code changes.
- **Lint validation:** Run `npm run lint` after code changes.
- **Manual QA:** Execute the documented smoke test checklist on the live Vercel URL.
- **Security review:** Verify email enumeration prevention, password policy enforcement, and admin route guards.
