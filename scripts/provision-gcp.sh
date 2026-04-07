#!/bin/bash
# =============================================================================
# GCP Resource Provisioning Script
# Provisions AlloyDB cluster, instance, database, and network configuration
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — Edit these values before running
# ---------------------------------------------------------------------------
PROJECT_ID="${GCP_PROJECT_ID:?❌ Set GCP_PROJECT_ID environment variable}"
REGION="${GCP_REGION:-us-central1}"
CLUSTER_ID="achievement-digest-cluster"
INSTANCE_ID="achievement-digest-primary"
DB_NAME="achievement_digest"
DB_USER="digest_admin"
DB_PASSWORD="${ALLOYDB_PASSWORD:?❌ Set ALLOYDB_PASSWORD environment variable}"
NETWORK_NAME="default"
ALLOYDB_IP_RANGE="alloydb-ip-range"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}ℹ  $1${NC}"; }
log_ok()    { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()  { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------
echo ""
echo "======================================================"
echo "  GCP Resource Provisioning — Achievement Digest"
echo "======================================================"
echo ""
log_info "Project:  $PROJECT_ID"
log_info "Region:   $REGION"
log_info "Cluster:  $CLUSTER_ID"
log_info "Instance: $INSTANCE_ID"
log_info "Database: $DB_NAME"
log_info "User:     $DB_USER"
echo ""

# Check gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | head -1 | grep -q "@"; then
    log_error "Not authenticated with gcloud. Run: gcloud auth login"
    exit 1
fi
log_ok "gcloud authenticated as $(gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>/dev/null | head -1)"

# Set project
gcloud config set project "$PROJECT_ID" --quiet
log_ok "Project set to $PROJECT_ID"

# ---------------------------------------------------------------------------
# Step 1: Enable required APIs
# ---------------------------------------------------------------------------
log_info "Step 1/6: Enabling required APIs..."
APIS=(
    "alloydb.googleapis.com"
    "compute.googleapis.com"
    "servicenetworking.googleapis.com"
    "run.googleapis.com"
    "cloudbuild.googleapis.com"
    "artifactregistry.googleapis.com"
    "aiplatform.googleapis.com"
)
for api in "${APIS[@]}"; do
    gcloud services enable "$api" --quiet 2>/dev/null && log_ok "  $api" || log_warn "  $api (may already be enabled)"
done

# ---------------------------------------------------------------------------
# Step 2: Configure Private Services Access (required for AlloyDB)
# ---------------------------------------------------------------------------
log_info "Step 2/6: Configuring Private Services Access..."

# Check if IP range already exists
if gcloud compute addresses describe "$ALLOYDB_IP_RANGE" --global --project="$PROJECT_ID" &>/dev/null; then
    log_ok "  IP range '$ALLOYDB_IP_RANGE' already exists"
else
    gcloud compute addresses create "$ALLOYDB_IP_RANGE" \
        --global \
        --purpose=VPC_PEERING \
        --prefix-length=16 \
        --network="$NETWORK_NAME" \
        --project="$PROJECT_ID" \
        --quiet
    log_ok "  IP range '$ALLOYDB_IP_RANGE' created"
fi

# Create private connection (or skip if it exists)
if gcloud services vpc-peerings list --network="$NETWORK_NAME" --project="$PROJECT_ID" 2>/dev/null | grep -q "servicenetworking.googleapis.com"; then
    log_ok "  VPC peering already exists"
else
    gcloud services vpc-peerings connect \
        --service=servicenetworking.googleapis.com \
        --ranges="$ALLOYDB_IP_RANGE" \
        --network="$NETWORK_NAME" \
        --project="$PROJECT_ID" \
        --quiet
    log_ok "  VPC peering created"
fi

# ---------------------------------------------------------------------------
# Step 3: Create AlloyDB Cluster
# ---------------------------------------------------------------------------
log_info "Step 3/6: Creating AlloyDB cluster '$CLUSTER_ID'..."

if gcloud alloydb clusters describe "$CLUSTER_ID" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    log_ok "  Cluster '$CLUSTER_ID' already exists"
else
    gcloud alloydb clusters create "$CLUSTER_ID" \
        --region="$REGION" \
        --password="$DB_PASSWORD" \
        --network="$NETWORK_NAME" \
        --project="$PROJECT_ID" \
        --quiet
    log_ok "  Cluster '$CLUSTER_ID' created"
fi

# ---------------------------------------------------------------------------
# Step 4: Create AlloyDB Primary Instance
# ---------------------------------------------------------------------------
log_info "Step 4/6: Creating AlloyDB primary instance '$INSTANCE_ID' (this takes ~5-10 min)..."

if gcloud alloydb instances describe "$INSTANCE_ID" --cluster="$CLUSTER_ID" --region="$REGION" --project="$PROJECT_ID" &>/dev/null; then
    log_ok "  Instance '$INSTANCE_ID' already exists"
else
    gcloud alloydb instances create "$INSTANCE_ID" \
        --cluster="$CLUSTER_ID" \
        --region="$REGION" \
        --instance-type=PRIMARY \
        --cpu-count=2 \
        --project="$PROJECT_ID" \
        --quiet
    log_ok "  Instance '$INSTANCE_ID' created"
fi

# ---------------------------------------------------------------------------
# Step 5: Get connection details
# ---------------------------------------------------------------------------
log_info "Step 5/6: Fetching connection details..."

ALLOYDB_IP=$(gcloud alloydb instances describe "$INSTANCE_ID" \
    --cluster="$CLUSTER_ID" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format="value(ipAddress)" 2>/dev/null)

if [ -z "$ALLOYDB_IP" ]; then
    log_warn "Could not fetch IP yet. Instance may still be provisioning."
    log_warn "Run this command later to get the IP:"
    echo "  gcloud alloydb instances describe $INSTANCE_ID --cluster=$CLUSTER_ID --region=$REGION --format='value(ipAddress)'"
else
    log_ok "  AlloyDB IP: $ALLOYDB_IP"
fi

# ---------------------------------------------------------------------------
# Step 6: Generate connection string and .env update
# ---------------------------------------------------------------------------
log_info "Step 6/6: Generating connection details..."

if [ -n "$ALLOYDB_IP" ]; then
    CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${ALLOYDB_IP}:5432/${DB_NAME}?schema=public"
    
    echo ""
    echo "======================================================"
    echo "  ✅ ALL RESOURCES PROVISIONED SUCCESSFULLY"
    echo "======================================================"
    echo ""
    echo "  Add this to your .env file:"
    echo ""
    echo "  DATABASE_URL=\"$CONNECTION_STRING\""
    echo ""
    echo "  AlloyDB IP:      $ALLOYDB_IP"
    echo "  Database:         $DB_NAME"
    echo "  User:             $DB_USER"
    echo "  Cluster:          $CLUSTER_ID"
    echo "  Region:           $REGION"
    echo ""
    echo "  ⚠️  Note: AlloyDB uses private IP. To connect from"
    echo "  outside GCP, you need the AlloyDB Auth Proxy:"
    echo "  https://cloud.google.com/alloydb/docs/auth-proxy/overview"
    echo ""
else
    echo ""
    echo "======================================================"
    echo "  ⏳ RESOURCES CREATED — WAITING FOR IP"
    echo "======================================================"
    echo ""
    echo "  Run this later to get connection details:"
    echo "  ./scripts/provision-gcp.sh  (re-run is safe, idempotent)"
    echo ""
fi
