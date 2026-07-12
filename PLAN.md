# PlacePilot — AI-Powered Placement Management Platform
## Master Implementation Plan

This document outlines the step-by-step implementation plan for PlacePilot. We will build, run, and verify the app phase by phase.

---

### Core Architectural Decisions & Assumptions
- **Role Modeling**: Single `users` collection with a `role` discriminator (`student`, `placement_officer`, `recruiter`, `admin`). Students and recruiters will have reference profiles (`StudentProfile`, `Company` profile mappings) to keep the core user model light.
- **Authentication**: JWT access token (~15m, payload includes id/role) sent via custom HTTP header/JSON, and a long-lived refresh token (~7d) sent via `httpOnly` secure cookie.
- **File Management**: Resumes and logos uploaded via Multer and sent directly to Cloudinary.
- **AI Integration**: Gemini API client service with JSON mode constraint and local fallback mode to prevent demo failure if API key is not present.

---

## Task Progress

### [x] Phase 0 — Scaffolding
- [x] Initialize git repo
- [x] Scaffold server project (Node, Express, TypeScript, dotenv, mongoose, etc.)
- [x] Scaffold client project (Vite + React + TypeScript)
- [x] Install dependencies on server and client
- [x] Configure Tailwind CSS & shadcn/ui on client
- [x] Set up base directory structures for client and server
- [x] Implement Express server entrypoint (`server.ts` or `app.ts` / `index.js`) with healthcheck, DB connection, and error handling
- [x] Create `.env.example` in both client and server directories
- [x] Verify Phase 0 (run dev servers, check health route)

### [x] Phase 1 — Auth & Users
- [x] Create Mongoose schemas: `User` and `StudentProfile` (stub)
- [x] Implement JWT helper utility (sign/verify, rotation of refresh tokens)
- [x] Implement Backend Auth Controller: register, login, refresh, logout, verify-email, forgot-password, reset-password
- [x] Implement middleware: `authenticateJWT`, `requireRole(['role1', 'role2'])`, `rateLimiter`, `validate` (Zod validation helper)
- [x] Write Zod schemas for all Auth requests
- [x] Set up Email Service stub (or direct integration with Resend)
- [x] Create DB Seed script for a default Admin, Officer, and Recruiter
- [x] Verify Phase 1 (run backend tests/requests for registration, login, token refresh)

### [x] Phase 2 — Design System & App Shell
- [x] Set up `ThemeContext` (Light/Dark mode) in client, persisting selection
- [x] Install icons (lucide-react) and add Tailwind custom variable tokens
- [x] Build reusable UI components:
  - [x] `DataTable` (generic, search, pagination, column selection)
  - [x] `StatCard` (with trend indicator)
  - [x] `EmptyState`, `ErrorState`, `Skeleton` views
  - [x] Custom inputs, modals, toast hooks
- [x] Create layouts:
  - [x] `AuthLayout` (centered card, nice backdrops)
  - [x] `DashboardLayout` (sidebar, responsive topbar, profile dropdown, notification bell, breadcrumbs)
  - [x] `PublicLayout` (landing page, clean header/footer)
- [x] Implement beautiful Landing Page (marketing page for PlacePilot)
- [x] Configure React Router DOM v6 with public, protected, and role-guarded routes
- [x] Verify Phase 2 (run client dev server, browse landing, register page, theme switch, responsive check)

### [x] Phase 3 — Student Module
- [x] Complete `StudentProfile` Mongoose model and validator schemas
- [x] Backend routes for Profile management (GET, PUT) and Resume Upload (POST, PDF limit, Cloudinary)
- [x] Frontend Student Profile Screen:
  - [x] Stepper form / Tabbed editor (Education, Skills, Experience, Projects, Certifications)
  - [x] PDF upload component for resume
- [x] Backend routes for Drives browsing (eligible drives only: check CGPA, backlogs, branch)
- [x] Frontend Student Placement Drives View:
  - [x] Grid of open drives, filter by eligibility status, package, deadline
  - [x] Application submission (POST request to create `Application`)
- [x] Frontend Student Dashboard:
  - [x] Current application tracker (timeline view showing status updates)
  - [x] Upcoming interview calendar/list
- [x] Verify Phase 3 (log in as student, fill profile, upload resume, apply for drive, check dashboard)

### [x] Phase 4 — Companies & Drives (Placement Officer)
- [x] Create Mongoose models: `Company` and `PlacementDrive`
- [x] Create Zod validators and backend routes for Company CRUD and Drive CRUD
- [x] Build Placement Officer Dashboard:
  - [x] Analytics overview using Recharts (total applications, overall placement %, drives in progress)
  - [x] Company management panel (CRUD table)
  - [x] Placement Drives management panel:
    - [x] Create drive form (eligibility cutoff rules, batch, deadline, CTC, JD text)
    - [x] Drive applicants list: shortlist buttons, advance status, schedule interview
- [x] Verify Phase 4 (log in as officer, create company, create drive, view dummy analytics)

### [x] Phase 5 — Recruiter Module
- [x] Backend routes for Recruiter specific company profile management
- [x] Frontend Recruiter Dashboard:
  - [x] Recruiter Company Profile Editor
  - [x] Active Hiring Drives view
  - [x] Applicant Shortlisting Workspace:
    - [x] List of applicants for recruiter's drives
    - [x] Resume viewer (iframe/viewer), score indicators, select/reject action
    - [x] Schedule interview panel (select round, date/time, mode, details)
    - [x] Offer management: upload offer letter PDF, set package, issue offer
- [x] Verify Phase 5 (log in as recruiter, view applicants, schedule interview, upload offer)

### [x] Phase 6 — Admin Module
- [x] Create Mongoose model: `ActivityLog` (audit logging)
- [x] Create audit logger middleware (log modifications to user roles, system configs, delete actions)
- [x] Backend routes for Admin functions (users list, update role, disable user, audit logs list)
- [x] Frontend Admin Dashboard:
  - [x] User list table (manage roles, activate/deactivate accounts)
  - [x] Audit logs viewer (filterable table: who, what, when, entity)
  - [x] Global system settings (singleton configuration panel)
- [x] Verify Phase 6 (log in as admin, edit student role to recruiter or officer, view audit logs)

### [x] Phase 7 — Analytics & Reports
- [x] Build heavy aggregation pipelines in backend to retrieve:
  - [x] Placement rate by department and batch
  - [x] Package statistics (highest, average, median, range)
  - [x] Monthly hiring trends
  - [x] Company-wise hiring comparison
- [x] Implement Export features in backend/frontend:
  - [x] Export to CSV/Excel (student master list, placed students, active drives)
  - [x] Export to PDF (Placement Report summary)
- [x] Embed detailed charts using Recharts in Officer and Admin dashboards
- [x] Verify Phase 7 (run aggregations, test download Excel/PDF, verify chart rendering)

### [ ] Phase 8 — Real-Time & Email
- [ ] Set up Socket.io server connection and event listeners
- [ ] Create Frontend Socket Context (`SocketContext`)
- [ ] Build Real-Time Notifications system:
  - [ ] Server emits `notification:new` on application status change, new drive published, interview scheduled
  - [ ] Notification schema, API endpoints (GET unread, PUT mark as read)
  - [ ] Animated navbar notification bell, popup panel, real-time toast alerts
- [ ] Set up Resend integration on backend:
  - [ ] Email templates: Verification Email, Password Reset, Interview Scheduled, Offer Letter Issued
  - [ ] Trigger emails on critical actions
- [ ] Verify Phase 8 (trigger notification or email, check real-time receive in browser, email logs)

### [ ] Phase 9 — AI Features (Google Gemini)
- [ ] Build `geminiClient` wrapper service with JSON constraint and try-repair-fallback
- [ ] **AI Resume Analyzer (7.1)**:
  - [ ] Parser service (extract text from PDF resume)
  - [ ] Prompt Gemini for structured analysis
  - [ ] Frontend analysis dashboard tab on Student Profile
- [ ] **AI Resume ↔ JD Matching (7.2)**:
  - [ ] Batch match resume against JD
  - [ ] Recruiter applicant list shows "AI Match Score" and matching/missing skills
- [ ] **AI Career Advisor (7.3)**:
  - [ ] Analyze student profile, return roadmap and company matches
  - [ ] Frontend career guidance panel
- [ ] **AI Interview Generator (7.4)**:
  - [ ] Generate customized questions based on resume & job role
  - [ ] Frontend Mock Interview prep interface
- [ ] **AI Chatbot Widget (7.5)**:
  - [ ] Context-aware chatbot in student panel (remembers eligibility rules)
  - [ ] Collapsible chat widget
- [ ] Verify Phase 9 (trigger all AI panels, inspect JSON parsing, check offline mock behavior)

### [ ] Phase 10 — Global Search & Polish
- [ ] Implement search service using text indexes or search routes (across drives, companies, students)
- [ ] Add Command Palette (⌘K / Ctrl+K) in the client layout for quick navigation
- [ ] Add Framer Motion transitions (fade-in, list item staggers, slide-overs)
- [ ] Conduct Responsive Design QA and Accessibility check (focus states, labels)
- [ ] Verify Phase 10 (navigate entirely via keyboard, check mobile responsiveness)

### [ ] Phase 11 — Seed Data, Docs & Deploy Config
- [ ] Create comprehensive seed script with realistic data:
  - [ ] 1 Admin, 2 Officers, 3 Recruiters, 25+ Students
  - [ ] Open and closed drives, multiple applications in different states (applied, shortlisted, offer)
  - [ ] Notifications and activity logs populated
- [ ] Write detailed `README.md` (installation, environment keys, architecture, role credentials)
- [ ] Prepare deploy-ready files: `vercel.json` (frontend), Render configuration (`render.yaml` or build steps), and environment variables
- [ ] Verify Phase 11 (run fresh db wipe & seed, start clean, verify everything works seamlessly)
