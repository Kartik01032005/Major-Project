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

# Nearby Facilities APIs
 
## Nearby Hospitals & Blood Banks
 
GET /api/nearby
 
Query Parameters:
 
- lat (number, required)
- lng (number, required)
- radius (number, optional, default: 5 km)
- type (string, optional: "all" | "hospitals" | "bloodbanks")
- bloodGroup (string, optional)
- openNow (boolean, optional)
- search (string, optional)
 
Response Headers:
 
- `X-Cache`: `HIT` | `MISS` (indicates whether public OSM data was served from the in-memory cache)
 
Returns:
 
Merged list of nearby hospitals and blood banks (combining real OpenStreetMap data and BloodLink registered institutions) sorted by distance. Public OSM search queries are cached in memory (5-minute TTL, LRU eviction, and request deduplication).
 
---

---

# Notification APIs

## Get Notifications

GET /api/notifications

Query Parameters:
- page (number, optional, default: 1)
- limit (number, optional, default: 20)

Authorization Required

Bearer Token

---

## Mark Notification as Read

PUT /api/notifications/read/:id

Authorization Required

Bearer Token

---

## Mark All Notifications as Read

PUT /api/notifications/read-all

Authorization Required

Bearer Token

---

## Delete Notification

DELETE /api/notifications/:id

Authorization Required

Bearer Token

---

# Donor Certificate APIs

## Submit Donor Certificate

POST /api/certificates

Content-Type: `multipart/form-data`

Body Fields:
- `certificateFile` (File, required, max 5MB, PDF/JPEG/PNG)
- `issuingHospital` (string, required)
- `hospitalId` (string, optional - MongoDB ObjectId if registered hospital selected)
- `donationDate` (date string, required)
- `certificateNumber` (string, optional)
- `notes` (string, optional)

Authorization Required: `USER`

---

## Get My Certificate

GET /api/certificates/my-certificate

Returns current user's submitted certificate, review history, and eligibility summary.

Authorization Required: `USER`

---

## Download/Stream Private Certificate File

GET /api/certificates/my-certificate/file
GET /api/certificates/:id/file

Streams the private certificate file securely without exposing file system paths. Only authorized submitters, assigned hospitals, or reviewing blood banks can access the file.

Authorization Required: `USER` (own file), `HOSPITAL` (assigned), `BLOOD_BANK` (assigned/unassigned queue)

---

## Check Donor Eligibility

GET /api/certificates/eligibility

Returns eligibility status (`isEligible`, `reason`, `certificateStatus`) required to accept emergency blood donation requests.

Authorization Required: `USER`

---

## Hospital Verification Queue

GET /api/certificates/hospital-queue

Returns pending submissions assigned to the authenticated hospital.

Authorization Required: `HOSPITAL`

---

## Blood Bank Verification Queue

GET /api/certificates/blood-bank-queue

Returns pending submissions for unregistered/unassigned hospitals routed to blood bank verification.

Authorization Required: `BLOOD_BANK`

---

## Log Contact Attempt

POST /api/certificates/:id/contact-attempt

Body:
```json
{
  "notes": "Spoke with hospital desk, verified demo donation record",
  "method": "PHONE"
}
```

Authorization Required: `HOSPITAL`, `BLOOD_BANK`

---

## Review Certificate

PUT /api/certificates/:id/review

Body:
```json
{
  "action": "APPROVED", // "APPROVED" | "REJECTED" | "CLARIFICATION_REQUESTED"
  "reason": "Verified record matches demo hospital records",
  "notes": "Verified successfully"
}
```

Authorization Required: `HOSPITAL`, `BLOOD_BANK`

---

# Audit Log APIs

## Get Audit Logs

GET /api/audit-logs

Query Parameters:
- action (string, optional)
- entityType (string, optional)
- entityId (string, optional)
- page (number, optional, default: 1)
- limit (number, optional, default: 20)

Returns immutable, sanitized audit records filtered to the authenticated caller's authorization boundary (users see their own actions; institutions see operations relating to assigned entities). Sensitive credentials, passwords, and file contents are never stored or returned.

Authorization Required: `USER`, `HOSPITAL`, `BLOOD_BANK`

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
