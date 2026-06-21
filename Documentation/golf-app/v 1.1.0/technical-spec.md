# Sprint 1 — Technical Specification

## Overview

This technical specification translates the Sprint 1 PRD into an implementation design. Sprint 1 finalizes the GolfApp v1.1.0 production release by adding a forgot password flow, exposing the admin pages via role-gated navigation, introducing a unit testing framework, and verifying the live deployment.

The two concrete code changes are:

1. **Forgot password flow** — Two new auth routes/pages and a server action that calls Supabase Auth.
2. **Admin navigation** — Update the existing app shell to conditionally render an "Admin" link for users with `profiles.role = 'admin'`.

The remaining work is verification and engineering hygiene: build confirmation, migration check, Vercel Analytics confirmation, and unit tests.

## Architecture

### High-Level Flow

```
User visits /login
  → clicks "Forgot password?"
  → /auth/forgot-password
  → enters email
  → client submits to server action
  → server action calls supabase.auth.resetPasswordForEmail
  → user receives Supabase email with reset link
  → clicks link to /auth/reset-password?code=<hash>
  → client validates code, submits new password
  → server action calls supabase.auth.updateUser
  → redirect to /login with success toast

Authenticated user (role = admin)
  → AppShell fetches profile role
  → renders "Admin" link in sidebar and mobile tab bar
  → clicking link navigates to /admin
  → existing middleware route guard continues to protect /admin/*
```

### Components Touched

- `src/app/(auth)/login/page.tsx` — add "Forgot password?" link.
- `src/app/(auth)/forgot-password/page.tsx` — new page.
- `src/app/(auth)/reset-password/page.tsx` — new page.
- `src/app/(auth)/actions.ts` (or `src/lib/actions/auth.ts`) — server actions for password reset request and password update.
- `src/components/layout/app-shell.tsx` — add admin nav item, fetch role.
- `src/lib/validations/auth.ts` — add forgot/reset password Zod schemas.
- `src/__tests__/auth/*.test.ts` — new unit tests.
- `src/__tests__/layout/app-shell.test.tsx` — new unit tests for nav visibility.
- `package.json` — add testing framework and scripts.
- `src/app/layout.tsx` — confirm Vercel Analytics integration.
- `src/middleware.ts` — add new public auth paths (`/auth/forgot-password`, `/auth/reset-password`).

## Data Model / Schema

No schema changes are required for this sprint. The existing `profiles` table already contains `role` (text). The Supabase Auth schema handles password reset tokens.

| Entity | Field | Type | Notes |
|--------|-------|------|-------|
| `profiles` | `role` | `text` | Values: `admin`, `user`, etc. |

## API Contracts

### Server Actions

**`requestPasswordReset(email: string)`**

- Input: valid email address.
- Behavior: calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: "https://golf-app-svr.vercel.app/auth/reset-password" })`.
- Output: `{ success: true }` or `{ error: string }`.
- Security: always returns success to prevent email enumeration.

**`updatePassword(newPassword: string, code: string)`**

- Input: new password and the code from the reset URL.
- Behavior: exchanges code for a session, then calls `supabase.auth.updateUser({ password: newPassword })`.
- Output: `{ success: true }` or `{ error: string }`.
- Validation: password must match the existing password policy (minimum length, etc.).

### Route Changes

| Route | Type | Access |
|-------|------|--------|
| `/auth/forgot-password` | Client page | Public |
| `/auth/reset-password` | Client page | Public (requires valid code in URL) |
| `/admin` | Server page | Admin only (existing) |

### Middleware Updates

Add `/auth/forgot-password` and `/auth/reset-password` to `publicPaths` in `src/middleware.ts` so unauthenticated users can access them.

## Component Inventory

| Component | Purpose | Notes |
|-------------|---------|-------|
| `ForgotPasswordForm` | Email input + submit | Reuses `Input`, `Button`, `Label`, `Card` |
| `ResetPasswordForm` | New password + confirm + submit | Reuses `Input`, `Button`, `Label`, `Card` |
| `AdminNavLink` | Admin link in sidebar | Conditionally rendered in `AppShell` |
| `MobileAdminNavLink` | Admin link in mobile tab bar | Conditionally rendered in `AppShell` |

## Technology Choices

| Area | Choice | Rationale |
|------|--------|-----------|
| Testing framework | **Vitest** + `@testing-library/react` | Fast, Vite-native, works well with Next.js 14 and React Server Components; lighter than Jest |
| Test runner script | `npm test` | Maps to `vitest run` |
| UI test utilities | `@testing-library/react`, `@testing-library/jest-dom` | Standard React component testing |
| Mocking | Vitest built-in mocks | For mocking Supabase client and Next.js router |
| Validation | Zod | Already used in project (`registerSchema`) |
| Auth client | `@supabase/ssr` | Already used in project |
| Analytics | Vercel Analytics (`@vercel/analytics`) | Already installed in `package.json`; verify it is rendered in root layout |

**Alternatives considered:**

- Jest: works but heavier configuration; Vitest is preferred for new Next.js projects.
- React Testing Library only: insufficient; Vitest provides the runner and assertions.

## Security Considerations

1. **Email enumeration prevention:** The forgot password form must return the same success message whether the email exists or not.
2. **Token handling:** The reset code from the URL must be passed to the server action and exchanged for a session. It must never be logged or exposed in the UI.
3. **Password policy:** The new password must enforce the same minimum length/complexity rules as registration.
4. **Route guards:** The existing middleware guard on `/admin/*` remains the source of truth. The nav link is purely UX; it does not grant access.
5. **Rate limiting:** Supabase Auth endpoints have built-in rate limiting; no additional server-side rate limiting is required for this sprint.
6. **Environment variables:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must be present in Vercel. The reset password redirect URL must match the production domain.

## Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Invalid email format | Zod validation error shown inline |
| Supabase reset request fails | Generic success message still shown; error logged to monitoring |
| Invalid/expired reset code | Show error on `/auth/reset-password` and offer to resend |
| Password mismatch | Inline validation error before submit |
| Password too weak | Inline validation error before submit |
| Update password fails | Toast with error message; allow retry |
| Admin role fetch fails | Hide admin link (fail closed) |
| Non-admin accesses `/admin` directly | Middleware redirects to `/` |

## Performance & Scalability

- The admin nav role check adds one Supabase query per page load. To avoid repeated calls, the role can be fetched server-side and passed into `AppShell` as a prop, or fetched once and cached via React context/session.
- The forgot password server action is a thin wrapper around Supabase Auth; no heavy computation.
- Vercel Analytics has negligible performance impact.

## Dependencies & Constraints

- Next.js 14 App Router (must use Server Actions for auth operations).
- Supabase Auth with `@supabase/ssr` (existing).
- shadcn/ui components (existing).
- Vercel hosting and Vercel Analytics (existing).
- No external email service changes; Supabase handles the transactional email.
- The production domain `https://golf-app-svr.vercel.app` must be used in the reset password redirect URL.
- No new database migrations required.

## Open Questions / Notes

1. **AppShell data flow:** `AppShell` is currently a client component and does not have access to the user's profile. To gate the admin nav link, we must either:
   - Fetch the role in the root layout server-side and pass it as a prop to `AppShell`, or
   - Fetch the role client-side inside `AppShell` on mount.
   **Recommendation:** pass role from server layout to avoid an extra client-side request and hydration flicker.

2. **Vercel Analytics integration:** `@vercel/analytics` is installed in `package.json` but must be verified in `src/app/layout.tsx`.

3. **Existing test infrastructure:** The project has no test framework. This sprint must add Vitest, testing-library, and the first test files.

4. **Password policy:** The project already enforces a password ruleset in `registerSchema` (`@c:\Users\stefa\Desktop\Projects\Golf-App\src\lib\validations\profile.ts:8-20`): minimum 8 characters, one uppercase, one lowercase, and one digit. Sprint 1 must extract this into a shared `passwordSchema` (e.g., in `src/lib/validations/auth.ts`) so both registration and the reset password form use the same rules.

5. **Public paths in middleware:** `/auth/forgot-password` and `/auth/reset-password` must be added to `publicPaths` in `src/middleware.ts`.
