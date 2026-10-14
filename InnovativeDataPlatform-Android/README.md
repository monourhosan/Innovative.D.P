# Innovative Data Platform (Unified Android App)

> **Creator & Author:** Made by Saif  
> **Package Name / Application ID:** `com.saif.innovativedata`  
> **Backend Connection:** Directly connected to the Admin Website & Database hosted on [Wasmer.io](https://wasmer.io/)

---

## 🌟 Overview

The **Innovative Data Platform** Android application is a unified, single APK designed for field data collection inspired by KoboToolbox and ODK Collect. Created by **Saif**, both **Supervisors** and **Team Members** install and use this **exact same app**:

1. **Single Unified Login Screen:** Any user enters their `User ID` and `Password`.
2. **Automatic Role Routing:** The app authenticates against the website backend API (`POST /api/v1/auth/login`) and automatically routes the user:
   - **`role == "SUPERVISOR"`:** Opens the **Supervisor Workspace** (Monitor field enumerators live, view live submission stats, and create new Team Members with one-tap credential sharing via WhatsApp / SMS).
   - **`role == "TEAM_MEMBER"`:** Opens the **Team Member Workspace** (Download active project forms uploaded by the Admin on the website, collect data with dynamic inputs, submit online or offline with auto-sync, and view personal live stats).

---

## 🧭 In-App Features & Workspaces

### 1. Unified Login & Server Settings
- **Configurable Website URL (Top-right Gear Icon):** Change between Wasmer.io cloud (`https://innovative-data-platform.wasmer.app`), local PC network, or emulator (`http://10.0.2.2:3000`) without rebuilding the app.
- **Test Connection Button:** Hits `/health` to verify server connectivity in real time.
- **One-Tap Demo Credentials:** Includes instant fill buttons for fast testing.

### 2. Supervisor Workspace (Role: SUPERVISOR)
- **Tab 1: Live Team Dashboard:**
  - Connection indicator: `"CONNECTED TO WEBSITE — LIVE UPDATES ON"`
  - Summary Cards: `Total Team Members`, `Today's Data Input`, `Total Data Sent to Website`.
  - Live Team Monitoring: Real-time list showing each member's today/total counts and last active time.
  - Tap any member to inspect their recent submissions in a bottom sheet!
- **Tab 2: Manage Team Members:**
  - Big `+ Add New Team Member` button.
  - Auto-generate User ID (`TM-205`) and password with 1 tap.
  - Creates account directly in the website database (`POST /api/v1/supervisor/team-members`).
  - **1-Tap Share via WhatsApp / SMS** or Copy Credentials.

### 3. Team Member Workspace (Role: TEAM_MEMBER)
- **Tab 1: Collect & Send Data (KoboToolbox-Style Form Input):**
  - **Step 1:** Select active survey project synced from Admin website.
  - **Step 2:** Dynamic Form Renderer supporting:
    - Text, Number, Integer, Decimal
    - Single Select (`select_one`) with touch-friendly radio cards
    - Multiple Select (`select_multiple`) with checkbox cards
    - Calendar Date Picker
    - GPS Location Coordinate Capture button
    - Field notes & observations textarea
  - **Step 3:** Submit & Send to Website:
    - **Online:** Transmits immediately to the website database and updates the Admin & Supervisor live dashboards.
    - **Offline:** Saves safely to local device storage with auto-sync when connection restores.
- **Tab 2: My Live Dashboard:**
  - `My Data Input Today`
  - `My Total Data Sent to Website`
  - `Waiting to Sync (Offline)`
  - Manual `"Sync Offline Records Now"` button.
  - History of recent submissions with answer details.

---

## 🛠️ Build & Run Instructions

### 1. Run on Connected Device / Emulator
```bash
cd InnovativeDataPlatform-Android
flutter run
```

### 2. Build Release APK
```bash
cd InnovativeDataPlatform-Android
flutter build apk --release
```
The output APK will be generated at:
`build/app/outputs/flutter-apk/app-release.apk`

### 3. Run Automated Tests
```bash
flutter test
```

---

## ⚡ REST API Contract

The app communicates with the Admin Website via the following endpoints:

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | All | Authenticates and returns role + JWT token |
| `/api/v1/supervisor/dashboard` | `GET` | `SUPERVISOR` | Live team submission stats and member breakdown |
| `/api/v1/supervisor/team-members` | `GET` | `SUPERVISOR` | Lists all team members under this supervisor |
| `/api/v1/supervisor/team-members` | `POST` | `SUPERVISOR` | Creates a new team member account |
| `/api/v1/member/projects` | `GET` | `TEAM_MEMBER` | Fetches active projects with dynamic form schemas |
| `/api/v1/member/submissions` | `POST` | `TEAM_MEMBER` | Submits field data (single or offline sync) |
| `/api/v1/member/dashboard` | `GET` | `TEAM_MEMBER` | Fetches personal live stats and recent feed |

---

## 👤 Branding & Author Attribution

- **Application Title:** Innovative Data Platform
- **Creator Attribution:** Made by Saif
- **Package Name:** `com.saif.innovativedata`
