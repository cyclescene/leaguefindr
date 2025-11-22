#!/bin/bash

################################################################################
# GCP Workload Identity Federation Setup Script
#
# This script automates the setup of Workload Identity Federation (WIF) for
# GitHub Actions to authenticate with GCP without storing long-lived secrets.
# It supports multiple services with their own service accounts and IAM roles.
#
# Usage:
#   ./scripts/setup-gcp-wif.sh <project-id> <organization-id> <github-repo> [service-name] [region]
#
# Examples:
#   # Initial setup (creates base infrastructure)
#   ./scripts/setup-gcp-wif.sh leaguefindr 123456789 cyclescene/leaguefindr
#
#   # Add API service
#   ./scripts/setup-gcp-wif.sh leaguefindr 123456789 cyclescene/leaguefindr api us-west1
#
#   # Add frontend service
#   ./scripts/setup-gcp-wif.sh leaguefindr 123456789 cyclescene/leaguefindr frontend us-west1
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

# Parse arguments
if [ -z "$GCP_PROJECT_ID" ] && [ $# -ge 1 ]; then
    PROJECT_ID="$1"
    ORG_ID="$2"
    GITHUB_REPO="$3"
    SERVICE_NAME="${4:-}"
    REGION="${5:-us-west1}"
elif [ -z "$GCP_PROJECT_ID" ]; then
    error "Missing required configuration"
    echo ""
    echo "Either:"
    echo "  1. Create .gcp-setup.env in scripts/ directory with:"
    echo "     export GCP_PROJECT_ID=\"leaguefindr\""
    echo "     export GCP_ORG_ID=\"123456789\""
    echo "     export GITHUB_REPO=\"username/repo-name\""
    echo ""
    echo "  2. Or pass arguments: ./scripts/setup-gcp-wif.sh <project-id> <org-id> <github-repo> [service-name] [region]"
    echo ""
    echo "To find your organization ID:"
    echo "  gcloud organizations list"
    exit 1
else
    PROJECT_ID="$GCP_PROJECT_ID"
    ORG_ID="$GCP_ORG_ID"
    GITHUB_REPO="$GITHUB_REPO"
    SERVICE_NAME="${4:-}"
    REGION="${5:-us-west1}"
fi

# Determine setup mode
POOL_NAME="github-pool"
PROVIDER_NAME="github-provider"

if [ -z "$SERVICE_NAME" ]; then
    SETUP_MODE="initial"
    SA_NAME="github-actions"
    SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
else
    SETUP_MODE="service"
    SA_NAME="${SERVICE_NAME}-leaguefindr"
    SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
fi

# Display configuration
if [ "$SETUP_MODE" = "initial" ]; then
    header "GCP Workload Identity Federation - Initial Setup"
else
    header "GCP Workload Identity Federation - Service Setup"
fi

echo "Configuration:"
echo "  Project ID:      $PROJECT_ID"
if [ "$SETUP_MODE" = "initial" ]; then
    echo "  Organization ID: $ORG_ID"
fi
echo "  GitHub Repo:     $GITHUB_REPO"
echo "  Service Account: $SA_EMAIL"
if [ "$SETUP_MODE" = "service" ]; then
    echo "  Region:          $REGION"
fi
echo ""

# Confirm before proceeding
read -p "Continue with this configuration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    error "Setup cancelled"
    exit 1
fi

# Set project as default
gcloud config set project "$PROJECT_ID" --quiet 2>/dev/null || true

# ============================================================================
# Initial Setup Steps (only in initial mode)
# ============================================================================

if [ "$SETUP_MODE" = "initial" ]; then

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

    if ! gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        error "Project $PROJECT_ID not found. Exiting."
        exit 1
    fi

    success "Project verified: $PROJECT_ID"
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

    APIS_OPTIONAL=(
        "run.googleapis.com"
        "artifactregistry.googleapis.com"
    )

    info "Enabling core APIs (required for WIF):"
    for api in "${APIS[@]}"; do
        echo "  - $api"
    done
    echo ""

    for api in "${APIS[@]}"; do
        info "Enabling $api..."

        if gcloud services enable "$api" \
            --project="$PROJECT_ID" \
            --quiet 2>/dev/null; then

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
            warning "Failed to enable $api (you can enable this manually in GCP console)"
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
    info "Fetching WIF provider resource name (needed for GitHub secrets)..."

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

fi

# ============================================================================
# Service Account Setup (both initial and service modes)
# ============================================================================

# Step N: Create Service Account
if [ "$SETUP_MODE" = "initial" ]; then
    header "Step 6: Creating Service Account for GitHub Actions"
else
    header "Step 1: Creating Service Account for $SERVICE_NAME"
fi

info "Service Account: $SA_EMAIL"
echo ""

if [ "$SETUP_MODE" = "service" ]; then
    echo "This service account will be used by GitHub Actions for $SERVICE_NAME deployments."
else
    echo "This service account will be impersonated by GitHub Actions workflows"
    echo "to authenticate with GCP."
fi
echo ""

if gcloud iam service-accounts create "$SA_NAME" \
    --project="$PROJECT_ID" \
    --display-name="$SERVICE_NAME Service Account (League Findr)" \
    --quiet 2>/dev/null; then
    success "Service account created"
else
    warning "Service account may already exist, continuing..."
fi

success "Service account verified: $SA_EMAIL"

# ============================================================================
# Grant IAM Roles (service-specific)
# ============================================================================

if [ "$SETUP_MODE" = "initial" ]; then
    header "Step 7: Granting IAM Roles to Service Account"

    echo "The github-actions service account needs these roles:"
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

    info "Granting: roles/artifactregistry.repositories.get"
    if gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/artifactregistry.repositories.get" \
        --quiet >/dev/null 2>&1; then
        success "Artifact Registry Get role granted"
    else
        warning "Artifact Registry Get role may already be granted"
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

    info "Granting: roles/iam.serviceAccountAdmin (manage service accounts)"
    if gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/iam.serviceAccountAdmin" \
        --quiet >/dev/null 2>&1; then
        success "Service Account Admin role granted"
    else
        warning "Service Account Admin role may already be granted"
    fi
    echo ""

    info "Granting: roles/iam.securityAdmin (manage IAM policies)"
    if gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="roles/iam.securityAdmin" \
        --quiet >/dev/null 2>&1; then
        success "Security Admin role granted"
    else
        warning "Security Admin role may already be granted"
    fi
    echo ""

else
    # Service-specific setup
    header "Step 2: Granting IAM Roles to $SERVICE_NAME Service Account"

    echo "Based on service type: $SERVICE_NAME"
    echo ""

    case "$SERVICE_NAME" in
        api)
            info "Granting Cloud Run Admin role"
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="roles/run.admin" \
                --quiet >/dev/null 2>&1 || true
            success "Cloud Run Admin role granted"

            info "Granting Artifact Registry Writer role"
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="roles/artifactregistry.writer" \
                --quiet >/dev/null 2>&1 || true
            success "Artifact Registry Writer role granted"

            info "Granting Storage Object Creator role"
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="roles/storage.objectCreator" \
                --quiet >/dev/null 2>&1 || true
            success "Storage Object Creator role granted"
            ;;
        web|frontend)
            info "Granting Cloud Run Admin role"
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="roles/run.admin" \
                --quiet >/dev/null 2>&1 || true
            success "Cloud Run Admin role granted"

            info "Granting Artifact Registry Writer role"
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="roles/artifactregistry.writer" \
                --quiet >/dev/null 2>&1 || true
            success "Artifact Registry Writer role granted"
            ;;
        worker)
            info "Granting Cloud Run Admin role"
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="roles/run.admin" \
                --quiet >/dev/null 2>&1 || true
            success "Cloud Run Admin role granted"

            info "Granting Cloud Tasks role"
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="roles/cloudtasks.enqueuer" \
                --quiet >/dev/null 2>&1 || true
            success "Cloud Tasks Enqueuer role granted"
            ;;
        *)
            warning "Unknown service type: $SERVICE_NAME"
            info "Granting basic roles (Cloud Run Admin and Artifact Registry Writer)"
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="roles/run.admin" \
                --quiet >/dev/null 2>&1 || true
            gcloud projects add-iam-policy-binding "$PROJECT_ID" \
                --member="serviceAccount:$SA_EMAIL" \
                --role="roles/artifactregistry.writer" \
                --quiet >/dev/null 2>&1 || true
            ;;
    esac
    echo ""

fi

# ============================================================================
# Workload Identity Binding
# ============================================================================

if [ "$SETUP_MODE" = "initial" ]; then
    header "Step 8: Configuring Workload Identity Binding"
else
    header "Step 3: Configuring Workload Identity Binding"
fi

info "Binding WIF to GitHub repository: $GITHUB_REPO"
echo ""
echo "This allows workflows from the specified GitHub repository"
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

# If this is a service-specific setup, also grant github-actions permission to use this service account
if [ "$SETUP_MODE" = "service" ]; then
    echo ""
    info "Granting github-actions service account permission to use $SA_NAME"

    if gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
        --project="$PROJECT_ID" \
        --role="roles/iam.serviceAccountUser" \
        --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
        --quiet >/dev/null 2>&1; then
        success "github-actions can now use $SA_NAME"
    else
        warning "Permission may already be granted"
    fi
fi

# ============================================================================
# Summary
# ============================================================================

header "✅ Setup Complete!"

if [ "$SETUP_MODE" = "initial" ]; then
    echo "All GCP infrastructure for WIF is now configured."
    echo ""
    echo "Next Steps:"
    echo ""
    echo "1. Set GitHub Repository Secrets:"
    echo ""
    echo "   gh secret set WIF_PROVIDER --body \"$WIF_PROVIDER\""
    echo "   gh secret set WIF_SERVICE_ACCOUNT --body \"$SA_EMAIL\""
    echo ""
    echo "2. Then verify the secrets are set:"
    echo "   gh secret list"
    echo ""
    echo "3. To add additional services, run:"
    echo "   ./scripts/setup-gcp-wif.sh $PROJECT_ID $ORG_ID $GITHUB_REPO api us-west1"
    echo "   ./scripts/setup-gcp-wif.sh $PROJECT_ID $ORG_ID $GITHUB_REPO web us-west1"
    echo ""
    echo "Setup Summary:"
    echo "  Project ID:          $PROJECT_ID"
    echo "  Service Account:     $SA_EMAIL"
    echo "  WIF Pool:            $POOL_NAME"
    echo "  WIF Provider:        $PROVIDER_NAME"
    echo "  GitHub Repository:   $GITHUB_REPO"
    echo ""
else
    echo "$SERVICE_NAME service account is now configured."
    echo ""
    echo "Service Details:"
    echo "  Service Name:    $SERVICE_NAME"
    echo "  Service Account: $SA_EMAIL"
    echo "  Region:          $REGION"
    echo ""
    echo "The $SERVICE_NAME service account can now be used by workflows."
    echo "Update your GitHub Actions workflow to use this service account if needed."
    echo ""
fi
