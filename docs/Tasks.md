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

# 🚧 In Progress

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

# 🚧 In Progress

## Sprint 6 – Backend User & Emergency APIs (Planned)

- [ ] Create Emergency Request API
- [ ] Implement Get Emergency Requests API
- [ ] Implement Approve/Reject Request APIs
- [ ] Add User Profile update API

---

# 📋 Pending

## Frontend

### UI

- [x] Dark Mode Toggle
- [ ] Loading Screens
- [ ] Error Pages
- [ ] 404 Page

---

# Backend

## Authentication

- [x] Register API
- [x] Login API
- [x] JWT Authentication
- [x] Authorization Middleware


## User APIs

- [ ] Get Profile
- [ ] Update Profile
- [ ] Notifications API

## Emergency APIs

- [ ] Create Request
- [ ] Get Requests
- [ ] Approve Request
- [ ] Reject Request

## Inventory APIs

- [ ] Add Inventory
- [ ] Update Inventory
- [ ] Delete Inventory
- [ ] Get Inventory

## Hospital APIs

- [ ] CRUD Operations

## Notification APIs

- [ ] Socket.IO
- [ ] Live Notifications

---

# Database

- [ ] User Schema
- [ ] Inventory Schema
- [ ] Hospital Schema
- [ ] Notification Schema
- [ ] Emergency Request Schema

---

# Security

- [ ] Password Hashing
- [ ] JWT
- [ ] Input Validation
- [ ] Environment Variables
- [ ] Rate Limiting
- [ ] CORS Configuration

---

# Testing

- [ ] Frontend Testing
- [ ] Backend Testing
- [ ] API Testing
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

Sprint 6

Goal:

- Implement Emergency Request Creation, Retrieval, and Approval APIs
- Add Profile updates endpoint
- Establish live notifications with Socket.io foundation

Status:

⚪ Not Started – Awaiting Sprint 6 instruction