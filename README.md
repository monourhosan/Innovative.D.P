# Innovative Data Platform (Admin Website & Backend API)

> **Creator & Author:** Made by Saif  
> **Deployment Target:** [Wasmer.io](https://wasmer.io/) (Edge Container + SQLite Volume)  
> **Architecture:** Node.js (Express.js) + SQLite + Server-Sent Events (SSE) + SheetJS (.xlsx) + Zero-Dependency SPA Frontend

---

## 🌟 Overview

**Innovative Data Platform** is a fast, lightweight, and ultra-intuitive data collection platform inspired by KoboToolbox and XLSForm. Created by **Saif**, it provides:

1. **Admin Web Portal:** 
   - Zero-training UI designed for zero-learning-curve operation.
   - Upload standard KoboToolbox `.xlsx` forms or simple spreadsheets to auto-generate dynamic data collection projects with visual preview.
   - Manage Supervisors and automatically generate copy-pasteable credentials formatted for WhatsApp/SMS/Email.
   - Monitor live incoming field data in real-time with Server-Sent Events (SSE) and audio chime notifications.
   - One-click `.xlsx` data export containing all dynamic form questions and complete audit metadata.
   - Built-in **Mobile App Simulator** so you can collect and submit test data right inside your desktop browser!

2. **Central REST API Backend for Android Applications:**
   - Secure JWT token authentication for Supervisors and Team Members.
   - Dynamic form schema delivery (`/api/v1/member/projects`).
   - Single and offline batch data sync (`/api/v1/member/submissions`).
   - Real-time SSE push pipeline (`/api/v1/live/stream`).

---

## 🚀 Quickstart (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Sample Environment
Pre-populates sample project, supervisor, team members, and submissions:
```bash
npm run seed
```

### 3. Start the Server
```bash
npm start
```
The server will start at **http://localhost:3000** (or your configured `PORT`).

### 4. Default Login Credentials
- **Admin Portal:**
  - **URL:** [http://localhost:3000/login.html](http://localhost:3000/login.html)
  - **User ID:** `admin`
  - **Password:** `admin123`
- **Sample Supervisor:**
  - **User ID:** `SUP-1042`
  - **Password:** `supervisor123`
- **Sample Team Member:**
  - **User ID:** `TM-2001`
  - **Password:** `member123`

---

## 📋 The 4-Step Zero-Training Workflow

1. **Step 1: Upload Excel (.xlsx) to Start Project**
   - Click `1. Excel Projects` in the sidebar or drag-and-drop your `.xlsx` file.
   - The platform supports both:
     - **Standard KoboToolbox / XLSForm Mode:** (`survey` & `choices` sheets with `type`, `name`, `label`, `required`).
     - **Simple Table Mode (Easy Fallback):** Row 1 contains column headers (e.g. `Full Name`, `Age`, `Location`, `Phone`).
   - Preview generated questions visually, adjust title, and click **Publish Project**.
   - Don't have a form ready? Download pre-made templates directly from the portal!

2. **Step 2: Add Supervisor & Get Login ID**
   - Click `2. Supervisors` and select **Add Supervisor**.
   - User ID (e.g., `SUP-1042`) and password can be auto-generated with one click.
   - Click **Copy Credentials** to generate a friendly message ready to paste directly into WhatsApp, SMS, or Email.

3. **Step 3: Watch Live Data Dashboard**
   - Stream incoming field submissions in real time without refreshing the page!
   - View Supervisor performance breakdown with progress indicators.

4. **Step 4: Download Collected Data (.xlsx)**
   - Click `4. Data & Export (.xlsx)` to view submitted records.
   - Filter by Project, Supervisor, or Date Range.
   - Click **Download Collected Data (.xlsx)** to generate clean, styled spreadsheets containing all dynamic answers and submission metadata.

---

## ⚡ REST API Endpoints (Android App Contract)

Base URL: `/api/v1`

| Method | Endpoint | Role Allowed | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | All | Authenticates `user_id` & `password`. Returns JWT token, user profile, `role`, and `supervisor_id`. |
| `GET` | `/api/v1/supervisor/dashboard` | `SUPERVISOR` | Returns live stats: total team members, total submissions, and per-member breakdown. |
| `GET` | `/api/v1/supervisor/team-members` | `SUPERVISOR` | Lists all Team Members created by the logged-in Supervisor. |
| `POST` | `/api/v1/supervisor/team-members` | `SUPERVISOR` | Creates a new Team Member with `full_name`, `user_id`, and `password`. |
| `GET` | `/api/v1/member/projects` | `TEAM_MEMBER` | Returns active projects and `form_schema_json` for dynamic Android rendering. |
| `POST` | `/api/v1/member/submissions` | `TEAM_MEMBER` | Submits collected form data (single or offline batch sync array). |
| `GET` | `/api/v1/member/dashboard` | `TEAM_MEMBER` | Returns personal live stats (today's count, total count, recent submissions). |
| `GET` | `/api/v1/live/stream` | All | Server-Sent Events (SSE) live feed stream. |
| `GET` | `/api/v1/export/submissions.xlsx`| `ADMIN`, `SUPERVISOR` | Downloads project submissions as an `.xlsx` file. |

---

## ☁️ Deployment on Wasmer.io

Deploy seamlessly to [Wasmer.io](https://wasmer.io/) using the included `wasmer.toml` and `Dockerfile`:

```bash
# 1. Log in to Wasmer CLI
wasmer login

# 2. Deploy container and persistent database volume
wasmer deploy
```

Detailed step-by-step instructions can be found in [README_WASMER_DEPLOY.md](file:///d:/project/irc_data/README_WASMER_DEPLOY.md).

---

## 👤 Branding & Author Attribution

- **Application Title:** Innovative Data Platform
- **Creator:** Made by Saif
- **License:** MIT
