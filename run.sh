#!/usr/bin/env bash
set -e

# Resolve script location
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Build the frontend and backend into a single jar
"$ROOT_DIR/build.sh"

# Run the packaged Spring Boot application
exec java -jar "$ROOT_DIR/review-tracker-backend/target/review-tracker-backend-0.0.1-SNAPSHOT.jar"
