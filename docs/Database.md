# BloodLink Database Design

## Database

MongoDB Atlas

ODM: Mongoose

---

# Collections

1. Users
2. BloodInventory
3. EmergencyRequests
4. Notifications
5. Hospitals

---

# Users Collection

```json
{
  "_id": "ObjectId",

  "name": "John Doe",

  "email": "john@example.com",

  "password": "Encrypted Password",

  "phone": "9876543210",

  "bloodGroup": "O+",

  "role": "user",

  "isAvailableDonor": true,

  "location": {
    "state": "Karnataka",
    "district": "Mysore",
    "latitude": 12.305,
    "longitude": 76.655
  },

  "createdAt": "",
  "updatedAt": ""
}
```

Validation

- Email must be unique.
- Password must be hashed.
- Phone number must be unique.
- Blood group is required.

---

# BloodInventory Collection

```json
{
  "_id": "ObjectId",

  "bloodBankId": "ObjectId",

  "bloodBankName": "",

  "inventory": {
    "A+": 10,
    "A-": 5,
    "B+": 20,
    "B-": 4,
    "AB+": 2,
    "AB-": 1,
    "O+": 30,
    "O-": 8
  },

  "lastUpdated": "",

  "createdAt": "",
  "updatedAt": ""
}
```

---

# EmergencyRequests Collection

```json
{
  "_id": "ObjectId",

  "requestBy": "ObjectId",

  "bloodGroup": "O-",

  "unitsRequired": 2,

  "hospital": "Apollo Hospital",

  "state": "Karnataka",

  "district": "Mysore",

  "address": "Near Main Road",

  "contactNumber": "9876543210",

  "location": {
    "latitude": 12.305,
    "longitude": 76.655
  },

  "status": "Pending",

  "approvedBy": null,

  "createdAt": "",
  "updatedAt": ""
}
```

Status

- Pending
- Approved
- Rejected
- Completed

---

# Notifications Collection

```json
{
  "_id": "ObjectId",

  "receiverId": "ObjectId",

  "title": "Blood Required",

  "message": "O+ blood required at Apollo Hospital.",

  "type": "Emergency",

  "isRead": false,

  "createdAt": ""
}
```

Notification Types

- Emergency
- Approval
- Rejection
- Inventory
- System

---

# Hospitals Collection

```json
{
  "_id": "ObjectId",

  "hospitalName": "Apollo Hospital",

  "phone": "9876543210",

  "address": "Mysore",

  "location": {
    "latitude": 12.305,
    "longitude": 76.655
  },

  "createdAt": "",
  "updatedAt": ""
}
```

---

# Collection Relationships

Users

↓

EmergencyRequests

↓

Notifications

BloodInventory

↓

Hospital

EmergencyRequests

↓

Hospital

BloodInventory

↓

Blood Bank

---

# Indexes

Users

- email
- phone
- bloodGroup

EmergencyRequests

- bloodGroup
- district
- status

Notifications

- receiverId

Hospitals

- location

---

# Security

Passwords

- bcrypt hashing

Authentication

- JWT

Sensitive Fields

- Password
- Phone Number

Environment Variables

- MongoDB URI
- JWT Secret
- Google Maps API Key

---

# Database Conventions

- Use ObjectId references.
- Enable timestamps in all schemas.
- Validate all required fields.
- Never store plain text passwords.
- Never expose sensitive fields in API responses.
- Use Mongoose schema validation.
- Keep relationships normalized where practical.
