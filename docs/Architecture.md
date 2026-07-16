# BloodLink System Architecture

## Overview

BloodLink is a modern, scalable, full-stack web application built to connect blood donors, blood banks, hospitals, and patients during emergencies.

The application follows a layered architecture to ensure scalability, maintainability, and separation of concerns.

---

# Technology Stack

## Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- React Icons
- Axios

## Backend

- Node.js
- Express.js
- Socket.IO
- JWT
- bcrypt

## Database

- MongoDB Atlas
- Mongoose

## External Services

- Google Maps JavaScript API
- Google Places API
- Firebase Cloud Messaging (Future)

---

# High Level Architecture

```
                User Browser
                     │
                     ▼
              Next.js Frontend
                     │
          Axios REST API Requests
                     │
                     ▼
             Express.js Backend
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
     MongoDB Atlas         Socket.IO Server
          │                     │
          └──────────┬──────────┘
                     ▼
            Google Maps API
```

---

# Project Structure

```
BloodLink/

├── client/
│
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── context/
│   ├── lib/
│   ├── services/
│   ├── utils/
│   ├── types/
│   ├── public/
│   └── styles/
│
├── server/
│
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── config/
│   ├── socket/
│   ├── uploads/
│   └── utils/
│
├── docs/
│
└── README.md
```

---

# Frontend Architecture

The frontend is responsible for:

- User Authentication
- User Dashboard
- Admin Dashboard
- Emergency Blood Requests
- Notifications
- Google Maps
- Responsive UI

Routing is handled using the Next.js App Router.

State management should use:

- React Context
- Custom Hooks

Axios is responsible for communicating with the backend.

---

# Backend Architecture

The backend follows a layered architecture.

```
Routes

↓

Controllers

↓

Services

↓

Models

↓

MongoDB
```

Routes

Receive requests.

↓

Controllers

Validate requests.

↓

Services

Business logic.

↓

Models

Database operations.

---

# Database Architecture

Collections

- Users
- BloodInventory
- Hospitals
- EmergencyRequests
- Notifications

Relationships

User

↓

Emergency Request

↓

Notification

Blood Bank

↓

Blood Inventory

Hospital

↓

Emergency Requests

---

# Authentication Flow

User

↓

Login

↓

JWT Generated

↓

Stored securely

↓

Sent with every request

↓

Backend validates token

↓

Access granted

---

# Emergency Request Flow

User presses

Emergency Button

↓

Emergency Request Created

↓

Stored in MongoDB

↓

Socket.IO broadcasts

↓

All donors notified

↓

All blood banks notified

↓

Admin approves

↓

Receiver notified

↓

Google Maps navigation enabled

---

# Notification Architecture

Socket.IO handles

- Live Emergency Alerts
- Blood Bank Approval
- Inventory Updates

Future

Firebase Cloud Messaging

for push notifications.

---

# Google Maps Flow

User Location

↓

Nearby Blood Banks

↓

Hospital Location

↓

Navigation

↓

Google Maps

---

# Security Architecture

JWT Authentication

↓

Authorization Middleware

↓

Request Validation

↓

Controller

↓

Service

↓

Database

Passwords

↓

bcrypt Hashing

Environment Variables

↓

dotenv

---

# Deployment Architecture

Frontend

↓

Vercel

Backend

↓

Render

Database

↓

MongoDB Atlas

Assets

↓

Cloudinary (Optional)

---

# Design Principles

- Separation of Concerns
- Feature-based Architecture
- RESTful APIs
- Reusable Components
- Scalable Folder Structure
- Mobile First Design
- Secure by Default
- Production Ready Code

---

# Future Enhancements

- AI Blood Demand Prediction
- SMS Notifications
- Email Notifications
- Multi-language Support
- Progressive Web App
- Mobile Application
- Docker Support
- Kubernetes Support