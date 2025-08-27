#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:-"YOUR_GCP_PROJECT"}
REGION=${REGION:-"us-central1"}
REPO=${REPO:-"ai-photo-editor"}
SERVICE_BACKEND=${SERVICE_BACKEND:-"ai-photo-editor-backend"}
SERVICE_FRONTEND=${SERVICE_FRONTEND:-"ai-photo-editor-frontend"}

BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/backend:latest"
FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/frontend:latest"

echo "Authenticating and configuring gcloud..."
gcloud auth login --quiet || true
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

echo "Ensuring project and region..."
gcloud config set project "${PROJECT_ID}"
gcloud config set run/region "${REGION}"

echo "Creating Artifact Registry repo if missing..."
gcloud artifacts repositories create "${REPO}" \
  --repository-format=docker \
  --location="${REGION}" \
  --description="AI Photo Editor images" || true

echo "Building backend image..."
docker build -t "${BACKEND_IMAGE}" ./backend

echo "Pushing backend image..."
docker push "${BACKEND_IMAGE}"

echo "Deploying Backend to Cloud Run..."
gcloud run deploy "${SERVICE_BACKEND}" \
  --image "${BACKEND_IMAGE}" \
  --allow-unauthenticated \
  --update-env-vars GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
  --port 5000

BACKEND_URL=$(gcloud run services describe "${SERVICE_BACKEND}" --format='value(status.url)')

echo "Building frontend image with backend URL: ${BACKEND_URL}..."
docker build --build-arg REACT_APP_BACKEND_URL="${BACKEND_URL}" -t "${FRONTEND_IMAGE}" ./frontend

echo "Pushing frontend image..."
docker push "${FRONTEND_IMAGE}"

echo "Deploying Frontend to Cloud Run..."
gcloud run deploy "${SERVICE_FRONTEND}" \
  --image "${FRONTEND_IMAGE}" \
  --allow-unauthenticated \
  --port 80

FRONTEND_URL=$(gcloud run services describe "${SERVICE_FRONTEND}" --format='value(status.url)')

echo "Updating Backend CORS origin to Frontend URL..."
gcloud run services update "${SERVICE_BACKEND}" \
  --update-env-vars FRONTEND_ORIGIN="${FRONTEND_URL}"

echo "Deployment complete. URLs:"
echo "Backend: ${BACKEND_URL}"
echo "Frontend: ${FRONTEND_URL}"