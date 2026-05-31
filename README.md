# 🚀 Trio.ai Backend

## Overview

The Trio.ai Backend is a secure and scalable REST API that powers the AI Travel Planner application.

It handles:

* User Authentication
* Authorization
* Trip Management
* AI Itinerary Generation
* Budget Estimation
* Hotel Recommendations
* Companion Invitations
* Database Persistence

The backend integrates with Google Gemini to generate structured travel itineraries and stores all user data securely in MongoDB Atlas.

---

## Tech Stack

### Runtime

* Node.js
* Express.js
* TypeScript

### Database

* MongoDB Atlas
* Mongoose ODM

### Authentication

* JWT (JSON Web Tokens)
* bcryptjs

### AI Integration

* Google Gemini API

### Email Services

* Nodemailer

---

## Local Setup

### Prerequisites

* Node.js 18+
* MongoDB Atlas Account
* Gemini API Key

### Installation

```bash
git clone <backend-repository-url>
cd trio-backend
npm install
```

### Environment Variables

Create a `.env` file:

```env
PORT=3000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

FRONTEND_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email
SMTP_PASS=your_app_password
```

### Run Development Server

```bash
npm run dev
```

Server runs at:

```text
http://localhost:3000
```

---

## Production Deployment

Backend is deployed on Render.

Required Environment Variables:

```env
PORT
MONGODB_URI
JWT_SECRET
GEMINI_API_KEY
FRONTEND_URL
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
```

---

## High-Level Architecture

```text
Client (React)
        │
        ▼
Express API
        │
 ┌──────┼────────┐
 ▼      ▼        ▼

Auth   Trips   AI Service
 │       │         │
 ▼       ▼         ▼

MongoDB Gemini API Email Service
```

### Layers

#### Routes

Responsible for API endpoints.

#### Controllers

Handle incoming requests and responses.

#### Services

Business logic and AI integration.

#### Middleware

Authentication and authorization enforcement.

#### Models

MongoDB schemas and database operations.

---

## Authentication & Authorization

### Registration

Passwords are hashed using bcrypt before storage.

### Login

Users receive a signed JWT token upon successful authentication.

### Protected Routes

Authentication middleware validates tokens and extracts user identity.

### Data Isolation

Every trip is associated with its owner.

Users can:

* Access their own trips
* Modify their own trips

Users cannot:

* Access other users' data
* Modify other users' itineraries

---

## AI Agent Design

### Purpose

Act as a virtual travel planner capable of generating:

* Day-wise itineraries
* Budget estimates
* Hotel recommendations
* Travel tips

### Implementation

Google Gemini receives structured prompts containing:

* Destination
* Budget
* Interests
* Number of days

The model returns structured JSON data rather than free-form text.

### Benefits

* Predictable responses
* Easier frontend rendering
* Better reliability
* Reduced parsing complexity

---

## Creative Features

### AI Day Regeneration

Regenerate a single day while preserving the rest of the itinerary.

### Companion Invite System

Invite travel partners through email.

### Smart Hotel Recommendations

Hotels categorized by budget level.

### Budget Breakdown Engine

Provides estimated spending for:

* Flights
* Accommodation
* Food
* Activities
* Transportation

---

## Key Design Decisions

### MongoDB

Chosen because itinerary structures are dynamic and map naturally to JSON documents.

### Gemini Flash

Selected for faster response times and lower latency.

### JWT Authentication

Stateless and scalable authentication solution.

### Layered Architecture

Improves maintainability, testing, and scalability.

---

## Known Limitations

* AI responses may occasionally contain outdated information.
* Hotel recommendations are AI-generated and not real-time booking results.
* Budget estimates are approximate.
* Free-tier hosting platforms may introduce startup delays.

---

## API Health Check

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

---

