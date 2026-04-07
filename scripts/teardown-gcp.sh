#!/bin/bash
# =============================================================================
# Teardown script — removes all GCP resources created by provision-gcp.sh
# Use with caution — this is destructive!
# =============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?❌ Set GCP_PROJECT_ID environment variable}"
REGION="${GCP_REGION:-us-central1}"
CLUSTER_ID="achievement-digest-cluster"
INSTANCE_ID="achievement-digest-primary"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${RED}======================================================"
echo "  ⚠️  TEARDOWN — This will DELETE all GCP resources"
echo "======================================================${NC}"
echo ""
echo "  Project:  $PROJECT_ID"
echo "  Cluster:  $CLUSTER_ID"
echo "  Instance: $INSTANCE_ID"
echo ""
read -p "Are you sure? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

gcloud config set project "$PROJECT_ID" --quiet

echo -e "${YELLOW}Deleting AlloyDB instance...${NC}"
gcloud alloydb instances delete "$INSTANCE_ID" \
    --cluster="$CLUSTER_ID" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --quiet 2>/dev/null && echo -e "${GREEN}✅ Instance deleted${NC}" || echo "Instance not found"

echo -e "${YELLOW}Deleting AlloyDB cluster...${NC}"
gcloud alloydb clusters delete "$CLUSTER_ID" \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --force \
    --quiet 2>/dev/null && echo -e "${GREEN}✅ Cluster deleted${NC}" || echo "Cluster not found"

echo ""
echo -e "${GREEN}✅ Teardown complete${NC}"
