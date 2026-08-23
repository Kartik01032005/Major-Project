# Product Requirements Document (PRD)

# Project Name

BloodLink – Smart Blood Donor Finder

---

# Product Goal

Develop a secure, responsive, real-time web application that helps patients quickly find blood donors and nearby blood banks during emergencies while allowing blood banks to efficiently manage their blood inventory.

---

# User Roles

## User

A normal user can:

- Register
- Login
- Manage Profile
- Request Blood
- Receive Notifications
- View Nearby Blood Banks
- Navigate using Google Maps

---

## Admin (Blood Bank)

An administrator can:

- Login
- Manage Blood Inventory
- Upload Blood Data
- Update Blood Stock
- Manage Hospitals
- Receive Emergency Requests
- Approve Requests
- Reject Requests

---

# Authentication

## Features

- User Registration
- Secure Login
- Logout
- JWT Authentication
- Role-Based Access

### Acceptance Criteria

- Passwords must be encrypted using bcrypt.
- JWT token generated after login.
- Roles stored securely.
- Protected routes cannot be accessed without authentication.

---

# User Dashboard

The dashboard should display:

- Welcome Section
- User Profile
- Blood Group
- Notification Panel
- Active Emergency Requests
- Nearby Blood Banks
- Google Maps
- Emergency Request Button

### Acceptance Criteria

- Fully responsive.
- Real-time notification updates.
- Fast page loading.

---

# Emergency Blood Request

Users should be able to create an emergency request.

Required Fields

- Blood Group
- State
- District
- Hospital Name
- Exact Address
- Contact Number

### Expected Behaviour

- Store request in MongoDB.
- Notify all nearby users.
- Notify all blood banks.
- Display request in Admin Dashboard.
- Save request history.

---

# Blood Inventory

Admins should be able to:

- Add Blood Stock
- Update Blood Stock
- Delete Blood Stock
- View Current Inventory

Supported Blood Groups

- A+
- A-
- B+
- B-
- AB+
- AB-
- O+
- O-

### Acceptance Criteria

- Inventory updates instantly.
- Changes reflected for all users.
- Prevent negative stock values.

---

# Hospital Management

Admin can:

- Add Hospital
- Edit Hospital
- Delete Hospital
- View Hospital Details

---

# Google Maps

Features

- Detect Current User Location
- Display Nearby Blood Banks
- Display Nearby Hospitals
- Navigate using Google Maps
- Show Approved Blood Bank Location

### Acceptance Criteria

- Accurate location detection.
- Interactive map.
- Mobile friendly.

---

# Notifications

Notifications should trigger when:

- Emergency Request Created
- Emergency Request Approved
- Emergency Request Rejected
- Blood Inventory Updated

Delivery

- Real-Time using Socket.IO
- Future support for Push Notifications

---

# Security Requirements

- JWT Authentication
- bcrypt Password Hashing
- Input Validation
- Environment Variables
- Secure API Access

---

# Performance Requirements

- Mobile-first responsive UI
- Fast page loading
- Optimized API calls
- Scalable architecture
- Production-ready code

---

# Success Criteria

The project is considered complete when:

- User authentication works securely.
- Blood inventory is managed successfully.
- Emergency requests notify users and blood banks.
- Google Maps displays nearby blood banks.
- Notifications are delivered in real time.
- Admin approvals are reflected immediately.
- Application is responsive on desktop, tablet, and mobile.

## Scalability

The system should support multiple simultaneous users and emergency requests without affecting normal application functionality.

Heavy operations such as emergency matching and notification processing should be handled asynchronously where appropriate.

## Security

All important authorization decisions must be performed on the backend.