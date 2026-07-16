# 🩸 BloodLink – Smart Blood Donor Finder

BloodLink is a secure, responsive, and real-time blood donation platform that connects patients, blood donors, blood banks, and hospitals during medical emergencies.

The platform aims to reduce the time required to locate blood by providing instant emergency notifications, nearby blood bank discovery using Google Maps, and real-time blood inventory management.

---

# 🚀 Features

## Authentication

- Secure User Registration
- JWT Authentication
- Login & Logout
- Role-Based Access Control
- Admin & User Accounts

---

## User Features

- User Dashboard
- Update Profile
- Register Blood Group
- Emergency Blood Request
- Live Notifications
- View Nearby Blood Banks
- Google Maps Navigation
- Blood Request History

---

## Admin Features

- Admin Dashboard
- Blood Inventory Management
- Upload Blood Inventory
- Update Blood Stock
- Hospital Management
- Approve Emergency Requests
- Reject Emergency Requests
- Real-Time Emergency Notifications

---

## Real-Time Features

- Emergency Blood Alerts
- Live Inventory Updates
- Socket.IO Notifications
- Google Maps Integration

---

# 📚 Documentation

Project documentation is available inside the **docs** folder.

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
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── context/
│   ├── services/
│   ├── utils/
│   ├── types/
│   └── public/
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   ├── socket/
│   ├── config/
│   └── utils/
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

# ⚙️ Getting Started

## Clone the Repository

```bash
git clone https://github.com/Kartik01032005/Major-Project.git
```

## Install Frontend

```bash
cd client
npm install
```

## Install Backend

```bash
cd ../server
npm install
```

---

# 🔐 Environment Variables

Create the following files:

```
client/.env.local
server/.env
```

Example server environment variables:

```
MONGODB_URI=
JWT_SECRET=
GOOGLE_MAPS_API_KEY=
PORT=5000
```

---

# ▶️ Running the Project

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