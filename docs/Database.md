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
6. DonorCertificates
7. AuditLogs

---

# DonorCertificates Collection

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: User)",
  "issuingHospital": "City General Hospital",
  "hospitalId": "ObjectId (ref: Hospital, optional)",
  "certificateNumber": "CERT-2026-001",
  "donationDate": "2026-09-15T00:00:00.000Z",
  "certificateFileUrl": "uploads/certificates/abc-uuid.pdf",
  "originalFileName": "donor_certificate.pdf",
  "fileMimeType": "application/pdf",
  "fileSize": 145020,
  "status": "PENDING", // "PENDING" | "APPROVED" | "REJECTED" | "CLARIFICATION_REQUESTED"
  "notes": "Annual voluntary donation",
  "reviewedBy": "ObjectId (ref: User, optional)",
  "reviewedAt": "2026-10-16T12:00:00.000Z",
  "rejectionReason": null,
  "clarificationNotes": null,
  "assignedToRole": "HOSPITAL", // "HOSPITAL" | "BLOOD_BANK"
  "history": [
    {
      "action": "SUBMITTED",
      "status": "PENDING",
      "performedBy": "ObjectId",
      "timestamp": "2026-10-15T10:00:00.000Z",
      "notes": "Certificate submitted by donor"
    }
  ],
  "contactAttempts": [
    {
      "attemptedBy": "ObjectId",
      "attemptedAt": "2026-10-16T11:00:00.000Z",
      "notes": "Contacted hospital records desk",
      "method": "PHONE"
    }
  ],
  "createdAt": "2026-10-15T10:00:00.000Z",
  "updatedAt": "2026-10-16T12:00:00.000Z"
}
```

Validation & Rules:
- `userId` must be unique (one active certificate per user).
- `status` defaults to `PENDING`.
- File access is strictly restricted to the user who uploaded it and assigned hospital/blood bank accounts.
- Direct downloads are not accessible via public static URLs; files are streamed via authenticated endpoints.

---

# AuditLogs Collection

```json
{
  "_id": "ObjectId",
  "action": "CERTIFICATE_APPROVED",
  "entityType": "DonorCertificate",
  "entityId": "ObjectId",
  "performedBy": "ObjectId (ref: User)",
  "role": "HOSPITAL",
  "ownerId": "ObjectId (ref: User, optional)",
  "assignedInstitutionId": "ObjectId (optional)",
  "details": {
    "action": "APPROVED",
    "reason": "Verified record"
  },
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0 ...",
  "timestamp": "2026-10-16T12:00:00.000Z",
  "createdAt": "2026-10-16T12:00:00.000Z",
  "updatedAt": "2026-10-16T12:00:00.000Z"
}
```

Audit Rules:
- Audit records are immutable (append-only).
- Passwords, authorization tokens, secrets, and raw file buffers are sanitized before persistence.
- Users query only audit records where they are the performer or resource owner.

---

# Notifications Collection

```json
{
  "_id": "ObjectId",
  "receiverId": "ObjectId",
  "title": "Certificate Approved",
  "message": "Your donor certificate has been verified.",
  "type": "Approval",
  "link": "/dashboard/certificate",
  "isRead": false,
  "createdAt": ""
}
```

Notification Types:
- Emergency
- Approval
- Rejection
- Clarification
- Inventory
- System

---

# Collection Relationships

Users
↓
DonorCertificates (1 : 1 active)
↓
Hospital / BloodBank (Review & Verification)

Users
↓
EmergencyRequests
↓
Notifications

EmergencyRequests
↓
Donor Eligibility (Certificate status must be APPROVED)

AuditLogs
(Captures user & institution lifecycle events: CERTIFICATE_SUBMITTED, CERTIFICATE_APPROVED, REQUEST_ACCEPTED, etc.)

---

# Indexes

Users
- email (unique)
- phone (unique)
- bloodGroup

DonorCertificates
- userId (unique)
- status
- hospitalId
- assignedToRole

AuditLogs
- performedBy + timestamp
- ownerId + timestamp
- entityType + entityId

EmergencyRequests
- bloodGroup
- district
- status

Notifications
- receiverId + createdAt

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
