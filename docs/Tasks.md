# BloodLink Development Tasks

> Update this file after every completed feature.

---

# ✅ Completed

## Planning

- [x] Project idea finalized
- [x] Feature planning completed
- [x] Technology stack finalized
- [x] Documentation created (ORD, PRD, ARCHITECTURE, DATABASE, API, AGENT, TECH_STACK)
- [x] GitHub repository created
- [x] Initial project structure planned

---

## Sprint 1 – Project Setup & Landing Page

- [x] Initialize Next.js 15 (App Router) project in `client/`
- [x] Configure TypeScript (strict mode)
- [x] Configure Tailwind CSS v4
- [x] Configure ESLint with recommended Next.js settings
- [x] Install dependencies: framer-motion, axios, react-icons
- [x] Create scalable folder structure (app/, components/, hooks/, context/, lib/, services/, utils/, types/)
- [x] Configure global styles (globals.css) with custom CSS properties, dark mode, animations
- [x] Configure Inter font via next/font/google
- [x] Create TypeScript types (types/index.ts)
- [x] Create placeholder directories for future sprints (hooks/, context/, lib/, services/, utils/)

### UI Components

- [x] Button.tsx – 4 variants, 3 sizes, loading state, icon support, href/Link rendering
- [x] Input.tsx – label, error, hint, icon slots, accessible IDs
- [x] Card.tsx – glass, hover, padding variants
- [x] Loader.tsx – sm/md/lg sizes, fullscreen overlay option

### Layout Components

- [x] Navbar.tsx – sticky, scroll-aware, mobile drawer (Framer Motion), animated logo
- [x] Footer.tsx – brand, contact, quick links, social icons, copyright

### Landing Page Sections

- [x] HeroSection.tsx – headline, CTA, animated blood drop, floating blood group tags, trust stats
- [x] AboutSection.tsx – mission/audience/commitment cards, gradient story banner
- [x] FeaturesSection.tsx – 6 features in responsive grid with colored icon badges
- [x] HowItWorksSection.tsx – 3-step process with pulsing circles and connector line
- [x] WhyChooseSection.tsx – gradient banner + 8 USP points checklist
- [x] StatsSection.tsx – 4 stat cards on gradient background with scroll-triggered animation
- [x] CTASection.tsx – gradient CTA with heartbeat icon and dual action buttons

### Assembly

- [x] app/layout.tsx – root layout with SEO metadata, viewport config, Inter font
- [x] app/page.tsx – landing page assembling all 7 sections

### Verification

- [x] `npm run build` passes with 0 TypeScript errors
- [x] 0 ESLint errors
- [x] All sections render correctly

---

## Sprint 2 – Authentication UI & Context

- [x] AuthContext setup (client-side only, localStorage mock database + session persistence)
- [x] Login Page UI (with validation, toggle password visibility, error alerts, loading state)
- [x] Signup Page UI (with multi-field validation, Organization/Individual check boxes)
- [x] Role Selection UI (tab-based picker inside registration page with dynamic inputs)
- [x] Forgot Password Page UI (with request confirmation screen)
- [x] Navbar integration (greetings, conditional button state updates, active session routing)

---

## Sprint 3 – Dashboard UI & Layout

- [x] Dashboard Layout (Sidebar, Topbar, layout.tsx shell with ProtectedRoute)
- [x] DashboardContext (localStorage mock: requests, inventory, hospitals, notifications)
- [x] ProtectedRoute component (auth guard + role redirect)
- [x] DashboardSidebar (collapsible desktop + mobile slide-over drawer)
- [x] DashboardTopbar (page title, notification bell dropdown, theme toggle, avatar)
- [x] WelcomeBanner (greeting, blood group badge, donor toggle, emergency CTA)
- [x] ProfileCard (avatar header strip, info grid, inline phone edit)
- [x] EmergencyRequestModal (blood group grid, full validation, success state)
- [x] ActiveRequestsCard (user's requests with status badges)
- [x] NotificationsPanel (typed notifications, mark-read, relative timestamps)
- [x] NearbyBloodBanksCard (mock banks, navigate/call buttons, map placeholder)
- [x] User Dashboard page (/dashboard) — assembled all user components
- [x] AdminStatsCards (4 animated stat cards from live context data)
- [x] BloodInventoryTable (CRUD: +/- buttons, inline edit, stock level bar)
- [x] EmergencyRequestsTable (filter tabs, expandable rows, approve/reject)
- [x] HospitalManagement (add/edit modal, delete confirmation)
- [x] Admin Dashboard page (/dashboard/admin) — assembled all admin components
- [x] New TypeScript types: EmergencyRequest, BloodInventoryItem, Hospital, Notification, DashboardNavItem

## Sprint 4 – Maps Integration

- [x] Google Maps JavaScript API setup (useGoogleMaps script loader)
- [x] Custom SVG Marker Pins (Droplet and Crosshair styles)
- [x] Interactive Info Windows with Navigation/Call buttons
- [x] Geolocation tracking (useGeolocation hook with user position dot)
- [x] Full-page Split Panel Nearby Map Route (`/dashboard/nearby`)
- [x] Synchronized card/marker interactions
- [x] Admin Hospital Map View (`/dashboard/admin/hospitals`)
- [x] Small inline interactive map card in dashboard
- [x] Graceful fallback UI for missing/invalid API key

---

## Sprint 5 – Backend Setup & JWT Auth

- [x] Initialize Express server in `server/`
- [x] Connect Mongoose with MongoDB
- [x] Implement JWT registration & login APIs
- [x] Setup Authorization middleware
- [x] TypeScript compiler configurations

---

## Sprint 6 – Backend User & Emergency APIs

- [x] Create Emergency Request API
- [x] Implement Get Emergency Requests API
- [x] Implement Approve/Reject Request APIs
- [x] Add User Profile update API
- [x] Establish live notifications with Socket.io foundation

---

## Sprint 7 – Full-Stack Integration: Inventory, Emergency Requests & Notifications

- [x] Blood Inventory backend: type, Mongoose model, controller, routes
- [x] Register `/api/inventory` in Express app
- [x] Align frontend TypeScript types with backend field names (`requestBy`, `hospital`, `isRead`, `receiverId`, status casing)
- [x] Replace localStorage mock state in `DashboardContext` with real backend API calls
- [x] Wire `createRequest`, `approveRequest`, `rejectRequest`, `updateInventory`, `markRead`, `markAllRead` to backend
- [x] Fix `EmergencyRequestsTable` field names and add async approve/reject with loading states
- [x] Fix `ActiveRequestsCard`, `NotificationsPanel`, `DashboardTopbar`, `BloodInventoryTable`, `AdminStatsCards`
- [x] Create missing `/dashboard/admin/inventory` page (was returning 404)
- [x] `npm run build` passes for both client and server with 0 TypeScript errors

---

## Sprint 8 – Hospital APIs & Full-Stack Integration

- [x] Create Hospital TypeScript type definition
- [x] Create Mongoose Hospital model/schema
- [x] Implement Hospital CRUD controller handlers
- [x] Define Hospital endpoints with validation in router
- [x] Wire dashboardService to backend `/api/hospitals` endpoints
- [x] Integrate DashboardContext state and CRUD actions with real API calls
- [x] Verify successful build compiles for server and client

---

## Sprint 9 – UI Polish, Security Hardening & Error Handling

- [x] Create App Router 404 page (`client/app/not-found.tsx`)
- [x] Create App Router global error boundary (`client/app/error.tsx`)
- [x] Create App Router global loading indicator (`client/app/loading.tsx`)
- [x] Create Dashboard route skeleton loading (`client/app/dashboard/loading.tsx`)
- [x] Create Dashboard route error boundary (`client/app/dashboard/error.tsx`)
- [x] Add `express-rate-limit` middleware to backend
- [x] Apply general API rate limiter (100 reqs / 15 mins)
- [x] Apply strict API rate limiter on auth and emergency routes (15 reqs / 15 mins)
- [x] Configure explicit CORS origins and headers in Express server
- [x] Verify client and server compile with 0 errors

---

## Sprint 10 – Nearby Facilities Caching & Map Actions

- [x] In-memory server-side cache for OpenStreetMap/Overpass queries (TTL, radius quantization, LRU pruning)
- [x] Separate "Navigate" (Google Maps directions) and "Open Map" (Google Maps pinned facility location)
- [x] Implement `getGoogleMapsLocationUrl` using Google Maps Search API (`https://www.google.com/maps/search/?api=1&query=<name>,<lat>,<lng>`)
- [x] Ensure "Navigate" button preserves origin and destination route generation (`https://www.google.com/maps/dir/...`)
- [x] Update result cards (`client/app/nearby/page.tsx`) and Leaflet popups (`client/components/map/MapContainer.tsx`) with genuine facility coordinates
- [x] Graceful edge-case handling for missing/invalid facility coordinates (returns empty string, avoids fake locations)
- [x] Automated unit test suite in `client/__tests__/locationService.test.ts` (26/26 tests passing)

---

## Sprint 11 – Live Emergency Request Tracking

- [x] Schema & Type Extensions: add `declinedBy` and `notifiedDonorsCount` to `EmergencyRequest` model and types
- [x] Tracking Statistics Calculator: `computeTrackingStats` calculates genuine database numbers (Notified, Responded, Accepted, Unable to Donate, Withdrawn, Pending) with responder deduplication
- [x] Backend Endpoints: `GET /api/emergency/:id/tracking`, `GET /api/emergency/:id/donor-status`, `POST /api/emergency/:id/decline`
- [x] Role-Based Authorization: enforce requester-only full tracking, donor-restricted response status, and admin aggregate monitoring
- [x] Real-time Socket.IO Integration: emit `request_tracking_updated` on all donor lifecycle actions; handle reconnection and auto-refetch
- [x] Requester Live Tracking Card: `LiveRequestTrackingCard.tsx` with vertical pipeline stepper, pulse connection indicator, and status badge
- [x] Requester Request Details Page: `/dashboard/requests/[id]` featuring separate Request Information and Live Request Tracking cards
- [x] Donor Own Response View: "Your Response: ✅ Accepted / ❌ Unable to Donate / ⏳ Pending" with "Unable to Donate" option in `ActiveRequestsCard.tsx`
- [x] Admin Aggregate Monitoring: aggregate summary metrics bar and row indicators (`Donors Responded: X`, `Accepted: Y`, `Status: Z`) in `EmergencyRequestsTable.tsx`
- [x] Comprehensive Test Coverage: 13 backend tests (`server/src/__tests__/emergencyTracking.test.ts`) and 6 frontend component tests (`client/__tests__/emergencyTracking.test.tsx`)

---

## Sprint 12 – Emergency Blood Request Expiry

- [x] Schema & Model Extension: add `expiresAt: Date` field to `EmergencyRequest` model and index `{ expiresAt: 1, status: 1 }` (no TTL deletion)
- [x] Expiry Configuration: add `EMERGENCY_REQUEST_DEFAULT_EXPIRY_HOURS=24` default with environment variable override in `.env.example` & `.env.production.example`
- [x] Request Creation Expiry: calculate absolute timestamp `expiresAt = createdAt + duration` on POST `/api/emergency` and persist in MongoDB
- [x] Safe Backward Compatibility: safely compute/backfill `expiresAt` for older emergency request records without crashing or data loss
- [x] Active Request Protection: verify expiration on all donor interactions (`accept`, `decline`, `donation-report`, `cancel`); return 409 Conflict `"This emergency request has expired."`
- [x] Terminal State Preservation: requests in fulfilled (`Completed`), `Cancelled`, or `Rejected` states never transition to `Expired`
- [x] Server-Side Expiration Sweep: implement `checkAndExpireRequest` (just-in-time) and `expireOverdueRequests` periodic background worker (every 60s)
- [x] Real-Time Socket.IO Synchronization: broadcast `request_expired` and update `request_tracking_updated` when requests expire
- [x] Requester UI Expiration Countdown: live "Expires in: HH:MM:SS" countdown timer on `LiveRequestTrackingCard.tsx` and `/dashboard/requests/[id]`
- [x] Expired Request UI Banner: display "Request Status: ⏰ Expired" and "This emergency blood request is no longer active."
- [x] Donor UI Expiration Handling: display `⏰ Request Expired` and disable `[ Accept ]` and `[ Unable to Donate ]` actions in `ActiveRequestsCard.tsx`
- [x] Admin Management Tab: add `⏰ Expired` and `🟢 Fulfilled` filter tabs, count badges, and expiration dates in `EmergencyRequestsTable.tsx`
- [x] Automated Test Suites: 14 backend expiry tests (`server/src/__tests__/emergencyExpiry.test.ts`) and 3 frontend tests (`client/__tests__/emergencyExpiry.test.tsx`) passing 100%

---

# 📋 Pending

## Frontend

### UI

- [x] Dark Mode Toggle
- [x] Loading Screens
- [x] Error Pages
- [x] 404 Page

---

# Backend

## Authentication

- [x] Register API
- [x] Login API
- [x] JWT Authentication
- [x] Authorization Middleware


## User APIs

- [x] Get Profile
- [x] Update Profile
- [x] Notifications API

## Emergency APIs

- [x] Create Request
- [x] Get Requests
- [x] Approve Request
- [x] Reject Request
- [x] Cancel Request

## Inventory APIs

- [x] Add Inventory
- [x] Update Inventory
- [x] Delete Inventory
- [x] Get Inventory

## Hospital APIs

- [x] CRUD Operations

## Notification APIs

- [x] Socket.IO
- [x] Live Notifications

---

# Database

- [x] User Schema
- [x] Inventory Schema
- [x] Hospital Schema
- [x] Notification Schema
- [x] Emergency Request Schema

---

# Security

- [x] Password Hashing
- [x] JWT
- [x] Input Validation
- [x] Environment Variables
- [x] Rate Limiting
- [x] CORS Configuration

---

# Testing

- [x] Frontend Testing
- [x] Backend Testing
- [x] API Testing
- [ ] Responsive Testing
- [ ] Performance Testing

---

# Deployment

- [ ] Deploy Frontend (Vercel)
- [ ] Deploy Backend (Render)
- [ ] MongoDB Atlas Setup
- [ ] Production Environment Variables

---

# Future Enhancements

- [ ] AI Blood Demand Prediction
- [ ] SMS Notifications
- [ ] Email Notifications

---

# Current Sprint

**Sprint 9** – UI Polish, Security Hardening & Error Handling

Goal:

Enhance user experience with App Router 404, loading, and error boundary pages, and harden backend security with rate limiting and CORS configuration.

Status:

🟢 Completed

## Feature – In-Memory Caching for Nearby Hospitals & Blood Banks

Status:

🟢 Completed

- [x] In-memory cache service (`NearbyMemoryCache` in `server/src/services/nearbyCache.ts`)
- [x] Cache only public OpenStreetMap/Overpass facility search results
- [x] Normalized cache key generation (`nearby:<lat>:<lng>:<radius>`) with coordinate rounding
- [x] Configurable TTL via `NEARBY_CACHE_TTL_MS` (default 5 minutes / 300000ms)
- [x] Memory safety with configurable `MAX_NEARBY_CACHE_ENTRIES` (default 100) and LRU eviction
- [x] In-flight request deduplication (single-flight) to prevent duplicate upstream calls
- [x] Cache response visibility with `X-Cache: HIT` / `X-Cache: MISS` headers
- [x] Automated test suite in `server/src/__tests__/nearbyCache.test.ts` (17 tests passing)
- [x] Architectural and API documentation updated in `docs/Architecture.md` and `docs/API.md`
- [x] Environment variable placeholders added in `server/.env.example` and `server/.env.production.example`

## Feature – Bulk Blood Inventory Upload & Smart Stock Analysis

Status:

🟢 Completed

Add a new feature to the Admin/Blood Bank dashboard so admins do not have to manually update blood inventory every time.

### Upload

Allow the admin to upload blood inventory/donor data using:
- Excel (.xlsx, .xls)
- CSV
- PDF

The uploaded file may contain donor/blood-unit records such as:
- Donor ID
- Blood Group
- Donation Date
- Units
- Status

### Processing

After upload:
- Read and parse the uploaded file.
- Identify the blood group from each valid record.
- Calculate the total available units for each blood group.
- Update the Blood Inventory automatically.
- Avoid duplicate records when the same file/data is uploaded again.
- Validate the file and show clear errors for invalid or missing data.

### Inventory Dashboard

Display each blood group like:

A+   → 300 units → Highly Available
A-   → 120 units → Available
B+   → 75 units  → Moderate
B-   → 35 units  → Low
AB+  → 12 units  → Very Low
AB-  → 5 units   → Critical
O+   → 250 units → Highly Available
O-   → 8 units   → Critical

Use a clear 10-level availability indicator from:
1. Highly Available
2. Very High
3. High
4. Good
5. Available
6. Moderate
7. Low
8. Very Low
9. Critical
10. Almost Empty

Make the thresholds configurable instead of hardcoding them.

### Dashboard

Add:
- Upload File button
- Drag-and-drop upload area
- Upload progress
- File validation status
- Last updated timestamp
- Total units by blood group
- Availability level indicator
- Upload history
- Ability to replace/update inventory from a new file

### AI/Data Processing

Use intelligent data processing to handle different column names and formats where possible.

For example:
- "Blood Type", "Blood Group", "Group" → bloodGroup
- "Quantity", "Units", "Stock" → units

Do NOT blindly accept incorrect data. Validate everything before updating the database.

### Security

- Only Admin/Blood Bank users can upload inventory files.
- Validate file type and file size.
- Never execute uploaded files.
- Sanitize parsed data.
- Do not expose donor personal information on the public dashboard.

### Integration

Integrate this with the existing:
- MongoDB inventory system
- Admin dashboard
- Emergency request system
- Notification system

If inventory becomes critically low, automatically notify the admin.

Before implementation, inspect the existing database models, APIs, dashboard components, and documentation so the new feature fits the current architecture.

Test Excel, CSV, and PDF uploads, inventory calculation, duplicate handling, validation, and dashboard updates.

Update TASKS.md and relevant documentation after completion.

## Feature – Task #6: Donor Profile Improvements (Smart Blood Donor Finder)

Status:

🟢 Completed

- [x] Pre-implementation inspection: Analyzed `User`, `EmergencyRequest`, existing controllers, routes, and i18n models
- [x] Zero fake statistics policy: All metrics derived strictly from authenticated MongoDB records (completed requests, response records, donor locations)
- [x] Blood Group handling: Displays registered blood group or "Not provided" without guessing
- [x] Availability status: Real-time status display (🟢 Available / 🟡 Temporarily unavailable) preserved with synchronous context and backend update
- [x] Location privacy: Exact GPS and street coordinates protected; public profiles only display district/state or approximate distance calculation
- [x] Verified donation history: Server verifies only emergency requests with `status === "Completed"` and confirmed donor reporting; displays "Donation history unavailable" / "Not available" when none exists
- [x] Authentic last donation date: Exact ISO timestamp of verified donation; signup, registration, or acceptance timestamps strictly rejected as substitutes
- [x] Accurate response rate calculation: Computes `responded / eligible * 100` with medical blood group compatibility; returns null ("Not enough data") when 0 eligible requests to avoid misleading 0%
- [x] Role-based visibility & privacy: Authenticated donor receives full profile; public endpoint `GET /api/users/donor/:id` masks email, exact coordinates, and hides phone unless active request accepted
- [x] Safe profile editing: Authenticated users can edit blood group, availability, phone, name, and district/state; client edits to server-computed statistics are strictly prohibited
- [x] Clean separation of Donor Eligibility: Informational medical criteria link maintained separately from profile metrics
- [x] Full multilingual coverage: Added strings across all 7 supported languages (`en`, `hi`, `kn`, `ml`, `mr`, `ta`, `te`)
- [x] Responsive mobile UI: Smooth responsive card layout with loading, empty, and error fallback states
- [x] Automated test suites:
  - [x] Server suite: `server/src/__tests__/donorProfile.test.ts` (9/9 passing)
  - [x] Client suite: `client/__tests__/donorProfile.test.tsx` (8/8 passing)
  - [x] All 11 server test suites pass (143/143 tests)
  - [x] All 12 client test suites pass (100/100 tests)
- [x] Production builds & linting: TypeScript & Next.js production builds succeeded with 0 errors; ESLint passed with 0 errors

## Task #7 — Settings Section (Production-Ready Healthcare Controls)

- [x] Complete Settings architecture & grouping:
  - [x] ACCOUNT: Edit Profile modal, Phone & Email verification view, Change Password modal with validation
  - [x] DONOR: Donor Availability toggle, Verified Donation History modal (zero fake data), Pause Donor Requests toggle (blood group configuration prompt removed)
  - [x] NOTIFICATIONS: Emergency Blood Requests toggle (hard-coded mandatory ON with legal justification notice), Nearby Donor Requests toggle, Blood Bank Updates toggle, SMS Notifications toggle, WhatsApp Notifications toggle
  - [x] PRIVACY & LOCATION: Location Sharing toggle with healthcare rationale, Profile Visibility modal ("matching" vs "hidden"), Phone Number Privacy modal ("on_request" vs "hidden" vs "public")
  - [x] EMERGENCY: Emergency Alert Radius modal (5, 10, 25, 50 km), Emergency Contact modal (name, 10-digit phone, relationship)
  - [x] SECURITY: Two-Factor Authentication toggle, Login Activity modal with current session inspector & "Log out of all other devices"
  - [x] APP: Dark Mode toggle (integrated with `next-themes`), Language modal (7 languages: English, Kannada, Malayalam, Tamil, Telugu, Hindi, Marathi), Help & Support modal (24/7 National Helplines 104/108/112), About BloodLink modal (v2.4.0), Legal modals for Privacy Policy & Terms
  - [x] ACCOUNT MANAGEMENT: Download My Data (export personal records to JSON), Delete BloodLink Account (destructive modal requiring typing "DELETE" confirmation)
- [x] Backend Schema & APIs:
  - [x] User schema extended with embedded `settings` (`IUserSettings` for donor, notifications, privacy, emergency, security)
  - [x] `GET /api/users/settings`: Returns authenticated user settings with safe defaults
  - [x] `PUT /api/users/settings`: Securely persists user settings; enforces `emergencyAlerts: true` rule
  - [x] `PUT /api/users/change-password`: Validates current password via bcrypt and sets new password with length check
  - [x] `GET /api/users/export-data`: Generates comprehensive personal data archive
  - [x] `DELETE /api/auth/delete-account`: Irrevocably purges user account, requests, and notifications
- [x] UI / UX & Mobile Responsiveness:
  - [x] Reusable component hierarchy: `SettingsSection`, `SettingsRow`, `SettingsToggle`, `SettingsModal`
  - [x] Framer Motion backdrop and spring-physics animations
  - [x] Dashboard sidebar and topbar updated with active navigation and route labels
  - [x] All 7 locale translation files updated with `sidebar_settings` and `topbar_settings`
- [x] Donor Profile Redesign & Card Consolidation:
  - [x] Unified `ProfileCard` combining User Account Identity on top with Donor Profile activity metrics below
  - [x] Removed disconnected standalone top card and eliminated redundant red top stripe
  - [x] Compact 4-column metrics grid (Availability, Verified Donations, Last Donation, Response Rate) with medical guidance link
  - [x] Inline profile editing with zero blood group prompts per specifications
  - [x] Removed redundant LanguageSelector and ThemeToggle from header/Navbar & DashboardTopbar (consolidated inside Settings)
  - [x] Removed WhatsApp Notifications and SMS Notifications toggles from Settings page per user requirement
  - [x] Optimized Dark Mode toggle with optimistic local state and hardware-accelerated CSS transition matching other toggles (0ms response)
  - [x] Restructured Dashboard Overview into balanced 2-column layout: Emergency Requests and Nearby Blood Banks sit side-by-side in Row 2, eliminating empty right-side void and vertical stacking
- [x] Verification & Automated Tests:
  - [x] Server test suite: `server/src/__tests__/settings.test.ts` (5/5 passing)
  - [x] Client test suite: `client/__tests__/settings.test.tsx` (7/7 passing)
  - [x] Client test suite: `client/__tests__/donorProfile.test.tsx` (7/7 passing)
  - [x] All 12 server test suites pass (148/148 tests)
  - [x] Full Next.js production build (`npm run build`) completed with 0 errors
  - [x] ESLint on Settings components and pages passed with 0 errors

## DevOps & Deployment

- [x] Create Dockerfile for frontend
- [x] Create Dockerfile for backend
- [x] Create docker-compose.yml for local development
- [ ] Configure production environment variables
- [x] Set up CI/CD using GitHub Actions
- [ ] Configure automatic deployment
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend to Render
- [ ] Configure MongoDB Atlas for production
- [ ] Perform production testing

## Testing

- [x] Add unit tests
- [x] Add API/integration tests
- [ ] Perform end-to-end testing
- [ ] Security testing
- [ ] Performance testing


## Website Quality & Release Readiness

- [x] Custom 404 Page (`client/app/not-found.tsx` with BloodLink branding & return navigation)
- [x] Page-Specific Meta Titles (configured across all routes via App Router layouts)
- [x] Page-Specific Meta Descriptions (accurate, non-keyword-stuffed descriptions for public routes)
- [x] Favicon & Touch Icon Set (`favicon.ico`, `icon.tsx` 32x32 PNG, `apple-icon.tsx` 180x180 PNG)
- [x] robots.txt (`client/app/robots.ts` with public indexing and dashboard/api protection)
- [x] sitemap.xml (`client/app/sitemap.ts` with public routes and canonical URL)
- [x] Open Graph & Twitter Card Metadata (`client/app/opengraph-image.tsx` 1200x630 card)
- [x] Alt Text & Accessibility Audit (semantic controls, aria labels, no generic 'image' text)
- [x] Image Optimization Audit (SVG vectors and lightweight assets)
- [x] Privacy Policy Page (`/privacy` and `/privacy-policy` with genuine project facts)
- [x] Terms & Conditions Page (`/terms` and `/terms-and-conditions` with emergency medical disclaimer)
- [x] Genuine Contact Information (`support@bloodlink.in`, `+91 1800-000-0000`, Mysore, Karnataka)

---

## Product Scope

BloodLink maintains a modern Next.js web application and Android APK testing bundle powered by Capacitor.