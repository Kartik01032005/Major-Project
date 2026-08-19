# AI Agent Instructions

# Project Name

BloodLink – Smart Blood Donor Finder

---

# Project Goal

Build a production-ready, scalable, secure, and fully responsive Blood Donor Finder web application that connects blood donors, blood banks, hospitals, and patients during emergencies.

The project must prioritize:

- Clean Architecture
- Scalability
- Security
- Performance
- Accessibility
- Maintainability
- Responsive Design
- Production Quality Code

---

# Technology Stack

## Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Axios
- React Icons

## Backend

- Node.js
- Express.js
- Socket.IO
- Multer
- dotenv

## Database

- MongoDB Atlas
- Mongoose

## Authentication

- JWT Authentication
- bcrypt Password Hashing

## Notifications

- Socket.IO (Real-time)
- Firebase Cloud Messaging (Future Enhancement)

## Maps

- Google Maps JavaScript API
- Google Places API

## Deployment

Frontend
- Vercel

Backend
- Render

Database
- MongoDB Atlas

Version Control
- Git
- GitHub

---

# Folder Structure

client/

│

├── app/

├── components/

├── hooks/

├── services/

├── context/

├── lib/

├── utils/

├── types/

├── public/

└── styles/

server/

│

├── controllers/

├── routes/

├── middleware/

├── models/

├── services/

├── config/

├── socket/

├── utils/

└── uploads/

docs/

---

# Coding Standards

Always

- Use TypeScript.
- Use Next.js App Router.
- Use Server Components by default.
- Use Client Components only when necessary.
- Use functional React components.
- Use async/await.
- Use ES Modules.
- Write reusable components.
- Keep files modular.
- Keep controllers thin.
- Put business logic inside services.
- Validate every request.
- Handle every possible error.
- Use descriptive variable names.
- Use descriptive function names.
- Keep components small.
- Follow REST API standards.
- Use environment variables.
- Write production-ready code.

---

# UI Guidelines

The UI should be

- Modern
- Professional
- Medical Theme
- Mobile First
- Fully Responsive
- Accessible
- Minimalistic
- Fast

Primary Colors

- Red
- White
- Neutral Gray

Animations

Use Framer Motion only where necessary.

Avoid excessive animations.

---

# Performance Rules

- Lazy load heavy components.
- Optimize images.
- Keep bundle size small.
- Avoid unnecessary re-renders.
- Use Server Components whenever possible.
- Minimize Client Components.

---

# Security Rules

Always

- Hash passwords using bcrypt.
- Authenticate using JWT.
- Validate every request.
- Sanitize user input.
- Protect against XSS.
- Protect against CSRF where applicable.
- Protect against NoSQL Injection.
- Never expose secrets.
- Never expose API keys.
- Never expose JWT secrets.
- Never commit .env files.

---

# Database Rules

Use MongoDB Atlas.

Collections

- Users
- BloodInventory
- EmergencyRequests
- Notifications
- Hospitals

Use Mongoose models.

Never perform direct database operations inside routes.

Always use services.

---

# API Rules

All APIs should

- Follow REST conventions.
- Return proper HTTP status codes.
- Return consistent JSON responses.
- Validate request bodies.
- Validate query parameters.
- Handle errors gracefully.

---

# Notification Rules

Use Socket.IO for

- Emergency blood requests
- Admin approvals
- Inventory updates
- Live notifications

Firebase Cloud Messaging is optional and should only be added after the core application is complete.

---

# Maps Rules

Use Google Maps JavaScript API.

Features

- Nearby Blood Banks
- Hospital Locations
- Navigation
- Current User Location

---

# Code Quality

Always

- Remove unused code.
- Remove console.logs before production.
- Write readable code.
- Avoid duplicate logic.
- Reuse components.
- Keep files organized.

---

# Never

Never

- Store plain text passwords.
- Duplicate code.
- Use inline styles unless necessary.
- Write giant components.
- Mix UI and business logic.
- Hardcode API URLs.
- Hardcode secrets.
- Commit .env files.
- Ignore TypeScript errors.
- Ignore ESLint warnings.

---

# Development Workflow

Before generating any code

1. Read README.md
2. Read ORD.md
3. Read PRD.md
4. Read ARCHITECTURE.md
5. Read DATABASE.md
6. Read API.md
7. Read TASKS.md
8. Read TECH_STACK.md

Understand the complete project before writing code.

---

# Implementation Rules

Implement only one feature at a time.

Complete the feature fully.

Test the feature.

Update TASKS.md.

Commit meaningful code.

Only then continue to the next feature.

---

# Feature Order

1. Project Setup
2. Authentication
3. Landing Page
4. User Dashboard
5. Admin Dashboard
6. Blood Inventory
7. Emergency Requests
8. Notifications
9. Google Maps
10. User Profile
11. Admin Approval Flow
12. Backend Integration
13. Testing
14. Deployment

Do not skip the order unless explicitly instructed.

---

# AI Agent Behavior

Before making architectural changes:

- Review existing documentation.
- Preserve the current project structure.
- Avoid unnecessary dependencies.
- Prefer built-in Next.js functionality when appropriate.
- Ask for confirmation before introducing major architectural changes or replacing core technologies.

If documentation conflicts with code, follow the documentation and flag the inconsistency instead of making assumptions.

Always keep the codebase scalable, maintainable, secure, and production-ready.


---

# 6. `docs/Agent.md`

Add this:

```md
# AI Agent Behavior

Before making architectural changes:

- Review existing documentation.
- Preserve the current project structure.
- Avoid unnecessary dependencies.
- Prefer built-in functionality when appropriate.
- Ask for confirmation before introducing major changes.

If documentation conflicts with code, follow the documentation and flag the inconsistency instead of making assumptions.

Always keep the codebase:

- Scalable
- Maintainable
- Secure
- Production-ready## Mobile Development Rules

- The mobile application must be developed inside `mobile/`.
- Do not place React Native code inside `client/`.
- Do not create a separate backend for the mobile application.
- Use the existing `server/` APIs.
- Do not create a separate MongoDB database for mobile.
- Reuse existing API contracts wherever possible.
- Keep shared types consistent between applications.
- Never expose backend secrets in the mobile application.
- Never connect the mobile application directly to MongoDB.
- All authorization must be enforced by the backend.
- Maintain the existing web application functionality.
- Test mobile changes without breaking the web application.