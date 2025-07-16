# Bitespeed Backend Task: Identity Reconciliation

##  Live Demo
**Endpoint:** https://bitespeed-backend-task-submission-wlbl.onrender.com

⚠️ **Note:** The service is hosted on a free tier and may take 30-60 seconds to wake up from sleep mode on first request.

## 🧪 Testing the API

You can test the API using curl, Postman, or any HTTP client:

```bash
# Health check
curl https://bitespeed-backend-task-submission-wlbl.onrender.com/health

# Identity reconciliation
curl -X POST https://bitespeed-backend-task-submission-wlbl.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'
```

📄 **Note:** A `contact.json` file is also available in the repository containing sample response formats for all test cases.

## 🛠️ Solution Overview

This web service provides an `/identify` endpoint that:
- Links customer contacts based on shared email or phone numbers
- Maintains a primary-secondary relationship between contacts
- Consolidates customer information for personalized experiences
- Handles complex scenarios like merging separate primary contacts

## 📊 Database Schema

```prisma
model Contact {
  id                   Int @id @default(autoincrement())            
  phoneNumber          String?
  email                String?
  linkedId             Int? // ID of another Contact linked to this one
  linkPrecedence       linkPrecedence @default(primary) // "primary" or "secondary"
  createdAt            DateTime @default(now())              
  updatedAt            DateTime @updatedAt     
  deletedAt            DateTime?

  linkedTo       Contact? @relation("ContactLink", fields: [linkedId], references: [id])
  linkedFrom     Contact[] @relation("ContactLink")

  @@index([email])
  @@index([phoneNumber])
  @@index([linkedId])
}

enum linkPrecedence {
  primary
  secondary
}
```

## 🔧 Tech Stack

- **Backend:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Hosting:** Render.com

## 🚀 API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{
  "msg": "server is running"
}
```

### Identity Reconciliation
```
POST /identify
```

**Request Body:**
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": "number",
    "emails": ["string[]"],
    "phoneNumbers": ["string[]"],
    "secondaryContactIds": ["number[]"]
  }
}
```

## 📝 Test Cases

> 📄 **Reference:** Complete response examples are available in the `contact.json` file in the repository.

### Test Case 1: New Customer
**Request:**
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

### Test Case 2: Adding Secondary Contact
**Existing Data:** Contact with id=1, email="lorraine@hillvalley.edu", phoneNumber="123456"

**Request:**
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

### Test Case 3: Merging Primary Contacts
**Existing Data:** 
- Contact id=11: email="george@hillvalley.edu", phoneNumber="919191", linkPrecedence="primary"
- Contact id=27: email="biffsucks@hillvalley.edu", phoneNumber="717171", linkPrecedence="primary"

**Request:**
```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "717171"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 11,
    "emails": ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
    "phoneNumbers": ["919191", "717171"],
    "secondaryContactIds": [27]
  }
}
```

### Test Case 4: Retrieve by Email Only
**Request:**
```json
{
  "email": "lorraine@hillvalley.edu"
}
```

### Test Case 5: Retrieve by Phone Only
**Request:**
```json
{
  "phoneNumber": "123456"
}
```

### Test Case 6: Invalid Request
**Request:**
```json
{}
```

**Response:**
```json
{
  "msg": "Please send email or phone number"
}
```

## 🔄 Business Logic

1. **New Customer:** If no matching contacts exist, create a new primary contact
2. **Existing Customer:** If contacts exist, find the primary contact and return consolidated information
3. **New Information:** If new email/phone is provided, create a secondary contact
4. **Primary Conflict:** If multiple primary contacts exist, merge them by making the oldest one primary and others secondary
5. **Data Integrity:** Ensure all contacts are properly linked to maintain referential integrity

## 🏃‍♂️ Running Locally

1. **Clone the repository:**
```bash
git clone https://github.com/ayushKhandelwal07/BiteSpeed_Backend_Task_Submission.git
cd BiteSpeed_Backend_Task_Submission
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp env.example .env
# Add your DATABASE_URL to .env file
```

4. **Run database migrations:**
```bash
npx prisma migrate dev
```

5. **Generate Prisma client:**
```bash
npx prisma generate
```

6. **Start the server:**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
├── src/
│   ├── index.ts              # Main application file
│   └── generated/
│       └── prisma/           # Generated Prisma client
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Database migrations
├── contact.json              # Sample API response examples
├── package.json
├── tsconfig.json
└── README.md
```


## Database Optimizations

- Indexed fields: `email`, `phoneNumber`, `linkedId`
- Efficient queries using Prisma ORM
- Proper relationship handling between primary and secondary contacts
- Optimized for read-heavy workloads

## Deployment

The application is deployed on Render.com with:
- Automatic deployments from GitHub
- PostgreSQL database
- Environment variable management
- Health check monitoring


**Ayush Khandelwal**
- GitHub: [@ayushKhandelwal07](https://github.com/ayushKhandelwal07)
- Repository: [BiteSpeed_Backend_Task_Submission](https://github.com/ayushKhandelwal07/BiteSpeed_Backend_Task_Submission)

## This project is created as part of the Bitespeed Backend Task assignment.
