#!/bin/bash
# =============================================================================
# Deploy to Google Cloud Run
# Builds the container, pushes to Artifact Registry, and deploys with
# VPC connector for AlloyDB private IP access.
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
PROJECT_ID="${GCP_PROJECT_ID:?❌ Set GCP_PROJECT_ID}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="achievement-digest"
IMAGE_NAME="achievement-digest"
REPO_NAME="achievement-digest-repo"
VPC_CONNECTOR_NAME="alloydb-connector"
NETWORK_NAME="default"
DB_PASSWORD="${ALLOYDB_PASSWORD:?❌ Set ALLOYDB_PASSWORD}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}ℹ  $1${NC}"; }
log_ok()    { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo ""
echo "======================================================"
echo "  Cloud Run Deployment — Achievement Digest"
echo "======================================================"
echo ""

gcloud config set project "$PROJECT_ID" --quiet

# ---------------------------------------------------------------------------
# Step 1: Create Artifact Registry repository (if not exists)
# ---------------------------------------------------------------------------
log_info "Step 1/5: Setting up Artifact Registry..."

if gcloud artifacts repositories describe "$REPO_NAME" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    log_ok "Repository '$REPO_NAME' already exists"
else
    gcloud artifacts repositories create "$REPO_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --project="$PROJECT_ID" \
        --quiet
    log_ok "Repository '$REPO_NAME' created"
fi

# Configure Docker auth for Artifact Registry
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
log_ok "Docker auth configured"

# ---------------------------------------------------------------------------
# Step 2: Create Serverless VPC Access connector (for AlloyDB connectivity)
# ---------------------------------------------------------------------------
log_info "Step 2/5: Setting up VPC connector..."

# Enable the API first
gcloud services enable vpcaccess.googleapis.com --quiet 2>/dev/null || true

if gcloud compute networks vpc-access connectors describe "$VPC_CONNECTOR_NAME" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    log_ok "VPC connector '$VPC_CONNECTOR_NAME' already exists"
else
    gcloud compute networks vpc-access connectors create "$VPC_CONNECTOR_NAME" \
        --region="$REGION" \
        --network="$NETWORK_NAME" \
        --range="10.8.0.0/28" \
        --project="$PROJECT_ID" \
        --quiet
    log_ok "VPC connector '$VPC_CONNECTOR_NAME' created"
fi

# ---------------------------------------------------------------------------
# Step 3: Get AlloyDB IP
# ---------------------------------------------------------------------------
log_info "Step 3/5: Fetching AlloyDB connection details..."

ALLOYDB_IP=$(gcloud alloydb instances describe achievement-digest-primary \
    --cluster=achievement-digest-cluster \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(ipAddress)" 2>/dev/null)

if [ -z "$ALLOYDB_IP" ]; then
    echo "❌ Could not fetch AlloyDB IP. Is the instance running?"
    exit 1
fi
log_ok "AlloyDB IP: $ALLOYDB_IP"

# URL encode the password for the connection string
ENCODED_PASSWORD=$(node -e "console.log(encodeURIComponent('$DB_PASSWORD'))")
DATABASE_URL="postgresql://postgres:${ENCODED_PASSWORD}@${ALLOYDB_IP}:5432/postgres?schema=public"

# ---------------------------------------------------------------------------
# Step 4: Build and push Docker image
# ---------------------------------------------------------------------------
log_info "Step 4/5: Building and pushing Docker image..."

FULL_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

# Build using Cloud Build (faster, no local Docker needed for large images)
gcloud builds submit \
    --tag "$FULL_IMAGE" \
    --project="$PROJECT_ID" \
    --quiet

log_ok "Image pushed: $FULL_IMAGE"

# ---------------------------------------------------------------------------
# Step 5: Deploy to Cloud Run
# ---------------------------------------------------------------------------
log_info "Step 5/5: Deploying to Cloud Run..."

gcloud run deploy "$SERVICE_NAME" \
    --image="$FULL_IMAGE" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --platform=managed \
    --allow-unauthenticated \
    --vpc-connector="$VPC_CONNECTOR_NAME" \
    --set-env-vars="DATABASE_URL=${DATABASE_URL},NODE_ENV=production,GOOGLE_GENAI_USE_VERTEXAI=true,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},GOOGLE_CLOUD_LOCATION=${REGION}" \
    --memory=2048Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --timeout=600 \
    --quiet

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(status.url)")

echo ""
echo "======================================================"
echo -e "  ${GREEN}✅ DEPLOYMENT SUCCESSFUL${NC}"
echo "======================================================"
echo ""
echo "  Service URL: $SERVICE_URL"
echo ""
echo "  Test it:"
echo "    curl $SERVICE_URL/health"
echo "    curl -X POST $SERVICE_URL/achievements/submit \\"
echo "      -H 'Content-Type: application/json' \\"
echo "      -d '{\"text\": \"Team shipped a new feature\", \"team\": \"Alpha\"}'"
echo ""
echo "  Seed the database:"
echo "    curl -X POST $SERVICE_URL/admin/seed"
echo ""
