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

- [ ] Push Notifications
- [ ] AI Blood Demand Prediction
- [ ] SMS Notifications
- [ ] Email Notifications
- [ ] Progressive Web App (PWA)
- [ ] Mobile App

---

# Current Sprint

**Sprint 9** – UI Polish, Security Hardening & Error Handling

Goal:

Enhance user experience with App Router 404, loading, and error boundary pages, and harden backend security with rate limiting and CORS configuration.

Status:

🟢 Completed

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


---

## Product Scope

BloodLink Mobile/React Native development was discontinued. The project now maintains the web application as the primary product.
