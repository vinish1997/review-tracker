#!/usr/bin/env bash
set -e

# build frontend
npm --prefix review-tracker-ui install
npm --prefix review-tracker-ui run build

# copy frontend build into backend static resources
rm -rf review-tracker-backend/src/main/resources/static
mkdir -p review-tracker-backend/src/main/resources/static
cp -r review-tracker-ui/dist/* review-tracker-backend/src/main/resources/static/

# package backend (will also include frontend)
mvn -f review-tracker-backend/pom.xml package
