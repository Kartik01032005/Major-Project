# BloodLink API Documentation

Base URL

```
/api
```

All APIs return JSON responses.

Authentication is performed using JWT Bearer Tokens.

---

# Authentication

## Register User

POST /api/auth/register

Description

Register a new user or admin.

Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "bloodGroup": "O+",
  "role": "user"
}
```

Response

```json
{
  "success": true,
  "message": "Registration successful"
}
```

---

## Login

POST /api/auth/login

Request

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Response

```json
{
  "token": "JWT_TOKEN",
  "user": {}
}
```

---

## Get Logged-in User

GET /api/auth/me

Authorization Required

Bearer Token

---

# User APIs

## Get Profile

GET /api/users/profile

Authorization Required

Bearer Token

---

## Update Profile

PUT /api/users/profile

Authorization Required

Bearer Token

Fields

- Name
- Phone
- Blood Group
- Location

---

## Get Notifications

GET /api/users/notifications

Authorization Required

Bearer Token

---

# Emergency Request APIs

## Create Emergency Request

POST /api/emergency

Request

```json
{
  "bloodGroup": "A+",
  "hospital": "City Hospital",
  "state": "Karnataka",
  "district": "Mysore",
  "address": "Near Main Road",
  "latitude": 12.305,
  "longitude": 76.655,
  "contactNumber": "9876543210"
}
```

After creation

- Notify nearby donors
- Notify blood banks
- Save request

---

## Get All Emergency Requests

GET /api/emergency

Returns

All active requests.

---

## Get Single Emergency Request

GET /api/emergency/:id

---

## Approve Emergency Request

PUT /api/emergency/:id/approve

Admin Only

---

## Reject Emergency Request

PUT /api/emergency/:id/reject

Admin Only

---

## Delete Emergency Request

DELETE /api/emergency/:id

Owner or Admin

---

# Blood Inventory APIs

## Get Inventory

GET /api/inventory

Returns

Blood stock of every blood group.

---

## Create Inventory

POST /api/inventory

Admin Only

---

## Update Inventory

PUT /api/inventory/:id

Admin Only

---

## Delete Inventory

DELETE /api/inventory/:id

Admin Only

---

# Hospital APIs

## Get Hospitals

GET /api/hospitals

Returns

Nearby hospitals.

---

## Add Hospital

POST /api/hospitals

Admin Only

---

## Update Hospital

PUT /api/hospitals/:id

Admin Only

---

## Delete Hospital

DELETE /api/hospitals/:id

Admin Only

---

# Google Maps APIs

## Nearby Blood Banks

GET /api/maps/nearby

Query Parameters

- latitude
- longitude
- radius

Returns

Nearby blood banks with distance.

---

# Notification APIs

## Get Notifications

GET /api/notifications

Authorization Required

Bearer Token

---

## Mark Notification as Read

PUT /api/notifications/read/:id

Authorization Required

Bearer Token

---

# Response Format

Success

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

---

# HTTP Status Codes

200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

500 Internal Server Error

## Mobile API Support

All existing REST APIs are designed to support both the web and mobile applications.

```text
Next.js Web ────────┐
                    │
                    ▼
              Express API
                    │
                    ▼
              MongoDB Atlas
                    ▲
                    │
React Native Mobile ┘