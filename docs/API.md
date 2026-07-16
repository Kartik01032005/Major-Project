# Authentication

POST /api/auth/register

POST /api/auth/login

GET /api/auth/me

---

# User

GET /api/users/profile

PUT /api/users/profile

GET /api/users/notifications

---

# Emergency

POST /api/emergency

GET /api/emergency

GET /api/emergency/:id

PUT /api/emergency/:id/approve

PUT /api/emergency/:id/reject

DELETE /api/emergency/:id

---

# Inventory

GET /api/inventory

POST /api/inventory

PUT /api/inventory/:id

DELETE /api/inventory/:id

---

# Hospitals

GET /api/hospitals

POST /api/hospitals

PUT /api/hospitals/:id

DELETE /api/hospitals/:id

---

# Maps

GET /api/maps/nearby

---

# Notifications

GET /api/notifications

PUT /api/notifications/read
