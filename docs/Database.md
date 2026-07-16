# Database Design

## User

```json
{
  "_id":"",
  "name":"",
  "email":"",
  "password":"",
  "phone":"",
  "bloodGroup":"",
  "role":"user",
  "location":{
      "state":"",
      "district":"",
      "lat":0,
      "lng":0
  },
  "createdAt":""
}
```

---

## Blood Inventory

```json
{
  "_id":"",
  "bloodBankId":"",
  "A+":20,
  "A-":5,
  "B+":10,
  "B-":4,
  "AB+":3,
  "AB-":1,
  "O+":12,
  "O-":8
}
```

---

## Emergency Request

```json
{
  "_id":"",
  "userId":"",
  "bloodGroup":"",
  "hospital":"",
  "state":"",
  "district":"",
  "location":{
      "lat":0,
      "lng":0
  },
  "phone":"",
  "status":"Pending"
}
```

---

## Notification

```json
{
 "_id":"",
 "title":"",
 "message":"",
 "receiverId":"",
 "isRead":false
}
```

---

## Hospital

```json
{
 "_id":"",
 "hospitalName":"",
 "address":"",
 "phone":"",
 "location":{
    "lat":0,
    "lng":0
 }
}
```