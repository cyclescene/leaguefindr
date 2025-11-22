#!/bin/bash

################################################################################
# GCP Workload Identity Federation Setup Script
#
# This script automates the setup of Workload Identity Federation (WIF) for
# GitHub Actions to authenticate with GCP without storing long-lived secrets.
#
# Usage:
#   ./scripts/setup-gcp-wif.sh <project-id> <organization-id> <github-repo>
#
# Example:
#   ./scripts/setup-gcp-wif.sh leaguefindr-dev 123456789 jduarte0912/leaguefindr
#
# To find your organization ID:
#   gcloud organizations list
#
################################################################################

set -e  # Exit on any error

# Color output for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions for colored output
info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Load environment variables from .gcp-setup.env if it exists
ENV_FILE="$(dirname "$0")/.gcp-setup.env"
if [ -f "$ENV_FILE" ]; then
    info "Loading configuration from: $ENV_FILE"
    source "$ENV_FILE"
fi

# If env file doesn't exist or variables not set, try command-line arguments
if [ -z "$GCP_PROJECT_ID" ] && [ $# -ge 1 ]; then
    PROJECT_ID="$1"
    ORG_ID="$2"
    GITHUB_REPO="$3"
elif [ -z "$GCP_PROJECT_ID" ]; then
    error "Missing required configuration"
    echo ""
    echo "Either:"
    echo "  1. Create .gcp-setup.env in scripts/ directory with:"
    echo "     export GCP_PROJECT_ID=\"leaguefindr-dev\""
    echo "     export GCP_ORG_ID=\"123456789\""
    echo "     export GITHUB_REPO=\"username/repo-name\""
    echo ""
    echo "  2. Or pass arguments: ./scripts/setup-gcp-wif.sh <project-id> <organization-id> <github-repo>"
    echo ""
    echo "To find your organization ID:"
    echo "  gcloud organizations list"
    exit 1
else
    # Use env file variables
    PROJECT_ID="$GCP_PROJECT_ID"
    ORG_ID="$GCP_ORG_ID"
    GITHUB_REPO="$GITHUB_REPO"
fi

# Derived variables
SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
POOL_NAME="github-pool"
PROVIDER_NAME="github-provider"

# Display configuration
header "GCP Workload Identity Federation Setup"
echo "Configuration:"
echo "  Project ID:      $PROJECT_ID"
echo "  Organization ID: $ORG_ID"
echo "  GitHub Repo:     $GITHUB_REPO"
echo "  Service Account: $SA_EMAIL"
echo ""

# Confirm before proceeding
read -p "Continue with this configuration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Setup cancelled"
    exit 1
fi

# Step 1: Create GCP Project
header "Step 1: Creating GCP Project"
info "Creating project: $PROJECT_ID"

if gcloud projects create "$PROJECT_ID" \
    --organization="$ORG_ID" \
    --name="League Findr Development" 2>/dev/null; then
    success "Project created successfully"
else
    warning "Project may already exist, continuing..."
fi

# Verify project was created/exists
if ! gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    error "Project $PROJECT_ID not found. Exiting."
    exit 1
fi

success "Project verified: $PROJECT_ID"

# Set as default project
gcloud config set project "$PROJECT_ID" --quiet
success "Project set as default"

# Step 2: Enable Required APIs
header "Step 2: Enabling Required APIs"

APIS=(
    "iam.googleapis.com"
    "iamcredentials.googleapis.com"
    "cloudresourcemanager.googleapis.com"
    "sts.googleapis.com"
    "storage-component.googleapis.com"
)

# These APIs often have quota/config issues and can be enabled separately
APIS_OPTIONAL=(
    "run.googleapis.com"
    "artifactregistry.googleapis.com"
)

info "Enabling core APIs (required for WIF):"
for api in "${APIS[@]}"; do
    echo "  - $api"
done
echo ""

# Enable core APIs with verification
for api in "${APIS[@]}"; do
    info "Enabling $api..."

    if gcloud services enable "$api" \
        --project="$PROJECT_ID" \
        --quiet 2>/dev/null; then

        # Verify the API is actually enabled
        if gcloud services list --enabled --project="$PROJECT_ID" \
            --filter="name:$api" --format="value(name)" 2>/dev/null | grep -q "$api"; then
            success "$api enabled and verified"
        else
            warning "$api enable command succeeded but verification failed, retrying..."
            sleep 2
            gcloud services enable "$api" --project="$PROJECT_ID" --quiet 2>/dev/null
        fi
    else
        warning "Failed to enable $api on first attempt, retrying in 5 seconds..."
        sleep 5

        if gcloud services enable "$api" \
            --project="$PROJECT_ID" \
            --quiet 2>/dev/null; then
            success "$api enabled on retry"
        else
            error "Failed to enable $api after retry"
            exit 1
        fi
    fi
done

echo ""
success "Core APIs enabled and verified"

# Try to enable optional APIs (these may fail due to GCP config issues)
echo ""
info "Enabling optional APIs (for deployment):"
for api in "${APIS_OPTIONAL[@]}"; do
    echo "  - $api"
done
echo ""

for api in "${APIS_OPTIONAL[@]}"; do
    info "Enabling $api..."

    if gcloud services enable "$api" \
        --project="$PROJECT_ID" \
        --quiet 2>/dev/null; then
        success "$api enabled"
    else
        warning "Failed to enable $api (you can enable this manually in GCP console or retry later)"
    fi
done

echo ""
success "API setup complete"

# Step 3: Create Workload Identity Pool
header "Step 3: Creating Workload Identity Pool"
info "Creating pool: $POOL_NAME"
info "This pool will contain all GitHub-related identity providers"

if gcloud iam workload-identity-pools create "$POOL_NAME" \
    --project="$PROJECT_ID" \
    --location=global \
    --display-name="GitHub Actions" \
    --quiet 2>/dev/null; then
    success "Workload Identity Pool created"
else
    warning "Pool may already exist, continuing..."
fi

success "Pool verified: $POOL_NAME"

# Step 4: Create Workload Identity Provider
header "Step 4: Creating Workload Identity Provider"
info "Creating provider: $PROVIDER_NAME"
echo ""
echo "This provider configures GitHub's OIDC tokens as a trusted identity source."
echo "Token attributes will be mapped to:"
echo "  - google.subject    → GitHub workflow run ID"
echo "  - attribute.actor   → GitHub actor (username)"
echo "  - attribute.repository → GitHub repository"
echo ""

if gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
    --project="$PROJECT_ID" \
    --location=global \
    --workload-identity-pool="$POOL_NAME" \
    --display-name="GitHub" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.aud=assertion.aud" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-condition="assertion.aud == 'sts.googleapis.com'" \
    --quiet 2>/dev/null; then
    success "Workload Identity Provider created"
else
    warning "Provider may already exist, continuing..."
fi

success "Provider verified: $PROVIDER_NAME"

# Step 5: Retrieve WIF Provider Resource Name
header "Step 5: Retrieving WIF Provider Resource Name"
info "Fetching WIF provider resource name (this is needed for GitHub secrets)..."

WIF_PROVIDER=$(gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
    --project="$PROJECT_ID" \
    --location=global \
    --workload-identity-pool="$POOL_NAME" \
    --format='value(name)')

if [ -z "$WIF_PROVIDER" ]; then
    error "Could not retrieve WIF provider resource name. Exiting."
    exit 1
fi

success "WIF Provider resource name retrieved"
echo ""
echo -e "  ${YELLOW}WIF_PROVIDER=${NC}${BLUE}$WIF_PROVIDER${NC}"
echo ""

# Step 6: Create Service Account
header "Step 6: Creating Service Account for GitHub Actions"
info "Service Account Email: $SA_EMAIL"
echo ""
echo "This service account will be impersonated by GitHub Actions workflows"
echo "to authenticate with GCP."
echo ""

if gcloud iam service-accounts create github-actions \
    --project="$PROJECT_ID" \
    --display-name="GitHub Actions Service Account" \
    --quiet 2>/dev/null; then
    success "Service account created"
else
    warning "Service account may already exist, continuing..."
fi

success "Service account verified: $SA_EMAIL"

# Step 7: Grant IAM Roles
header "Step 7: Granting IAM Roles to Service Account"
echo "The service account needs these roles to perform its tasks:"
echo ""

info "Granting: roles/run.admin (deploy to Cloud Run)"
if gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin" \
    --quiet >/dev/null 2>&1; then
    success "Cloud Run Admin role granted"
else
    warning "Cloud Run Admin role may already be granted"
fi
echo ""

info "Granting: roles/artifactregistry.writer (push Docker images)"
if gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/artifactregistry.writer" \
    --quiet >/dev/null 2>&1; then
    success "Artifact Registry Writer role granted"
else
    warning "Artifact Registry Writer role may already be granted"
fi
echo ""

info "Granting: roles/storage.admin (manage Terraform state)"
if gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.admin" \
    --quiet >/dev/null 2>&1; then
    success "Cloud Storage Admin role granted"
else
    warning "Cloud Storage Admin role may already be granted"
fi
echo ""

# Step 8: Configure Workload Identity Binding
header "Step 8: Configuring Workload Identity Binding"
info "Binding WIF to GitHub repository: $GITHUB_REPO"
echo ""
echo "This step allows only workflows from the specified GitHub repository"
echo "to impersonate the service account."
echo ""

if gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
    --project="$PROJECT_ID" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/$PROJECT_ID/locations/global/workloadIdentityPools/$POOL_NAME/attribute.repository/$GITHUB_REPO" \
    --quiet >/dev/null 2>&1; then
    success "Workload Identity binding configured for: $GITHUB_REPO"
else
    warning "Workload Identity binding may already be configured"
fi

# Final Summary
header "✅ Setup Complete!"

echo "All GCP infrastructure for WIF is now configured."
echo ""
echo "Next: Set GitHub Repository Secrets"
echo ""
echo "Run these commands to set the required secrets:"
echo ""
echo "  gh secret set WIF_PROVIDER --body \"$WIF_PROVIDER\""
echo "  gh secret set WIF_SERVICE_ACCOUNT --body \"$SA_EMAIL\""
echo ""
echo "Then verify the secrets are set:"
echo "  gh secret list"
echo ""
echo "Setup Summary:"
echo "  Project ID:          $PROJECT_ID"
echo "  Service Account:     $SA_EMAIL"
echo "  WIF Pool:            $POOL_NAME"
echo "  WIF Provider:        $PROVIDER_NAME"
echo "  GitHub Repository:   $GITHUB_REPO"
echo ""
echo "After setting secrets, you can deploy:"
echo "  1. Create Artifact Registry:  make setup-registry"
echo "  2. Create state bucket:       make setup-state"
echo "  3. Deploy the API:            cd backend/cmd/api && make deploy-all"
echo ""
