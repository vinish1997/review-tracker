# Review Tracker

A full‑stack app to track product review and refund workflows. It provides a React + Vite front‑end and a Spring Boot + MongoDB back‑end, with a build that bundles the UI into the back‑end for a single‑jar deployment.

## Overview

- Purpose: manage reviews, payouts/refunds, and operational workflow end‑to‑end.
- Stack: React (Vite, Tailwind) + Spring Boot 3 (Java 21) + MongoDB.
- Single‑jar: `./build.sh` builds the UI and packages it into the back‑end JAR; `./run.sh` runs it.
- API Docs: available via Swagger UI at `/swagger-ui/index.html` when the server is running.

## Architecture

- Frontend: `review-tracker-ui` (Vite + React + Tailwind)
  - Dev server: Vite on `http://localhost:5173`.
  - API base: configurable via `VITE_API_BASE` (defaults to same origin).
- Backend: `review-tracker-backend` (Spring Boot 3.5, Java 21)
  - Persistence: MongoDB.
  - REST endpoints under `/api/**`.
  - Serves the built UI from `src/main/resources/static` in packaged mode.
- Build flow:
  - `build.sh` installs UI deps, builds UI, copies `dist/` to back‑end `static/`, then builds the JAR with Maven.
  - `run.sh` calls `build.sh` then launches the packaged JAR.

## Deployment And Pull

- Pull latest:
  - `git pull origin main`
  - Create a feature branch: `git checkout -b feature/your-change`
  - Push and open PR: `git push -u origin feature/your-change`
- Local deploy (single JAR):
  - `./run.sh` (builds UI + back‑end and runs the JAR)
  - Or manual:
    - `./build.sh`
    - `java -jar review-tracker-backend/target/review-tracker-backend-0.0.1-SNAPSHOT.jar`
- Dev mode (separate processes):
  - Backend: `mvn -f review-tracker-backend/pom.xml spring-boot:run`
  - Frontend: in `review-tracker-ui`:
    - Create `.env.local` with `VITE_API_BASE=http://localhost:8080`
    - `npm install`
    - `npm run dev`

## Environment Establishment

- Prerequisites:
  - Java 21 (Temurin/Adoptium recommended)
  - Maven 3.9+
  - Node.js 18+ (20 LTS recommended) and npm
  - MongoDB 6+ (local or remote)
- Backend configuration:
  - Mongo URI (recommended): set env var `SPRING_DATA_MONGODB_URI` (e.g., `mongodb://localhost:27017/review-tracker`)
  - Optional: `SERVER_PORT` (defaults to 8080)
- Frontend configuration:
  - `VITE_API_BASE` to point the UI to a remote API (e.g., `http://localhost:8080` in dev). In packaged single‑jar mode this is not required.
- Quick Mongo via Docker:
  - `docker run -d --name mongo -p 27017:27017 mongo:6`
- Tests:
  - `mvn -f review-tracker-backend/pom.xml test` (uses embedded Mongo for tests)

## Docker

- Build and run with Docker (MongoDB Atlas):
  - Copy `.env.example` to `.env` and set `SPRING_DATA_MONGODB_URI` to your Atlas connection string.
  - `docker compose up --build` (or `docker-compose up --build`)
  - App listens on `http://localhost:${SERVER_PORT:-8080}`
- Standalone Docker build (no compose):
  - `docker build -t review-tracker .`
  - `docker run -p 8080:8080 -e SPRING_DATA_MONGODB_URI='<atlas-uri>' review-tracker`
- Note on Atlas:
  - Create a database user (readWrite on your DB), allow your IP or environment in Atlas Network Access.
  - Connection string format: `mongodb+srv://user:pass@cluster.example.mongodb.net/review-tracker?retryWrites=true&w=majority&appName=ReviewTracker`

## GitHub Actions (CI/CD)

This repo includes basic GitHub Actions workflows under `.github/workflows/`:

- `ci.yml`: builds the UI and packages the backend on pushes/PRs to `main`. Uploads the JAR as an artifact.
- `docker-publish.yml`: builds and pushes a Docker image to GitHub Container Registry (GHCR) as `ghcr.io/<owner>/review-tracker` on push to `main` and tags.
- `deploy-ssh.yml`: manual (workflow_dispatch) deployment to a remote host via SSH. It pulls the GHCR image and runs it with Docker Compose.

Setup steps:

1) Enable GHCR permissions for the repo
   - Nothing to set manually; the workflows use the built-in `GITHUB_TOKEN` with `packages: write` permission.

2) (Optional) Remote deploy via SSH
   - Add repository secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY` (private key), `SPRING_DATA_MONGODB_URI`, `SERVER_PORT` (e.g., 8080), and optionally `JAVA_OPTS`.
   - Run the `Deploy via SSH` workflow from the Actions tab with `image_tag` set to `latest` or a specific SHA tag.

3) Publish container to GHCR
   - On merge to `main`, `docker-publish.yml` will push tags `latest`, `sha-<short>` etc.
   - Pull locally: `docker pull ghcr.io/<owner>/review-tracker:latest`


## Feature Overview

- **Reviews Management**: Full CRUD operations for tracking product reviews.
- **Workflow Automation**: Auto-advance reviews through lifecycle steps (Ordered → Delivered → Submitted → Accepted → Form Submitted → Payment Received).
- **Payment & Refund Tracking**: Explicitly track `Amount Paid`, `Refund Due`, and `Payment Received` dates. Perfect for maintaining paid reviews history.
- **Interactive Dashboard**: Real-time metrics including total spend, pending refunds, and platform-wise breakdowns.
- **Lookups**: Manage reusable platforms, mediators, and review statuses.
- **Bulk Actions**: Efficiently handle multiple reviews (bulk delete, bulk status advance).
- **Import/Export**: Move data in and out via CSV for external analysis.
- **History & Audit**: Track every change made to a review with a detailed activity timeline.
- **Responsive Design**: Designed to work on both laptops and mobile devices for on-the-go tracking.

## Vercel & Cloud Deployment

To host this project for personal use on mobile and laptop, a split deployment is recommended:

### 1. Frontend (Vercel)
- **Deployment**: Connect the `review-tracker-ui` folder to a new Vercel project.
- **Routing**: Add a `vercel.json` in the UI root to handle SPA routing:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
- **Environment Variables**: Set `VITE_API_BASE` to your deployed backend URL.

### 2. Backend (Render / Railway / fly.io)
- **Deployment**: Deploy the `review-tracker-backend` as a Java/Maven application.
- **Database**: Use a free-tier **MongoDB Atlas** cluster.
- **Environment Variables**:
    - `SPRING_DATA_MONGODB_URI`: Your Atlas connection string.
    - `ALLOWED_ORIGINS`: Your Vercel frontend URL (to enable CORS).

### 3. Local Mobile Testing
- Ensure your mobile and laptop are on the same network.
- Run the app locally and access it via your laptop's IP address (e.g., `http://192.168.1.5:8080`).

---

## Enhancement Suggestions (Future)

Based on current project scope, the following enhancements are proposed for better mobile usability:
1. **PWA Integration**: Install the app as a mobile "app" without an app store.
2. **Push Notifications**: Get alerts for overdue payments or pending reviews.
3. **Optimized Mobile Layout**: Switch to card-style views instead of tables on small screens.
4. **Offline Mode**: View your reviews even without an active internet connection.

---

## Common Commands
... (rest of the file)
