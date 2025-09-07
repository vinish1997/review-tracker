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

## Feature Overview

- Reviews: create, view, update, delete; search and pagination.
- Lookups: manage Platforms, Statuses, Mediators.
- Import/Export: CSV import/export for reviews.
- Bulk actions: bulk delete, bulk advance workflow steps.
- Dashboard: totals, averages, payment received/pending, overdue and aging buckets, by platform/mediator breakdowns.
- Views: save, share, and manage saved filter views.
- History: per‑review activity/history timeline.
- API docs: interactive Swagger UI at `/swagger-ui/index.html` and JSON at `/v3/api-docs`.

## Common Commands

- Build packaged app: `./build.sh`
- Run packaged app: `./run.sh`
- Backend dev run: `mvn -f review-tracker-backend/pom.xml spring-boot:run`
- Frontend dev run: `npm --prefix review-tracker-ui install && npm --prefix review-tracker-ui run dev`

## Troubleshooting

- Mongo connection errors: set `SPRING_DATA_MONGODB_URI` and ensure Mongo is reachable.
- CORS in dev: set `VITE_API_BASE` to your backend origin; the packaged single‑jar avoids CORS issues.
- Port in use: set `SERVER_PORT` to a free port before starting the backend.

---

For questions or PR reviews, open an issue or mention maintainers in your PR.
