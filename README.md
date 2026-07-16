# 🩸 BloodLink – Smart Blood Donor Finder

## 🚧 Project Status

**Status:** 🚀 Under Active Development

Current Phase: Documentation & Project Setup

---

## 📖 About

BloodLink is a secure, responsive, and real-time blood donation platform designed to connect patients, blood donors, blood banks, and hospitals during medical emergencies.

The platform aims to reduce the time required to locate blood by providing instant emergency notifications, nearby blood bank discovery using Google Maps, and real-time blood inventory management.

---

# 🚀 Features

## 🔐 Authentication

- User Registration
- Secure Login
- JWT Authentication
- Role-Based Access Control
- User & Admin Accounts

---

## 👤 User Features

- Dashboard
- Update Profile
- Register Blood Group
- Emergency Blood Request
- Live Notifications
- View Nearby Blood Banks
- Google Maps Navigation
- Blood Request History

---

## 🏥 Admin Features

- Admin Dashboard
- Blood Inventory Management
- Upload Blood Inventory
- Update Blood Stock
- Delete Blood Stock
- Hospital Management
- Approve Emergency Requests
- Reject Emergency Requests
- Receive Live Emergency Alerts

---

## ⚡ Real-Time Features

- Emergency Blood Alerts
- Live Notifications
- Inventory Updates
- Socket.IO Integration

---

# 🏗️ System Architecture

```
                    Users
                      │
                      ▼
            Next.js Frontend
                      │
               Axios REST API
                      │
                      ▼
           Node.js + Express.js
              │             │
              ▼             ▼
      MongoDB Atlas     Socket.IO
              │
              ▼
     Google Maps API
```

---

# 📚 Documentation

Complete project documentation is available in the **docs** folder.

- [ORD – Overall Requirements](docs/ORD.md)
- [PRD – Product Requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Design](docs/DATABASE.md)
- [API Documentation](docs/API.md)
- [AI Agent Instructions](docs/AGENT.md)
- [Development Tasks](docs/TASKS.md)
- [Technology Stack](docs/TECH_STACK.md)

---

# 🛠️ Technology Stack

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

- JWT
- bcrypt

## Maps

- Google Maps JavaScript API
- Google Places API

## Notifications

- Socket.IO
- Firebase Cloud Messaging (Future Enhancement)

## Deployment

- Vercel (Frontend)
- Render (Backend)
- MongoDB Atlas (Database)

## Version Control

- Git
- GitHub

---

# 📂 Project Structure

```
BloodLink/

├── client/
│
├── server/
│
├── docs/
│   ├── ORD.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── AGENT.md
│   ├── TASKS.md
│   └── TECH_STACK.md
│
├── README.md
└── .gitignore
```

---

# 🔒 Security

- JWT Authentication
- bcrypt Password Hashing
- Protected Routes
- Environment Variables
- Request Validation
- Secure REST APIs

---

# ⚙️ Getting Started

## Clone Repository

```bash
git clone https://github.com/Kartik01032005/Major-Project.git
```

---

## Install Frontend

```bash
cd client
npm install
```

---

## Install Backend

```bash
cd ../server
npm install
```

---

# 🔐 Environment Variables

Create:

```
client/.env.local
server/.env
```

Example:

```
MONGODB_URI=
JWT_SECRET=
GOOGLE_MAPS_API_KEY=
PORT=5000
```

---

# ▶️ Run the Project

Frontend

```bash
npm run dev
```

Backend

```bash
npm run dev
```

---

# 🌍 Deployment

Frontend

- Vercel

Backend

- Render

Database

- MongoDB Atlas

---

# 🔄 Development Workflow

1. Read all files inside the `docs` folder.
2. Follow `AGENT.md` instructions.
3. Implement one feature at a time.
4. Update `TASKS.md`.
5. Commit changes.
6. Push to GitHub.

---

# 🤖 AI Agent Instructions

Before generating code, always read:

- README.md
- docs/ORD.md
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/API.md
- docs/AGENT.md
- docs/TASKS.md
- docs/TECH_STACK.md

Implement only one feature at a time.

Never skip documentation.

Always keep the project production-ready.

---

# 🚀 Future Enhancements

- AI-Based Blood Demand Prediction
- SMS Notifications
- Email Notifications
- Progressive Web App (PWA)
- Mobile Application
- Docker Support
- Kubernetes Deployment
- Multi-Language Support

---

# 📄 License

This project is developed for educational and academic purposes.

---

# 👨‍💻 Author

**Kartik Nilekani**

Computer Science & Business Systems (CSBS)

Major Project – BloodLink