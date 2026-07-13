#!/bin/bash
# deploy.sh — Build, push, and deploy MindGuard AI to IBM Code Engine
# Usage: bash infra/deploy.sh <IBM_CLOUD_API_KEY> <ICR_NAMESPACE> <CE_PROJECT_NAME>
#
# Prerequisites:
#   ibmcloud CLI installed: https://cloud.ibm.com/docs/cli
#   ibmcloud ce plugin:      ibmcloud plugin install code-engine
#   ibmcloud cr plugin:      ibmcloud plugin install container-registry

set -e

API_KEY="$1"
ICR_NS="$2"
CE_PROJECT="$3"
REGION="${4:-us-south}"

if [[ -z "$API_KEY" || -z "$ICR_NS" || -z "$CE_PROJECT" ]]; then
  echo "Usage: $0 <API_KEY> <ICR_NAMESPACE> <CE_PROJECT>"
  exit 1
fi

echo "=== Logging in to IBM Cloud ==="
ibmcloud login --apikey "$API_KEY" -r "$REGION" -q

echo "=== Logging in to Container Registry ==="
ibmcloud cr login
ibmcloud cr region-set "$REGION"

BACKEND_IMAGE="icr.io/$ICR_NS/mindguard-backend:latest"
FRONTEND_IMAGE="icr.io/$ICR_NS/mindguard-frontend:latest"

echo "=== Building and pushing backend ==="
docker build -t "$BACKEND_IMAGE" ./backend
docker push "$BACKEND_IMAGE"

echo "=== Building and pushing frontend ==="
docker build -t "$FRONTEND_IMAGE" ./frontend
docker push "$FRONTEND_IMAGE"

echo "=== Targeting Code Engine project ==="
ibmcloud ce project select --name "$CE_PROJECT"

echo "=== Creating secrets (edit values first!) ==="
# Only creates if not already present — update with ibmcloud ce secret update
ibmcloud ce secret create --name mindguard-secrets \
  --from-literal SESSION_SECRET="REPLACE" \
  --from-literal WATSONX_API_KEY="REPLACE" \
  --from-literal WATSONX_PROJECT_ID="REPLACE" \
  --from-literal WATSONX_URL="https://us-south.ml.cloud.ibm.com" \
  --from-literal WATSONX_CHAT_MODEL="ibm/granite-13b-chat-v2" \
  --from-literal WATSONX_CLASSIFY_MODEL="ibm/granite-7b-instruct" \
  --from-literal CLOUDANT_URL="REPLACE" \
  --from-literal CLOUDANT_API_KEY="REPLACE" \
  --from-literal CORS_ORIGIN="REPLACE_WITH_FRONTEND_URL" \
  2>/dev/null || echo "Secret already exists — use 'ibmcloud ce secret update' to change values."

echo "=== Deploying backend ==="
ibmcloud ce application create --name mindguard-backend \
  --image "$BACKEND_IMAGE" \
  --port 3001 \
  --min-scale 1 --max-scale 10 \
  --cpu 0.5 --memory 512M \
  --env-from-secret mindguard-secrets \
  --env NODE_ENV=production \
  --env PORT=3001 \
  --env CLOUDANT_DB_PREFIX=mindguard_ \
  2>/dev/null || ibmcloud ce application update --name mindguard-backend --image "$BACKEND_IMAGE"

BACKEND_URL=$(ibmcloud ce application get --name mindguard-backend --output json | grep '"url"' | head -1 | awk -F'"' '{print $4}')
echo "Backend URL: $BACKEND_URL"

echo "=== Deploying frontend ==="
ibmcloud ce application create --name mindguard-frontend \
  --image "$FRONTEND_IMAGE" \
  --port 8080 \
  --min-scale 1 --max-scale 5 \
  --cpu 0.25 --memory 256M \
  2>/dev/null || ibmcloud ce application update --name mindguard-frontend --image "$FRONTEND_IMAGE"

FRONTEND_URL=$(ibmcloud ce application get --name mindguard-frontend --output json | grep '"url"' | head -1 | awk -F'"' '{print $4}')
echo "Frontend URL: $FRONTEND_URL"

echo "=== Update CORS_ORIGIN in secret to: $FRONTEND_URL ==="
ibmcloud ce secret update --name mindguard-secrets --from-literal CORS_ORIGIN="$FRONTEND_URL"

echo ""
echo "=== Deployment complete ==="
echo "Frontend: $FRONTEND_URL"
echo "Backend:  $BACKEND_URL"
echo "Health:   $BACKEND_URL/api/health"
