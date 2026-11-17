# ApplyFlow Development Journal

> **Project:** ApplyFlow\
> **Journal compiled:** 2026-11-17\
> **Development environment:** Windows PowerShell · `H:\applyflow`\
> **Tech stack:** Next.js 16.4.6 (App Router), React, TypeScript,
> Supabase, Tailwind CSS v4, shadcn/ui, PostCSS, Vercel\
> **Coverage:** Initial project setup through authentication, basic
> dashboard, and CSS build troubleshooting\
> **Evidence policy:** Based on code, terminal logs, and screen results
> shared in the conversation. Tasks with unknown execution dates are not
> assigned invented dates.

## 0. Executive Summary

**Built ApplyFlow's initial authentication flow and dashboard, then
systematically investigated issues involving Next.js 16 prerendering and
Tailwind CSS v4/PostCSS integration.**

### Current Status

| Area | Status | Evidence / Notes |
|---|---|---|
| Next.js | Complete | App Router runs |
| Supabase connection | Basic setup done | Public env variables |
| Login | Verified | Dashboard reached |
| Password recovery | Verified | Success screen seen |
| Protected layout | Needs testing | `auth.getUser()` used |
| Dashboard | Implemented | Email, logout, status |
| `Date.now()` error | Needs verification | Final build unconfirmed |
| Tailwind/PostCSS | Reported fixed | Config file created |
| Core MVP features | Planned | Vault, apps, deadlines |
| Vercel deployment | Needs recheck | Success unconfirmed |

**Additional verification notes:** The protected layout redirects to `/login`. The `Date.now()` error was investigated around `cacheComponents`, but a passing final build was not confirmed. Tailwind/PostCSS reportedly worked after `postcss.config.mjs` was created.


------------------------------------------------------------------------

## 1. Project Overview

ApplyFlow is a job-search management service aimed at entry-level and
early-career job seekers in South Korea.

Intended user journey:

1.  Organize past activities and accomplishments in an **Experience
    Vault**.
2.  Draft company-specific applications and personal-statement answers.
3.  Reuse relevant experiences by linking them to application questions.
4.  Track application statuses and deadlines.
5.  Review progress on a dashboard.

### Technology Choices

-   **Next.js / React / TypeScript:** Application pages and UI
-   **Supabase Auth:** Authentication and password recovery
-   **Supabase Database:** Future per-user application data
-   **Tailwind CSS / shadcn/ui:** Styling and UI components
-   **Vercel:** Future deployment and operations

**Lesson learned:** Build the MVP incrementally: authentication → data
model → core CRUD → integrated dashboard.

------------------------------------------------------------------------

## 2. Entry 01 --- Project Structure and Environment Variables

### Goal

Establish the active Next.js routing structure and connect Supabase.

### Work Performed

-   Used `H:\applyflow` as the local project root.
-   Confirmed the Next.js App Router `app/` structure.
-   Investigated 404 errors caused by overlapping `app/` and `src/app/`
    trees.
-   Fixed import paths involving `@/lib/supabase/client`.
-   Configured public Supabase environment variables in `.env.local` and
    planned deployment settings.

``` env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

> These are **placeholders**, not real credentials.

### Problem and Resolution

-   Duplicate routing trees caused unexpected page resolution.
-   Import aliases had to match actual folder locations.
-   The later shared project structure used `app/layout.tsx`,
    `app/app/layout.tsx`, and `app/app/dashboard/page.tsx`.

### Lessons Learned

Confirm the active App Router root early. Keep public environment
variables separate from secret credentials.

------------------------------------------------------------------------

## 3. Entry 02 --- Supabase Authentication and Password Recovery

### Goal

Connect login, password-reset email requests, recovery links, password
updates, and login with the new password.

### Files Involved

-   `app/forgot-password/page.tsx`
-   `app/auth/callback/route.ts`
-   `app/auth/reset-password/page.tsx`
-   `app/app/layout.tsx`
-   `lib/supabase/server.ts`

### Key Implementation

Requesting a recovery email:

``` tsx
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
});
```

Updating the password:

``` tsx
const { error } = await supabase.auth.updateUser({
  password,
});
```

The flow signs the user out after a successful password update and
prompts a fresh login.

### Issues Encountered

-   Initial recovery links produced `otp_expired` and
    `One-time token not found`.
-   Supabase's default email rate limit constrained repeated tests.
-   The callback's handling of the `next` query parameter needed further
    review.

### Outcome

-   Retried with a newly issued recovery email.
-   Confirmed the **password-change success screen**.
-   Successfully logged in with the new password and reached
    `/app/dashboard`.

### Remaining Checks

-   [ ] Test expired, reused, and invalid recovery tokens
-   [ ] Safely handle `next` in `/auth/callback`
-   [ ] Distinguish password-recovery sessions from ordinary login
    sessions
-   [ ] Review production SMTP and email rate limits

### Lessons Learned

Recovery links are time-sensitive and may be single-use. Authentication
logs and actual UI results should be checked together.

------------------------------------------------------------------------

## 4. Entry 03 --- Protected Layout and Basic Dashboard

### Goal

Allow only authenticated users to access `/app/dashboard`.

### Key Code

`app/app/layout.tsx`:

``` tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <>{children}</>;
}
```

### Dashboard Elements

-   `ApplyFlow 대시보드` heading
-   Welcome text using the signed-in user's email
-   `LogoutButton`
-   `취업 준비 현황` summary card

### Bug Found

An early version extracted only `error` from `auth.getUser()` but
referenced an undeclared `user` variable:

``` tsx
const { error } = await supabase.auth.getUser();
if (error || !user) {
  redirect("/login");
}
```

The code was updated to also destructure `data: { user }`.

### Outcome and Lessons

-   Dashboard rendering after login was confirmed.
-   The logout button appeared on screen.
-   **Unauthenticated access blocking and post-logout access prevention
    still require regression tests.**
-   The response shape of `auth.getUser()` must be handled correctly.

------------------------------------------------------------------------

## 5. Entry 04 --- Next.js 16 `Date.now()` Prerendering Error

### Error

``` text
Error: Route "/app/dashboard":
Next.js encountered the unstable value `Date.now()` while prerendering.

Call Stack: AppLayout
```

### Investigation Timeline

1.  Searched application code for time and randomness calls:

``` powershell
Get-ChildItem app,lib,components -Recurse -File -Include *.ts,*.tsx |
Select-String -Pattern 'Date\.now\(|new Date\(|Math\.random\('
```

2.  **No direct usage was found**, suggesting an indirect library call
    or another part of the rendering path.
3.  Added `await connection()` to `AppLayout`; the error persisted.
4.  Temporarily removed authentication calls for diagnosis; the error
    persisted.
5.  Cleared `.next` and restarted the dev server; the error was still
    reported.
6.  Tried diagnosing with `cacheComponents: false`.

### Additional Configuration Error

``` text
Error: `partialPrefetching` requires `cacheComponents` to be enabled.
```

The configuration at that point contained:

``` ts
cacheComponents: false,
partialPrefetching: true,
```

These options have a dependency relationship, making that combination
invalid.

### Proposed Simplification

A minimal `next.config.ts` was suggested for troubleshooting:

``` ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
};

export default nextConfig;
```

### Outcome and Lessons

-   CSS build errors were reported afterward, but **final resolution of
    the `Date.now()` issue and a passing production build were not
    independently confirmed**.
-   A stack trace pointing to `AppLayout` does not conclusively identify
    the underlying library call.
-   Any temporary removal of authentication must be reverted.
    Authentication checks appeared again in subsequently shared code.
-   `connection()` can defer execution to request time, but is not a
    universal fix.

------------------------------------------------------------------------

## 6. Entry 05 --- Supabase Server-Side Cookie Handling

### Code Reviewed

`lib/supabase/server.ts` used `createServerClient()` and Next.js
`cookies()`.

The initially shared `setAll()` callback had an empty loop:

``` tsx
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
    });
  } catch {
    // ...
  }
}
```

### Problem

Updated cookies were not persisted, potentially affecting session
continuity.

### Suggested Fix

``` tsx
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options);
    });
  } catch {
    // Cookie writes may be restricted in Server Components
  }
}
```

### Follow-Up Verification

-   [ ] Confirm the fix is present in the current source
-   [ ] Verify token refresh and cookie propagation in `proxy.ts`
-   [ ] Test session expiry and refresh

### Lesson Learned

Supabase SSR authentication depends on correct cookie reads and writes.
Server Component restrictions may require Proxy or Route Handler
support.

------------------------------------------------------------------------

## 7. Entry 06 --- Tailwind CSS v4 and PostCSS Build Errors

### Error

``` text
./app/globals.css:2:1
Module not found: Can't resolve 'tw-animate-css'
```

Related warnings:

``` text
Unknown at rule: @apply
Unknown at rule: @custom-variant
Unknown at rule: @theme
```

### CSS at the Time

``` css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));
```

### Troubleshooting Steps

1.  Identified the missing `tw-animate-css` package and advised
    installing it.
2.  Tailwind syntax errors remained after installation.
3.  Checked whether `@tailwindcss/postcss` and a PostCSS configuration
    file were present.
4.  **Created `postcss.config.mjs` manually** at the project root.

``` js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### Result

The user confirmed that **creating `postcss.config.mjs` made the project
work**.

### Root Cause and Lessons

-   `npm install` installs packages but does not always generate their
    configuration files.
-   Tailwind CSS v4 directives require the correct processing pipeline.
-   A useful diagnostic order is **dependencies → configuration files →
    CSS imports → build output**.

------------------------------------------------------------------------

## 8. Entry 07 --- Development Documentation

### Work Completed

-   Created a detailed ApplyFlow MVP development plan in Markdown.
-   Produced Japanese and English versions of the same plan.
-   Covered Phases 0--8, proposed data models, RLS, Experience Vault,
    applications, deadlines, dashboard, testing, deployment, and future
    improvements.

### Documentation Rules

-   Mark only confirmed completed tasks with `[x]`.
-   Leave unimplemented or unverified items as `[ ]`.
-   Separate symptoms, attempted fixes, observed outcomes, and remaining
    uncertainties.

### Lesson Learned

A useful development journal records failed attempts and reasoning, not
just successes.

------------------------------------------------------------------------

## 9. Retrospective

### What Went Well

-   Validated the full password recovery → new-password login journey.
-   Separated authentication, rendering, and CSS build problems during
    troubleshooting.
-   Identified the missing PostCSS configuration and resolved the
    styling issue.
-   Organized the MVP into actionable development phases.

### Challenges

-   Routing confusion caused by both `app/` and `src/app/`
-   Expired Supabase recovery links and email rate limits
-   Next.js 16 `Date.now()` prerendering errors
-   Dependency between `cacheComponents` and `partialPrefetching`
-   Distinction between package installation and configuration creation

### Process Improvements

-   Change one configuration variable at a time and record the result.
-   Immediately restore authentication after diagnostic tests.
-   Confirm fixes with `npm run build`, not just a working dev screen.
-   Version-control configuration files and `package-lock.json`.
-   Track implementation completion separately from test completion.

------------------------------------------------------------------------

## 10. Next Steps

### P0 --- Foundation Stabilization

-   [ ] Review final `next.config.ts` and `postcss.config.mjs`
-   [ ] Pass `npx tsc --noEmit`
-   [ ] Pass `npm run build`
-   [ ] Check for recurrence of the `Date.now()` error
-   [ ] Regression-test the protected layout and unauthenticated access
-   [ ] Review Supabase cookies and `proxy.ts` token refresh
-   [ ] Verify password-reset callback destinations

### P0 --- MVP Features

-   [ ] Design the Supabase `experiences` table
-   [ ] Write user-specific RLS policies
-   [ ] Build Experience Vault list/create/detail/edit/delete flows
-   [ ] Implement applications and question-level answers
-   [ ] Link experiences to application questions
-   [ ] Implement deadlines and application status tracking
-   [ ] Connect real data to the dashboard
-   [ ] Complete security, functional testing, and deployment checks

### Commands Before the Next Session

``` powershell
cd H:\applyflow
npx tsc --noEmit
npm run build
git status
```

------------------------------------------------------------------------

## 11. Reusable Development Journal Template

``` md
## YYYY-MM-DD — Task title

### Today's Goal
-

### Work Completed
- [ ]

### Issues Encountered
- **Symptoms:**
- **Error message:**
- **Root-cause hypothesis:**

### Troubleshooting Steps
1.
2.
3.

### Outcome
- **Verified:**
- **Needs verification:**

### Lessons Learned
-

### Next Steps
- [ ]
```

**Closing assessment:** ApplyFlow is at the early MVP foundation stage,
with authentication and a basic dashboard in place. The Tailwind
CSS/PostCSS issue was reported resolved; the next priorities are final
build/session/`Date.now()` verification and implementation of the core
job-search workflows.
