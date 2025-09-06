# Multi-stage build for Review Tracker (UI + Backend)

# 1) Build UI with Node
FROM node:20-alpine AS ui-build
WORKDIR /app
COPY review-tracker-ui ./review-tracker-ui
WORKDIR /app/review-tracker-ui
# Install and build (needs devDependencies)
RUN npm ci && npm run build

# 2) Build backend JAR with Maven, inject built UI
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /workspace
# Copy only backend sources first (for better layer caching)
COPY review-tracker-backend ./review-tracker-backend
# Replace static resources with UI dist
RUN rm -rf review-tracker-backend/src/main/resources/static && \
    mkdir -p review-tracker-backend/src/main/resources/static
COPY --from=ui-build /app/review-tracker-ui/dist/ review-tracker-backend/src/main/resources/static/
# Build the Spring Boot JAR
RUN mvn -f review-tracker-backend/pom.xml -DskipTests package

# 3) Runtime image
FROM eclipse-temurin:21-jre
ENV JAVA_OPTS=""
WORKDIR /app
COPY --from=backend-build /workspace/review-tracker-backend/target/review-tracker-backend-0.0.1-SNAPSHOT.jar /app/app.jar
EXPOSE 8080
# Expect MongoDB Atlas URI via SPRING_DATA_MONGODB_URI, and optional SERVER_PORT
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]

