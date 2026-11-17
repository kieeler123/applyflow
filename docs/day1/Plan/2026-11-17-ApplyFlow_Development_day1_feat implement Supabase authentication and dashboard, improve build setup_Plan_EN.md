# ApplyFlow Detailed Development Work Plan

> **Project:** ApplyFlow --- A web service for organizing the job-search
> process\
> **Plan date:** 2026-11-17\
> **Tech stack:** Next.js 16 (App Router), React, TypeScript, Tailwind
> CSS v4, shadcn/ui, Supabase, Vercel\
> **Local project path:** `H:\applyflow`\
> **Target audience:** Entry-level and early-career job seekers in South
> Korea\
> **Goal:** Release an MVP connecting experience organization →
> application writing → application deadline tracking

## 0. How to Use This Plan

-   `[x]` means completion was confirmed in the conversation; `[ ]`
    means pending or requiring verification.
-   **P0:** Required before MVP launch / **P1:** MVP quality
    improvements / **P2:** Post-launch enhancements.
-   Estimates represent **approximate hands-on time for a solo
    developer** and may increase with learning or debugging.
-   Complete each phase in the order **implementation → verification →
    definition of done (DoD)**.
-   The live repository and database have not been directly inspected
    for this plan. Verify any existing implementation before marking it
    complete.

### MVP Scope

#### 1. Account
**Included in MVP (P0)**
- Email signup and login
- Password recovery
- Logout

**After Launch (P2)**
- Social login
- Account linking

#### 2. Experience Vault
**Included in MVP (P0)**
- Experience CRUD
- Tags and skills
- Search and filters

**After Launch (P2)**
- AI-assisted experience extraction
- File attachments

#### 3. Applications
**Included in MVP (P0)**
- Application CRUD
- Question-level answers
- Experience linking
- Draft saving

**After Launch (P2)**
- AI-generated drafts and editing
- Version comparison

#### 4. Application Schedule
**Included in MVP (P0)**
- Company and job posting management
- Deadline tracking
- Application status tracking

**After Launch (P2)**
- Email and push notifications
- Calendar synchronization

#### 5. Dashboard
**Included in MVP (P0)**
- Progress overview
- Upcoming deadlines
- Recent activity

**After Launch (P2)**
- Detailed analytics and statistics

### Recommended Build Order

`Foundation stabilization → Database & RLS → Experience Vault → Applications → Deadlines → Dashboard integration → Testing → Deployment`

------------------------------------------------------------------------

## 1. Current Progress

### 1.1 Confirmed Completed Items

-   [x] Created the ApplyFlow project with Next.js
-   [x] Configured TypeScript and the App Router
-   [x] Connected Supabase and configured public environment variables
-   [x] Implemented email login and successfully logged in using a new
    password
-   [x] Implemented the password-reset request page
-   [x] Verified the password-change success screen
-   [x] Confirmed navigation to `/app/dashboard` after login
-   [x] Implemented a basic dashboard and logout button
-   [x] Created `postcss.config.mjs` for Tailwind CSS v4 and confirmed
    the styling issue was resolved

### 1.2 Items Requiring Priority Verification

-   [ ] Verify the `Date.now()` error is completely resolved with the
    current configuration
-   [ ] Finalize `next.config.ts` and the `cacheComponents` policy
-   [ ] Confirm authentication checks are restored and retained in
    `app/app/layout.tsx`
-   [ ] Verify cookie persistence via `setAll()` in
    `lib/supabase/server.ts`
-   [ ] Verify Supabase token refresh handling in `proxy.ts`
-   [ ] Test the `next` destination parameter in the password-reset
    callback
-   [ ] Verify unauthenticated access to `/app/*` is blocked
-   [ ] Confirm `npm run build` and `npx tsc --noEmit` pass
-   [ ] Recheck GitHub and Vercel deployment status

> **Note:** Database tables, RLS policies, CRUD features, and successful
> deployment are not marked complete unless confirmed in the
> conversation.

------------------------------------------------------------------------

## 2. Phase 0 --- Stabilize the Development Environment and Authentication

**Priority:** P0 · **Estimate:** 4--8 hours · **Dependencies:** None

### 2.1 Clean Up Project Structure

-   [ ] Verify that either `app/` or `src/app/` is the single active
    application path
-   [ ] Verify the `@/` alias matches the actual directory structure
-   [ ] Organize shared folders such as `components/`, `lib/`, and
    `types/`
-   [ ] Clean up existing imports such as `src/components/logout-button`
-   [ ] Ensure `node_modules`, `.next`, and `.env.local` are included in
    `.gitignore`
-   [ ] Document setup commands and environment variable names in
    `README.md`

### 2.2 Stabilize CSS and Builds

-   [ ] Confirm `@tailwindcss/postcss` is registered in
    `postcss.config.mjs`
-   [ ] Verify installation and CSS imports for `tailwindcss`,
    `tw-animate-css`, and `shadcn`
-   [ ] Confirm Tailwind v4 syntax in `app/globals.css` compiles
    correctly
-   [ ] Review unnecessary experimental settings in `next.config.ts`
-   [ ] Run `npm run dev` and display the application without errors
-   [ ] Pass `npx tsc --noEmit`
-   [ ] Pass `npm run build`

### 2.3 Secure Supabase Authentication

-   [ ] Verify the separation of `createBrowserClient` and
    `createServerClient`
-   [ ] Verify server-side cookie read/write configuration
-   [ ] Review session refresh handling in `proxy.ts`
-   [ ] Validate users server-side with `auth.getUser()` on protected
    routes
-   [ ] Confirm authenticated users can access the dashboard
-   [ ] Redirect unauthenticated requests to `/app/dashboard` toward
    `/login`
-   [ ] Prevent access to protected pages after logout
-   [ ] Test expired, reused, and invalid password-reset links
-   [ ] Consider distinguishing password-recovery flows from normal
    authenticated sessions
-   [ ] Safely process the callback `next` parameter (allow internal
    paths only)
-   [ ] Plan around Supabase email rate limits and production SMTP
    requirements

**Definition of Done:** Login, logout, password recovery, and protected
routes work correctly, and development/production builds pass.

------------------------------------------------------------------------

## 3. Phase 1 --- Supabase Data Model and Security Design

**Priority:** P0 · **Estimate:** 5--9 hours · **Dependency:** Phase 0

### 3.1 Shared Data Conventions

-   [ ] Use `auth.users.id` as the consistent owner identifier
-   [ ] Define `id`, `user_id`, `created_at`, and `updated_at` in
    business tables
-   [ ] Decide on deletion: hard delete for MVP; consider soft delete if
    recovery is required
-   [ ] Standardize status values with CHECK constraints or enums
-   [ ] Store timestamps in UTC and display them in Korea Standard Time
-   [ ] Design indexes for `user_id`, deadlines, statuses, and creation
    dates

### 3.2 Proposed Tables

#### 1. `experiences` — Experience Vault
- **Basic information:** `id`, `user_id`, `title`
- **Activity details:** `organization`, `role`
- **Dates:** `start_date`, `end_date`
- **Experience narrative:** `situation`, `task`, `action`
- **Results and reflection:** `result`, `reflection`
- **Audit fields:** `created_at`, `updated_at`

#### 2. `experience_tags` — Experience Tags
- **Basic information:** `id`, `user_id`
- **Experience reference:** `experience_id`
- **Tag:** `name`

#### 3. `applications` — Application Tracking
- **Basic information:** `id`, `user_id`
- **Employer and role:** `company_name`, `position`
- **Job posting:** `posting_url`, `deadline_at`
- **Application status:** `status`, `memo`
- **Audit fields:** `created_at`, `updated_at`

#### 4. `application_questions` — Questions and Answers
- **Basic information:** `id`, `user_id`
- **Application reference:** `application_id`
- **Question and answer:** `question`, `answer`
- **Ordering and update:** `sort_order`, `updated_at`

#### 5. `question_experiences` — Question–Experience Links
- **Basic information:** `id`, `user_id`
- **Question reference:** `question_id`
- **Experience reference:** `experience_id`

### 3.3 SQL Migrations and RLS

-   [ ] Choose Supabase SQL Editor or CLI migrations
-   [ ] Write table creation SQL
-   [ ] Define foreign keys and `ON DELETE` behavior
-   [ ] Enable RLS for user-owned tables
-   [ ] Apply `auth.uid() = user_id` policies for
    SELECT/INSERT/UPDATE/DELETE
-   [ ] Verify linked records also belong to the same user
-   [ ] Test attempts to read, update, and delete another user's records
-   [ ] Ensure the `service_role` key is never exposed to clients
-   [ ] Choose how to generate TypeScript types from the database schema

**Definition of Done:** Users can access and change only their own data;
the database rejects cross-user access.

------------------------------------------------------------------------

## 4. Phase 2 --- Experience Vault

**Priority:** P0 · **Estimate:** 12--20 hours · **Dependency:** Phase 1

### 4.1 Pages and Navigation

-   [ ] Create `/app/experiences` list page
-   [ ] Create `/app/experiences/new` entry page
-   [ ] Create `/app/experiences/[id]` detail/edit page
-   [ ] Add an Experience Vault link to the dashboard or shared
    navigation
-   [ ] Add an empty state guiding users to create their first entry
-   [ ] Show saving, error, and success states

### 4.2 Experience Form

-   [ ] Title (required)
-   [ ] Organization, project, or activity name
-   [ ] Role or responsibilities
-   [ ] Start and end dates (optional)
-   [ ] Situation
-   [ ] Task
-   [ ] Action
-   [ ] Result
-   [ ] Reflection and lessons learned
-   [ ] Tags or skill keywords
-   [ ] Validate required fields, text lengths, and dates
-   [ ] Navigate to the list/detail page after saving

### 4.3 CRUD and Discovery

-   [ ] Create an experience
-   [ ] Read the experience list
-   [ ] Read experience details
-   [ ] Update an experience
-   [ ] Delete an experience with a confirmation dialog
-   [ ] Sort by newest first
-   [ ] Search titles and content
-   [ ] Filter by tags
-   [ ] Add pagination or a "Load more" action for long lists

### 4.4 Acceptance Tests

-   [ ] A newly created entry appears immediately in the list
-   [ ] Changes persist after a refresh
-   [ ] Deleted entries disappear from the list
-   [ ] Missing required fields prevent submission
-   [ ] Direct URLs to another user's experience are blocked
-   [ ] The form works on mobile screens

**Definition of Done:** Users can create, search, edit, and delete their
own experiences, while other users cannot access them.

**Tip:** Complete STAR-style fields and basic CRUD before adding tags
and search.

------------------------------------------------------------------------

## 5. Phase 3 --- Application Writing and Management

**Priority:** P0 · **Estimate:** 14--24 hours · **Dependency:** Phase 2

### 5.1 Core Pages

-   [ ] Create `/app/applications` application list page
-   [ ] Create `/app/applications/new` new application page
-   [ ] Create `/app/applications/[id]` application detail page
-   [ ] Add question lists and answer editing areas to application
    details
-   [ ] Display save status and last-updated time

### 5.2 Application CRUD

-   [ ] Enter company name and position
-   [ ] Enter job posting URL and validate it
-   [ ] Enter application deadline
-   [ ] Select status: Interested / Drafting / Submitted / In Process /
    Accepted / Rejected, etc.
-   [ ] Enter application notes
-   [ ] Create, edit, and delete application records
-   [ ] Filter and sort by status

### 5.3 Question-Level Personal Statements

-   [ ] Add questions
-   [ ] Edit and delete questions
-   [ ] Reorder questions (up/down buttons are sufficient initially)
-   [ ] Write and save answers
-   [ ] Display answer character counts
-   [ ] Link an answer/question to Experience Vault entries
-   [ ] Display linked experiences in a reference panel
-   [ ] Show Not Started / In Progress / Completed per question
-   [ ] Warn about unsaved changes before leaving, or use explicit
    saving

### 5.4 Keep the MVP Focused

-   [ ] Exclude automatic AI writing from mandatory MVP scope
-   [ ] Exclude complex collaboration and sharing
-   [ ] Defer document export to P1 or P2
-   [ ] Prioritize simple conveniences such as a copy button

**Definition of Done:** Users can create company-specific applications,
manage questions and answers, and reference saved experiences.

------------------------------------------------------------------------

## 6. Phase 4 --- Job Postings and Deadline Tracking

**Priority:** P0 · **Estimate:** 8--14 hours · **Dependency:** Phase 3

### 6.1 Deadline Tracking

-   [ ] Display deadlines in the application list
-   [ ] Sort by nearest deadline
-   [ ] Show days remaining (D-day)
-   [ ] Distinguish Due Today / Within 7 Days / Overdue
-   [ ] Handle postings with no deadline
-   [ ] Decide how deadline warnings behave for submitted applications

### 6.2 Status Tracking

-   [ ] Support transitions such as Interested → Drafting → Submitted
-   [ ] Record In Process / Accepted / Rejected outcomes
-   [ ] Count applications by status
-   [ ] Allow notes about application history
-   [ ] Distinguish expired postings from submitted applications

### 6.3 Date and Time Accuracy

-   [ ] Decide whether to store `date` or `timestamptz`
-   [ ] Calculate date-only deadlines consistently in Korean local dates
-   [ ] Display time zones explicitly for deadlines with times
-   [ ] Test D-day calculations around midnight
-   [ ] Review how current time is handled during server/client
    rendering

**Definition of Done:** Users can see where and when they need to apply
and update their application status.

**Tip:** For the MVP, build an in-app upcoming-deadlines list before
email notifications.

------------------------------------------------------------------------

## 7. Phase 5 --- Dashboard Integration

**Priority:** P0 · **Estimate:** 6--10 hours · **Dependencies:** Phases
2--4

### 7.1 Key Metrics

-   [ ] Total number of saved experiences
-   [ ] Number of applications in progress
-   [ ] Number of submitted applications
-   [ ] Number of deadlines within seven days
-   [ ] Recently edited applications
-   [ ] Five nearest upcoming deadlines

### 7.2 User Experience

-   [ ] Shared top or side navigation
-   [ ] Quick action to add an experience
-   [ ] Quick action to add an application
-   [ ] Display signed-in user and logout
-   [ ] Show a getting-started guide when there is no data
-   [ ] Support mobile, tablet, and desktop layouts
-   [ ] Standardize loading, empty, and error states

**Definition of Done:** Immediately after login, users can see the
job-search tasks that need attention.

------------------------------------------------------------------------

## 8. Phase 6 --- Security, Quality, and Testing

**Priority:** P0 · **Estimate:** 8--14 hours · **Dependency:** Core
feature implementation

### 8.1 Security

-   [ ] Review RLS for all business tables
-   [ ] Validate authentication in APIs and Server Actions
-   [ ] Check record ownership and validate inputs
-   [ ] Permit only safe URL protocols when rendering external links
-   [ ] Avoid logging sensitive keys, tokens, or personal data
-   [ ] Confirm `.env.local` is not tracked by Git
-   [ ] Confirm Supabase secret keys are not exposed via `NEXT_PUBLIC_`

### 8.2 Functional Testing

-   [ ] Sign up → Log in → Log out
-   [ ] Request password reset → Change password → Log in with new
    password
-   [ ] Access a protected page while logged out
-   [ ] Create, read, update, and delete experiences
-   [ ] Create an application, answer questions, and link experiences
-   [ ] Sort deadlines and filter by status
-   [ ] Confirm data isolation between two user accounts
-   [ ] Test refresh, browser back, and direct URL navigation
-   [ ] Verify messages for network failures and database errors

### 8.3 Quality Checks

-   [ ] Pass `npx tsc --noEmit`
-   [ ] Pass `npm run build`
-   [ ] Pass ESLint checks (verify the project's script)
-   [ ] Verify responsive layouts on key pages
-   [ ] Test keyboard access to buttons and forms
-   [ ] Associate form labels with validation messages
-   [ ] Handle empty, loading, and error states
-   [ ] Prevent duplicate form submissions
-   [ ] Review redundant calls to major database queries

**Definition of Done:** All key user flows pass and no cross-account
data exposure occurs.

------------------------------------------------------------------------

## 9. Phase 7 --- GitHub/Vercel Deployment and Operational Readiness

**Priority:** P0 · **Estimate:** 5--9 hours · **Dependency:** Phase 6

### 9.1 Deployment Preparation

-   [ ] Review and commit Git changes
-   [ ] Ensure `package-lock.json` is included
-   [ ] Verify Vercel and GitHub repository integration
-   [ ] Configure `NEXT_PUBLIC_SUPABASE_URL` in Vercel
-   [ ] Configure `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel
-   [ ] Finalize the production domain
-   [ ] Set the Supabase Auth Site URL to the production address
-   [ ] Add production callback/reset paths to Supabase Auth Redirect
    URLs
-   [ ] Confirm development (`localhost`) and production URLs are
    handled separately
-   [ ] Review Supabase email limits and SMTP policy

### 9.2 Production Verification

-   [ ] Production build succeeds on Vercel
-   [ ] Signup and login work on the production URL
-   [ ] Password recovery works on the production URL
-   [ ] Experiences can be created, edited, and deleted in the
    production database
-   [ ] Applications and schedules persist in the production database
-   [ ] Logout and protected routes work correctly
-   [ ] Verify the site in a real mobile browser
-   [ ] Review necessary operational notices such as privacy policy and
    contact information
-   [ ] Document how to inspect logs during incidents

**Definition of Done:** A new user can sign up and manage experiences,
applications, and deadlines on the live production site.

------------------------------------------------------------------------

## 10. Phase 8 --- Post-Launch Improvement Backlog

**Priority:** P1/P2 · **Start after the MVP**

### P1: Usability and Polish

-   [ ] Autosave application answers
-   [ ] Suggest experience tags and improve search
-   [ ] Copy/export application text
-   [ ] Track application status history
-   [ ] Add a calendar view
-   [ ] Support data export and account deletion
-   [ ] Collect user feedback
-   [ ] Add basic usage analytics with minimal personal data collection

### P2: Expansion Features

-   [ ] AI-generated experience summaries
-   [ ] Recommend relevant experiences for application questions
-   [ ] AI personal-statement drafting and review
-   [ ] Import information from a job posting URL
-   [ ] Email deadline reminders
-   [ ] Integrate external calendars such as Google Calendar
-   [ ] Analyze application outcomes
-   [ ] Evaluate paid plans and billing

> AI features require careful management of privacy, cost, and output
> quality. Add them after basic CRUD is stable.

------------------------------------------------------------------------

## 11. Suggested Sprint Schedule

The following example assumes **approximately 10--15 working hours per
week** and should be adjusted as needed.

| Week | Phase | Main deliverables |
|---|---|---|
| Week 1 | Phase 0 | Stable login, dashboard, and builds |
| Week 2 | Phase 1 | Tables, RLS, types, and data access |
| Week 3 | Phase 2, first half | Experience creation, list, and details |
| Week 4 | Phase 2, second half | Experience editing, deletion, search, and tags |
| Week 5 | Phase 3, first half | Application CRUD |
| Week 6 | Phase 3, second half | Questions, answers, and experience linking |
| Week 7 | Phases 4–5 | Deadlines, statuses, and dashboard |
| Week 8 | Phases 6–7 | Testing, security, deployment, and production checks |

**Deliverables:** Stable login, dashboard, and builds

#### Week 2 — Phase 1
- **Deliverables:** Tables, RLS, types, and data-access layer

#### Week 3 — Phase 2, First Half
- **Deliverables:** Experience creation, list, and details

#### Week 4 — Phase 2, Second Half
- **Deliverables:** Experience editing, deletion, search, and tags

#### Week 5 — Phase 3, First Half
- **Deliverables:** Application CRUD

#### Week 6 — Phase 3, Second Half
- **Deliverables:** Questions, answers, and experience linking

#### Week 7 — Phases 4–5
- **Deliverables:** Deadlines, statuses, and dashboard

#### Week 8 — Phases 6–7
- **Deliverables:** Testing, security, deployment, and production checks

**Total estimated hands-on effort:** Approximately 62--108 hours,
depending on scope and difficulty. Add buffer for learning, unexpected
issues, and design iterations.

------------------------------------------------------------------------

## 12. Work Ticket Template

Copy this block when implementing a new feature.

``` md
### AF-XXX — Task title

- **Priority:** P0 / P1 / P2
- **Estimate:** 1–3 hours
- **Dependencies:** AF-...
- **Files to change:** `app/...`, `lib/...`
- **Goal:** The user can ...

#### Tasks
- [ ] Build UI
- [ ] Validate inputs
- [ ] Connect database
- [ ] Verify authentication and RLS
- [ ] Handle loading and errors

#### Definition of Done
- [ ] Happy-path test passes
- [ ] Failure scenarios pass
- [ ] TypeScript/build passes
- [ ] Git commit created
```

------------------------------------------------------------------------

## 13. The Next 10 Action Items

1.  [ ] **AF-001** Confirm final versions of `next.config.ts` and
    `postcss.config.mjs`
2.  [ ] **AF-002** Verify `npx tsc --noEmit` and `npm run build` pass
3.  [ ] **AF-003** Regression-test login, logout, and password recovery
4.  [ ] **AF-004** Verify `proxy.ts` and Supabase server cookie handling
5.  [ ] **AF-005** Design Experience Vault tables and write SQL
6.  [ ] **AF-006** Write and verify RLS policies for experiences
7.  [ ] **AF-007** Implement the `/app/experiences` list page
8.  [ ] **AF-008** Implement the experience creation form and save
    action
9.  [ ] **AF-009** Implement experience details, editing, and deletion
10. [ ] **AF-010** Implement experience search and tag filtering

### Commands to Run Before the First Task

``` powershell
cd H:\applyflow
npx tsc --noEmit
npm run build
git status
```

**Final MVP success criterion:** An entry-level job seeker can create an
account, organize personal experiences, write answers for
company-specific applications, and track deadlines and statuses, with
all records securely isolated by account.
