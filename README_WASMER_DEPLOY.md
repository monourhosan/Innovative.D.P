# Wasmer.io Deployment Guide: Innovative Data Platform

> **Project Name:** Innovative Data Platform  
> **Creator Attribution:** Made by Saif  
> **Target Cloud:** [Wasmer.io](https://wasmer.io/) Edge Containers & Volumes

This guide details the step-by-step instructions to deploy the **Innovative Data Platform** web application, persistent SQLite database volume, and Android REST API backend onto **Wasmer.io**.

---

## 1. Prerequisites

1. **Wasmer CLI:** Install the official Wasmer command-line tool:
   - **macOS / Linux:**
     ```bash
     curl https://get.wasmer.io -sSfL | sh
     ```
   - **Windows (PowerShell):**
     ```powershell
     iwr -useb https://get.wasmer.io | iex
     ```
   Verify installation:
   ```bash
   wasmer --version
   ```

2. **Wasmer Account:**
   - Sign up or log in at [https://wasmer.io/](https://wasmer.io/).
   - Obtain your CLI authentication token from [https://wasmer.io/settings/tokens](https://wasmer.io/settings/tokens).
   - Log in via CLI:
     ```bash
     wasmer login
     ```

---

## 2. Project Architecture on Wasmer.io

```
+-------------------------------------------------------------+
|                        Wasmer Edge                          |
|                                                             |
|   HTTPS Router: https://innovative-data-platform.wasmer.app  |
|                         |                                   |
|                         v Port 8080                         |
|     +-------------------------------------------------+     |
|     |  Innovative Data Platform (Node.js Container)   |     |
|     |  - Admin Web Dashboard (Single Page App)        |     |
|     |  - RESTful API Endpoints (/api/v1/*)            |     |
|     |  - Server-Sent Events (SSE) Live Feed           |     |
|     |  - KoboToolbox & Simple Table .xlsx Processor   |     |
|     +-------------------------------------------------+     |
|                         |                                   |
|                         v /app/data                         |
|     +-------------------------------------------------+     |
|     |  Wasmer Persistent Volume ("platform-data")     |     |
|     |  - platform.db (SQLite with WAL concurrency)    |     |
|     +-------------------------------------------------+     |
+-------------------------------------------------------------+
```

---

## 3. Deployment Steps

### Step 1: Clone / Navigate to Project Directory
```bash
cd /path/to/irc_data
```

### Step 2: Configure Environment Variables (Optional)
If you wish to customize the default admin password or JWT secret on Wasmer, configure them as secrets:
```bash
wasmer app secret create JWT_SECRET="your_custom_production_jwt_secret_key"
wasmer app secret create DEFAULT_ADMIN_USER="admin"
wasmer app secret create DEFAULT_ADMIN_PASS="your_secure_password"
```

### Step 3: Deploy to Wasmer.io
Deploy the container and bind the persistent volume with a single command:
```bash
wasmer deploy
```

During the first deploy, the Wasmer CLI will:
1. Build the lightweight container from the included `Dockerfile`.
2. Provision the persistent storage volume named `platform-data`.
3. Mount the volume at `/app/data` to ensure all user accounts, projects, and field submissions persist across redeployments and container restarts.
4. Provide you with a live HTTPS URL (e.g., `https://innovative-data-platform.wasmer.app`).

---

## 4. Post-Deployment Verification

1. **Verify Health Endpoint:**
   ```bash
   curl https://<your-wasmer-domain>/health
   ```
   Expected response:
   ```json
   {
     "status": "healthy",
     "platform": "Innovative Data Platform",
     "author": "Made by Saif",
     "version": "1.0.0"
   }
   ```

2. **Log in to Admin Web Portal:**
   - Open `https://<your-wasmer-domain>/login.html` in your web browser.
   - Default credentials seeded automatically:
     - **User ID:** `admin`
     - **Password:** `admin123`
   - Immediately visit **Settings** in the left sidebar to update your password.

3. **Android App Companion Connection:**
   Point companion Android APKs to the base URL:
   ```
   https://<your-wasmer-domain>/api/v1
   ```

---

## 5. Maintenance & Useful Commands

| Task | Command |
| :--- | :--- |
| **View Live Container Logs** | `wasmer app logs` |
| **Check App Health & Scaling** | `wasmer app status` |
| **Download Database Backup** | `wasmer ssh -- cp /app/data/platform.db ./backup.db` |
| **Redeploy Updates** | `wasmer deploy` |

---

*Innovative Data Platform — Made by Saif*
