# Innovative Data Platform

> **Creator & Author:** Made by Saif for Innovative Research & Consultancy Ltd.  
> **Deployment Target:** [Wasmer.io](https://wasmer.io/) (Edge Container + Persistent SQLite Volume)  
> **Repository:** [https://github.com/monourhosan/Innovative.D.P](https://github.com/monourhosan/Innovative.D.P)  
> **Architecture:** Node.js (Express.js) + SQLite + Server-Sent Events (SSE) + SheetJS (.xlsx) + Zero-Dependency SPA Web Portal + Flutter Unified Android Companion App (`com.saif.innovativedata`)

---

## 🌟 Overview

The **Innovative Data Platform** is a complete, high-performance field data collection ecosystem inspired by KoboToolbox and ODK Collect. Created by **Saif**, it provides:

1. **Admin Web Portal & Central Backend API:**
   * **Zero-Training Web Interface:** Built with zero client framework dependencies (pure HTML5/CSS3/Vanilla JS) for maximum speed and simplicity.
   * **Dual-Mode Excel Form Processing:** Upload either standard KoboToolbox / XLSForm spreadsheets (`survey` + `choices` sheets) or Simple Table spreadsheets (Row 1 headers).
   * **Instant Visual Form Preview:** Test questions and choices visually before publishing.
   * **Supervisor Management with 1-Tap Credential Sharing:** Auto-generate credentials formatted for direct copy-pasting into WhatsApp, SMS, or Email.
   * **Real-Time Live Monitoring Dashboard:** Submissions stream in via Server-Sent Events (SSE) with audio alerts and live supervisor performance counters.
   * **One-Click .xlsx Data Export:** Generates clean, styled Excel workbooks containing all collected answers and complete audit metadata.
   * **Built-in Mobile Simulator:** Test form collection directly inside your desktop browser.

2. **Unified Android Companion Application (`InnovativeDataPlatform-Android`):**
   * **Single Unified APK (`com.saif.innovativedata`):** Both Supervisors and Team Members install the exact same mobile application.
   * **Automatic Role Detection:** Automatically detects whether the user is a `SUPERVISOR` or `TEAM_MEMBER` upon login and opens the appropriate workspace.
   * **Configurable Cloud Server URL:** Easily change the backend server URL (e.g. your Wasmer.io URL) via the in-app gear settings, with a live `/health` connection tester.
   * **KoboToolbox-Style Dynamic Form Renderer:** Renders text, numbers, single-choice cards (`select_one`), multiple-choice cards (`select_multiple`), date pickers, notes, and GPS location coordinate capture.
   * **Offline-First Storage & Auto-Sync Queue:** Collect surveys completely offline in remote areas; surveys sync automatically once an Internet connection is restored.
   * **Supervisor Live Team Monitor:** Supervisors track enumerator counts in real time (with 5-second polling) and add new team members with 1-tap WhatsApp credential sharing.

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  CLOUDFLARE / WASMER.IO                           |
|                      https://innovative-data-platform.wasmer.app                  |
+-----------------------------------------------------------------------------------+
                                          |
                                    HTTPS | (Port 8080 / 3000)
                                          v
+-----------------------------------------------------------------------------------+
|               INNOVATIVE DATA PLATFORM — CENTRAL BACKEND API (Node.js)             |
|                                                                                   |
|   +-----------------------+   +-----------------------+   +-------------------+   |
|   |   Express.js Router   |   |   SSE Live Manager    |   |  XLSX Engine      |   |
|   |  - Auth (/auth/*)     |   |  - Real-time updates  |   |  - Form Parser    |   |
|   |  - Admin (/admin/*)   |   |  - Web browser push   |   |  - Data Exporter  |   |
|   |  - Mobile (/member/*) |   |  - Audio chime events |   |  - Sample Maker   |   |
|   +-----------------------+   +-----------------------+   +-------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |        Local Embedded SQLite Database Engine (node:sqlite with WAL)       |   |
|   |        Stored in Wasmer Persistent Volume: /app/data/platform.db          |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
                       ^                                     ^
                       | (Browser HTTPS)                     | (REST API + JWT)
                       |                                     |
+----------------------------------+        +-----------------------------------+
|      ADMIN WEB PORTAL (SPA)      |        |   UNIFIED ANDROID MOBILE APP      |
|  - Excel Project Upload & Preview|        |   (Flutter Single APK)            |
|  - Supervisor Credential Sharing |        |   Package: com.saif.innovativedata|
|  - Live SSE Monitoring Dashboard |        |   - Role: SUPERVISOR Monitor      |
|  - 1-Click .xlsx Data Export     |        |   - Role: TEAM_MEMBER Collector   |
|  - In-Browser Mobile Simulator   |        |   - Offline Queue & Auto-Sync     |
+----------------------------------+        +-----------------------------------+
```

---

## 📋 The 4-Step Zero-Training Admin Workflow

```
[ Step 1: Upload Excel ] ──> [ Step 2: Add Supervisor ] ──> [ Step 3: Watch Live Data ] ──> [ Step 4: Export .xlsx ]
   (.xlsx XLSForm/Table)        (1-Click WhatsApp Share)         (SSE Real-Time Stream)        (Complete Dataset)
```

1. **Step 1: Upload Excel (.xlsx) Form to Start Project**
   * Upload either:
     * **KoboToolbox / XLSForm Format:** `survey` and `choices` sheets with `type`, `name`, `label`, and `required`.
     * **Simple Table Format:** Spreadsheet where Row 1 contains question titles (e.g. `Full Name`, `Age`, `District`, `Water Source`).
   * Visually verify fields in the live preview and click **Publish Project**.
   * Download pre-built Excel sample templates directly from the portal if you don't have a form ready.

2. **Step 2: Add Supervisor & Share Login**
   * Navigate to `2. Supervisors` and click **Add Supervisor**.
   * Enter their name or auto-generate their credentials with one click.
   * Click **Copy Credentials** to produce a WhatsApp/SMS-ready message:
     ```
     👋 Welcome to Innovative Data Platform!
     Your Supervisor login credentials:
     👤 User ID: SUP-1042
     🔑 Password: supervisor123
     🌐 Server: https://innovative-data-platform.wasmer.app
     ```

3. **Step 3: Watch Live Data Dashboard**
   * Field submissions appear instantly across all browser sessions via Server-Sent Events (SSE).
   * High-contrast stat cards: `Total Submissions`, `Active Projects`, `Registered Supervisors`, `Active Enumerators`.
   * Live Supervisor Performance list showing real-time submission progress.

4. **Step 4: Download Collected Data (.xlsx)**
   * Filter by project, supervisor, or date.
   * Click **Download Collected Data (.xlsx)** to generate styled Excel files containing:
     * Submission ID, Timestamp, Project Name, Supervisor Name, Enumerator Name.
     * All survey question responses in individual dedicated columns.

---

## 📱 Unified Android Mobile Application (`InnovativeDataPlatform-Android`)

The Android application is located in the `InnovativeDataPlatform-Android/` folder.

### Key Capabilities:
* **Single APK Architecture:** Only one app needs to be distributed. When an enumerator logs in with `TM-2001`, they enter collection mode; when a supervisor logs in with `SUP-1042`, they enter live monitoring mode.
* **Server Settings (Top-Right Gear Icon):** Field workers or supervisors can point the app to your custom server URL (`https://<your-wasmer-domain>`) and click **Test Connection** (which validates against `/health`) before logging in.
* **Supervisor Mode:**
  * View live field counts with 5-second polling.
  * Create new Team Members on the fly.
  * Share team member credentials via WhatsApp or SMS in 1 tap.
  * Inspect individual team member submission histories.
* **Team Member Mode:**
  * Select assigned projects and fetch latest dynamic form schemas.
  * Fill inputs: Text, Numbers, Single-Choice Cards, Multi-Select Checkboxes, Date Picker, and **GPS Coordinate Capture**.
  * Offline-First: If internet is lost, submissions are queued in secure local storage and auto-synced as soon as connectivity resumes.
  * Personal statistics dashboard tracking daily and all-time inputs.

### Build the Android APK:
```bash
cd InnovativeDataPlatform-Android
flutter pub get
flutter test
flutter build apk --release
```
The APK is generated at:
`InnovativeDataPlatform-Android/build/app/outputs/flutter-apk/app-release.apk`

---

## ☁️ Deployment on Wasmer.io

Deploying to **Wasmer.io** is fully supported via both the **Wasmer Web Console (Deploy from GitHub)** and the **Wasmer CLI**.

### Option A: Deploy via Wasmer Web Console (Recommended)

1. Go to [https://wasmer.io/apps](https://wasmer.io/apps) and click **Create App** (or **Deploy from GitHub**).
2. Select repository: `monourhosan/Innovative.D.P` on branch `main`.
3. Configure your app settings:
   * **Project preset:** Select **`Dockerfile`** *(or `node-base` with Node.js engine)*.
   * **Node.js Engine:** **`Node.js`** *(⚠️ Do NOT use QuickJS)*.
   * **Enable Database:** **`Disabled (OFF)`** *(The platform uses embedded SQLite stored on a persistent volume with zero external dependencies and zero cost)*.
   * **Port:** `8080` (or leave default `$PORT`).
4. Click **Deploy**.

### Option B: Deploy via Wasmer CLI

```bash
# 1. Install Wasmer CLI (if needed)
curl https://get.wasmer.io -sSfL | sh

# 2. Log in
wasmer login

# 3. Deploy container and persistent volume
wasmer deploy
```

Detailed deployment documentation is available in [README_WASMER_DEPLOY.md](README_WASMER_DEPLOY.md).

---

## 💻 Local Development Quickstart

### Prerequisites
* Node.js v22.5.0 or newer (for native `node:sqlite`)
* Flutter SDK (for the Android app)

### 1. Install Backend Dependencies
```bash
npm install
```

### 2. Seed Sample Database
Pre-populates a ready-to-test environment with projects, sample supervisors, team members, and submissions:
```bash
npm run seed
```

### 3. Run Automated Backend Tests
Runs all 30 automated integration tests covering authentication, forms, submissions, SSE, and Excel export:
```bash
node src/test_suite.js
```

### 4. Start the Server
```bash
npm start
```
Open **http://localhost:3000** in your browser.

---

## 🔑 Default Login Credentials

| Role | User ID | Password | Access / Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Web Portal: Upload projects, manage supervisors, download Excel |
| **Supervisor** | `SUP-1042` | `supervisor123` | Mobile App & Web: Live team monitor, create team members |
| **Team Member** | `TM-2001` | `member123` | Mobile App: Dynamic form data collection & offline sync |

---

## ⚡ REST API Specification

Base URL: `/api/v1`

| Method | Endpoint | Allowed Role | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Container health probe & connection test |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials; returns JWT and user profile |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns currently authenticated user session |
| `GET` | `/api/v1/admin/dashboard` | `ADMIN` | High-level statistics, supervisor breakdown, and recent submissions |
| `GET` | `/api/v1/projects` | `ADMIN` | List all uploaded projects with form schemas |
| `POST` | `/api/v1/projects/upload` | `ADMIN` | Upload `.xlsx` form (XLSForm or Simple Table) |
| `POST` | `/api/v1/projects/publish` | `ADMIN` | Publishes validated form schema to field workers |
| `GET` | `/api/v1/admin/supervisors` | `ADMIN` | Lists all supervisors with team sizes and performance metrics |
| `POST` | `/api/v1/admin/supervisors` | `ADMIN` | Creates new Supervisor account |
| `GET` | `/api/v1/supervisor/dashboard` | `SUPERVISOR` | Supervisor live dashboard with enumerator status |
| `GET` | `/api/v1/supervisor/team-members` | `SUPERVISOR` | Lists assigned team members |
| `POST` | `/api/v1/supervisor/team-members` | `SUPERVISOR` | Creates a new field team member |
| `GET` | `/api/v1/member/projects` | `TEAM_MEMBER` | Fetches active projects and dynamic form schemas |
| `POST` | `/api/v1/member/submissions` | `TEAM_MEMBER` | Submits collected data (single or offline batch sync) |
| `GET` | `/api/v1/member/dashboard` | `TEAM_MEMBER` | Personal live stats (today's count, total count) |
| `GET` | `/api/v1/live/stream` | Authenticated | Server-Sent Events (SSE) real-time feed |
| `GET` | `/api/v1/export/submissions.xlsx` | `ADMIN`, `SUPERVISOR` | Downloads project submissions as styled `.xlsx` |
| `GET` | `/api/v1/projects/sample-template` | Public | Generates downloadable XLSForm or Simple Table templates |

---

## 📂 Repository Directory Layout

```
.
├── .dockerignore                            # Excludes Android and caches from Docker context
├── .gitignore                               # Git ignore rules
├── Dockerfile                               # Production Node 22 Alpine containerfile
├── README.md                                # Master documentation
├── README_WASMER_DEPLOY.md                  # Comprehensive Wasmer.io deployment guide
├── package.json                             # Dependencies, engines, and npm scripts
├── wasmer.toml                              # Wasmer Edge service and volume definition
│
├── public/                                  # Admin Web Portal (Single Page App)
│   ├── index.html                           # Main web dashboard interface
│   ├── login.html                           # Admin web login interface
│   ├── css/
│   │   └── styles.css                       # Modern, responsive UI theme
│   └── js/
│       ├── app.js                           # Core SPA controller and navigation
│       ├── dashboard.js                     # Live stats and SSE audio chime listener
│       ├── projects.js                      # Dual-mode .xlsx upload and visual preview
│       ├── supervisors.js                   # Supervisor management and WhatsApp copy
│       ├── submissions.js                   # Data table view and .xlsx export
│       ├── simulator.js                     # Built-in mobile app web simulator
│       └── api-docs.js                      # Interactive API endpoint documentation
│
├── src/                                     # Express.js REST API Backend
│   ├── server.js                            # Application entry point and router binding
│   ├── config.js                            # Dynamic configuration and path resolution
│   ├── test_suite.js                        # 30-step automated verification suite
│   ├── db/
│   │   ├── index.js                         # Native SQLite setup (WAL mode & schema)
│   │   └── seed_samples.js                  # Sample data seeder
│   ├── middleware/
│   │   ├── auth.js                          # JWT authentication and RBAC
│   │   └── upload.js                        # Multer spreadsheet upload handler
│   ├── routes/                              # Express route modules
│   └── services/                            # Business logic (XLSX parsing, export, SSE)
│
└── InnovativeDataPlatform-Android/          # Unified Android Companion App (Flutter)
    ├── pubspec.yaml                         # Flutter dependencies (http, shared_preferences, etc.)
    ├── android/                             # Android native configuration and permissions
    ├── lib/
    │   ├── main.dart                        # Flutter entrypoint
    │   ├── constants/app_theme.dart         # Material 3 UI styling
    │   ├── models/                          # User, Project, and Submission data models
    │   ├── services/                        # API, Storage, and Offline Auto-Sync services
    │   ├── screens/
    │   │   ├── login_screen.dart            # Unified login with role detection
    │   │   ├── server_settings_dialog.dart  # Configurable Wasmer server URL & tester
    │   │   ├── supervisor/                  # Supervisor live monitor & member creation
    │   │   └── member/                      # Form renderer & personal live dashboard
    │   └── widgets/                         # Reusable UI cards and live badges
    └── test/                                # Automated Flutter widget and logic tests
```

---

## 👤 Author & Branding

* **Platform Name:** Innovative Data Platform
* **Creator Attribution:** Made by Saif for Innovative Research & Consultancy Ltd.
* **License:** [MIT](LICENSE)