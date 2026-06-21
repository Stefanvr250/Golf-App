# Sprint 1 — Task List

## Legend

- `[P]` — Parallel-safe task.
- `[S]` — Sequential task (has dependencies).

---

## Milestone 1 — Production Verification & Setup

1. **[S]** Verify Vercel Analytics is rendered in `src/app/layout.tsx`.
   - Output: Confirmed `<Analytics />` present, or added if missing.
   - PRD reference: Monitoring acceptance criteria.

2. **[P]** Confirm Vercel environment variables are set (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MAPTILER_KEY`).
   - Output: Screenshot or list of confirmed environment variables.
   - PRD reference: Production verification acceptance criteria.

3. **[P]** Run `npm run build` locally and fix any build errors.
   - Output: Successful build log.
   - PRD reference: Production verification acceptance criteria.

4. **[P]** Verify Supabase production migrations match `supabase/migrations/`.
   - Output: Migration diff or confirmation.
   - PRD reference: Production verification acceptance criteria.

5. **[P]** Document a post-deployment monitoring checklist.
   - Output: Monitoring checklist saved in `Documentation/golf-app/v 1.1.0/monitoring-checklist.md`.
   - PRD reference: Monitoring acceptance criteria.

---

## Milestone 2 — Forgot Password Flow

6. **[S]** Extract `passwordSchema` from `registerSchema` into `src/lib/validations/auth.ts`.
   - Output: Shared `passwordSchema` exported from `src/lib/validations/auth.ts`.
   - PRD reference: Forgot password acceptance criteria.

7. **[S]** Create `forgotPasswordSchema` and `resetPasswordSchema` in `src/lib/validations/auth.ts`.
   - Output: Validation schemas for email, password, and confirm password.
   - PRD reference: Forgot password acceptance criteria.
   - Depends on: Task 6.

8. **[S]** Create `requestPasswordReset` and `updatePassword` server actions in `src/lib/actions/auth.ts`.
   - Output: Two server actions that call Supabase Auth and return success/error objects.
   - PRD reference: Forgot password acceptance criteria.

9. **[S]** Add `/auth/forgot-password` and `/auth/reset-password` to `publicPaths` in `src/middleware.ts`.
   - Output: Updated middleware with new public paths.
   - PRD reference: Forgot password acceptance criteria.

10. **[S]** Create `src/app/(auth)/forgot-password/page.tsx` with email form.
    - Output: Forgot password page with email input, submit button, loading state, and success message.
    - PRD reference: Forgot password acceptance criteria.
    - Depends on: Tasks 7, 8.

11. **[S]** Create `src/app/(auth)/reset-password/page.tsx` with new password form.
    - Output: Reset password page that reads code from URL, validates password, and submits to server action.
    - PRD reference: Forgot password acceptance criteria.
    - Depends on: Tasks 7, 8.

12. **[P]** Add "Forgot password?" link to `src/app/(auth)/login/page.tsx`.
    - Output: Login page links to `/auth/forgot-password`.
    - PRD reference: Forgot password acceptance criteria.

---

## Milestone 3 — Admin Navigation

13. **[S]** Fetch `profiles.role` in `src/app/layout.tsx` server-side.
    - Output: Root layout passes `userRole` or `isAdmin` to `AppShell`.
    - PRD reference: Admin navigation acceptance criteria.

14. **[S]** Update `src/components/layout/app-shell.tsx` to accept and use the role prop.
    - Output: `AppShell` renders admin nav items when role is `'admin'`.
    - PRD reference: Admin navigation acceptance criteria.
    - Depends on: Task 13.

15. **[P]** Add "Admin" nav item to desktop sidebar in `AppShell`.
    - Output: Admin link visible in desktop sidebar for admins.
    - PRD reference: Admin navigation acceptance criteria.
    - Depends on: Task 14.

16. **[P]** Add "Admin" nav item to mobile tab bar in `AppShell`.
    - Output: Admin link visible in mobile tab bar for admins.
    - PRD reference: Admin navigation acceptance criteria.
    - Depends on: Task 14.

17. **[P]** Verify `/admin/*` middleware route guard still redirects non-admins.
    - Output: Confirmed behavior via direct URL test.
    - PRD reference: Admin navigation acceptance criteria.

---

## Milestone 4 — Unit Testing

18. **[S]** Install Vitest and testing-library dependencies.
    - Output: `package.json` updated with `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
    - PRD reference: Unit tests acceptance criteria.

19. **[S]** Configure `vitest.config.ts` and add `npm test` / `npm run test:ci` scripts.
    - Output: Vitest config file and updated `package.json` scripts.
    - PRD reference: Unit tests acceptance criteria.
    - Depends on: Task 18.

20. **[P]** Write unit tests for `passwordSchema`, `forgotPasswordSchema`, and `resetPasswordSchema`.
    - Output: Test file covering valid/invalid inputs.
    - PRD reference: Unit tests acceptance criteria.
    - Depends on: Task 7.

21. **[P]** Write unit tests for the forgot password form component.
    - Output: Test file covering validation, submit, loading, error, and success states.
    - PRD reference: Unit tests acceptance criteria.
    - Depends on: Task 10.

22. **[P]** Write unit tests for the reset password form component.
    - Output: Test file covering validation, mismatch handling, submit, and error states.
    - PRD reference: Unit tests acceptance criteria.
    - Depends on: Task 11.

23. **[P]** Write unit tests for admin navigation visibility in `AppShell`.
    - Output: Test file confirming admin link shows/hides based on role.
    - PRD reference: Unit tests acceptance criteria.
    - Depends on: Task 14.

24. **[S]** Run `npm test` and fix all failures.
    - Output: Passing test suite.
    - PRD reference: Unit tests acceptance criteria.
    - Depends on: Tasks 20–23.

---

## Milestone 5 — Validation & Deployment

25. **[S]** Run `npm run build` and fix any errors.
    - Output: Successful production build.
    - PRD reference: Production verification acceptance criteria.

26. **[S]** Run `npm run lint` and fix any issues.
    - Output: Successful lint run.
    - PRD reference: Engineering hygiene.

27. **[S]** Execute smoke test checklist on `https://golf-app-svr.vercel.app`.
    - Output: Completed checklist with pass/fail notes.
    - PRD reference: Manual smoke tests acceptance criteria.

28. **[S]** Test forgot password flow end-to-end on production.
    - Output: Confirmed email received and password reset successfully.
    - PRD reference: Forgot password acceptance criteria.

29. **[S]** Test admin navigation on production.
    - Output: Confirmed admin link appears for admin users and navigates correctly.
    - PRD reference: Admin navigation acceptance criteria.

30. **[P]** Log any issues found during smoke testing and decide on in-sprint fixes vs. backlog.
    - Output: Issue list with owner and priority.
    - PRD reference: Manual smoke tests acceptance criteria.

---

## Summary

- **Total tasks:** 30
- **Must complete before release:** 1–5, 6–12, 13–17, 18–24, 25–29
- **Optional / nice-to-have:** 30 (issue triage)
