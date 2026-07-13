# PlacePilot Career & Placement Platform

PlacePilot is a premium, state-of-the-art university career and placement management portal built on the modern MERN stack. Designed with beautiful glassmorphic aesthetics, micro-animations, and responsive accessibility, the platform connects Students, Recruiter Companies, and Placement Officers under a unified real-time dashboard.

---

## 🚀 Key Features

### 1. 💼 Placement Drives & Eligibility
- **Dynamic Drive Listings**: Companies publish active hiring drives with CTC package, allowed departments, backlog limits, and CGPA thresholds.
- **Automated Eligibility Engine**: Calculates eligibility criteria in real-time, preventing students from applying if they fall below parameters.

### 2. ⚡ Real-Time Communications & Notifications
- **Socket.io Alerts**: System notifications pop up instantly on student, recruiter, or officer screens when status updates (e.g., Shortlisted, Offer Extended).
- **Automated Email Dispatcher**: Integrated with **Resend** (and server fallback) to deliver beautiful transactional emails for interview scheduling, forgot password flows, and application outcomes.

### 3. 🧠 Google Gemini AI Integration
- **AI Resume ATS Reviewer**: Students upload PDF resumes to get instant ATS scores, keyword injection recommendations, and grammar suggestions.
- **AI Resume ↔ JD Matching**: Recommends candidates to recruiters based on job description overlap. Includes hover tooltips detailing matching and missing skills.
- **AI Career Advisor**: Custom-tailored roadmap suggestions and industry recommendations based on profile completion.
- **AI Interview Prep**: Role-specific technical questions generated from resume content to practice core concepts.
- **AI Assistant Chatbot**: Collapsible chatbot widget present across panels, fully aware of user role and college guidelines.

### 4. 🎹 Global Navigation Command Palette
- Press `Ctrl + K` (or `Cmd + K`) anywhere inside the portal to toggle the interactive command center. Route dynamically to dashboard panels, features, or open the AI Chatbot using quick keystrokes.

---

## 🛠️ Technology Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Socket.io Client.
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.io, Resend (Email SDK), Google Generative AI (@google/generative-ai).

---

## 📦 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (running locally or a remote Atlas connection string)

### 2. Installation
Clone the repository and install dependencies in both subfolders:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

#### Server Configuration
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/placepilot
JWT_SECRET=super_secret_key_for_jsonwebtoken
FRONTEND_URL=http://localhost:5173

# AI & Email Integration Keys (Leave as mock_key or empty for offline fallback)
GEMINI_API_KEY=mock_key
RESEND_API_KEY=
```

#### Client Configuration
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Database Seeding
Populate the database with rich test records (27 Students, multiple companies, drives, applications, and activity history):
```bash
cd server
npx tsx src/seed.ts
```

### 5. Running the Application
You can start both servers concurrently using the workspace script:
```bash
# In the root directory, run:
powershell -File .\start.ps1
```
Or start them individually:
```bash
# Start backend (starts on http://localhost:5000)
cd server
npm run dev

# Start frontend (starts on http://localhost:5173)
cd client
npm run dev
```

---

## 🔑 Seed User Credentials

All seeded accounts share the default password: **`Password123`**

| Role | Email Address | Description |
| :--- | :--- | :--- |
| **System Admin** | `admin@placepilot.com` | Manages system settings, users, and audits. |
| **Placement Officer** | `officer@placepilot.com` | Publishes companies, coordinates drives, and views stats. |
| **Placement Officer 2** | `officer2@placepilot.com` | Secondary officer account. |
| **Recruiter (Google)** | `recruiter@placepilot.com` | Evaluates candidates, sets interview slots, and logs feedback. |
| **Recruiter (Stripe)** | `recruiter2@placepilot.com` | Stripe hiring drives manager. |
| **Recruiter (Microsoft)** | `recruiter3@placepilot.com` | Microsoft recruitment lead. |
| **Demo Student** | `student@placepilot.com` | 8.5 CGPA, Computer Science, AWS Certified. |
| **Other Students** | `student1@placepilot.com` to `student26@placepilot.com` | Varied departments, skills, and eligibility metrics. |

---

## 📄 Deployment Configuration

### Frontend (Vercel)
Create a `vercel.json` file in the `client` directory to route single-page app paths:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Backend (Render / Heroku)
When deploying the Express API, ensure the build command compiles TypeScript:
```bash
npm run build
```
And set the start command to:
```bash
npm start
```
Make sure to configure the corresponding environment variables in your deployment dashboard settings.
