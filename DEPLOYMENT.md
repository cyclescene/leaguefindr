# League Findr - Deployment Guide

This guide covers the complete CI/CD setup for League Findr using a monorepo architecture:
- **Frontend (Dashboard)**: Deployed via Vercel
- **Backend (API & Services)**: Deployed via GitHub Actions + OpenTofu → Cloud Run

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Git Push to main                          │
└────────────┬────────────────────────────┬────────────────────┘
             │                            │
      Changes to                   Changes to
      frontend/dashboard/**         backend/cmd/api/**
             │                            │
             ▼                            ▼
      Vercel Auto-Deploy          GitHub Actions Triggered
             │                            │
             ▼                            ▼
      Build & Deploy                Build Docker Image
      Next.js App                        │
             │                           ▼
             │                    Push to Artifact Registry
             │                           │
             │                           ▼
             │                    Run OpenTofu Apply
             │                    (uses GitHub Secrets)
             │                           │
             ▼                           ▼
      Dashboard Ready              Cloud Run Updated
      (Vercel URL)                 (Service URL)
```

## Prerequisites

### Local Development
1. **OpenTofu** - https://opentofu.org/docs/intro/install/
2. **Google Cloud SDK** - https://cloud.google.com/sdk/docs/install
3. **Docker** - https://docs.docker.com/get-docker/
4. **Go 1.23+** - https://golang.org/doc/install

### GitHub
1. GCP service account with permissions
2. GitHub secrets configured (see below)

## Initial Setup (One-Time)

### Step 1: Authenticate with GCP

```bash
cd backend
make init-backend
```

This will:
- Prompt you to login to Google Cloud
- Set project to `leaguefindr-dev`
- Configure Docker for Artifact Registry

### Step 2: Create Terraform State Bucket

```bash
make setup-state
```

This creates a GCS bucket for OpenTofu remote state with versioning enabled.

### Step 3: Create Artifact Registry

```bash
make setup-registry
```

This creates the Docker registry for storing container images.

## Local Development & Deployment

### Building the API Locally

```bash
cd backend/cmd/api

# Build Docker image only
make build

# Build and push to Artifact Registry
make push

# Full deployment: build, push, and deploy with OpenTofu
make deploy-all
```

### Before First Deployment

1. **Create `terraform.tfvars`:**
   ```bash
   cd backend/cmd/api/infra
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Edit with your secrets:**
   ```hcl
   supabase_url        = "https://your-project.supabase.co"
   supabase_anon_key   = "your-key"
   supabase_secret_key = "your-key"
   clerk_secret_key    = "your-key"
   ```

3. **Verify it's in .gitignore:**
   - `terraform.tfvars` should NOT be tracked by git ✓

### Verify Deployment

```bash
cd backend/cmd/api/infra

# Get service URL
tofu output service_url

# View Cloud Run logs
gcloud run logs read leaguefindr-api --region=us-west1 --limit=50
```

## Automated CI/CD Setup

### GitHub Secrets Configuration

Set these in your GitHub repository (Settings → Secrets and variables → Repository secrets):

**GCP Workload Identity Federation:**
```
WIF_PROVIDER       # Workload Identity Provider resource name
WIF_SERVICE_ACCOUNT # Service account email
```

**Supabase Configuration:**
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY
```

**Clerk Authentication:**
```
CLERK_SECRET_KEY
```

### Workflow Triggers

#### API Deployment (`.github/workflows/deploy-api.yml`)

**Automatic triggers:**
- Push to `main` with changes in:
  - `backend/cmd/api/**`
  - `backend/internal/**`
  - `backend/go.mod` or `backend/go.sum`
  - `.github/workflows/deploy-api.yml`

**Manual trigger:**
```bash
# Via GitHub UI: Actions → Deploy API → Run workflow
# Or via CLI:
gh workflow run deploy-api.yml --ref main
```

#### Dashboard Deployment (Vercel)

**Automatic:**
- Connected to `main` branch
- Vercel detects changes in `frontend/dashboard/**`
- Auto-builds and deploys

**Manual:**
- Trigger redeploy from Vercel dashboard

### Deployment Flow

When you push to `main`:

1. **If API code changed:**
   - GitHub Actions runs workflow
   - Builds Docker image
   - Runs tests & linting
   - Pushes image to Artifact Registry
   - Runs `tofu apply` with GitHub secrets
   - Cloud Run service updated
   - Logs deployment summary

2. **If Dashboard code changed:**
   - Vercel detects changes
   - Builds Next.js application
   - Deploys to Vercel edge network
   - Dashboard URL updated

3. **If both changed:**
   - Both deploy independently (parallel)

## Project Structure

```
leaguefindr/
├── .github/workflows/
│   └── deploy-api.yml                    ← CI/CD automation
│
├── frontend/
│   └── dashboard/
│       ├── package.json
│       ├── next.config.ts
│       └── [Next.js app]
│
├── backend/
│   ├── Makefile                          ← Setup targets
│   ├── go.mod
│   ├── go.sum
│   └── cmd/
│       └── api/
│           ├── Dockerfile                ← Container image
│           ├── Makefile                  ← Build & deploy
│           ├── main.go
│           ├── router.go
│           └── infra/
│               ├── versions.tf           ← Provider & backend
│               ├── variables.tf          ← Configuration variables
│               ├── main.tf               ← OpenTofu resources
│               ├── outputs.tf            ← Output values
│               ├── terraform.tfvars.example  ← Template (tracked)
│               └── terraform.tfvars      ← Local config (ignored)
│
└── infrastructure/
    └── modules/                          ← Reusable modules
        ├── cloud-run-service/
        ├── cloud-run-job/
        ├── service-account/
        ├── storage-bucket/
        ├── cloud-scheduler/
        ├── pubsub-trigger/
        ├── cloud-run-domain/
        └── eventarc-channel/
```

## Scaling to Other Services

To add another backend service (e.g., `db-backups`, `scraperv2`):

1. **Create service directory:**
   ```bash
   mkdir -p backend/cmd/your-service/infra
   ```

2. **Add Dockerfile and Makefile** (copy from API as template)

3. **Create OpenTofu config:**
   ```bash
   cp backend/cmd/api/infra/*.tf backend/cmd/your-service/infra/
   # Edit main.tf to reference correct modules/config
   ```

4. **Create GitHub Actions workflow:**
   ```bash
   cp .github/workflows/deploy-api.yml .github/workflows/deploy-your-service.yml
   # Update paths, service names, etc.
   ```

5. **Update service's terraform.tfvars:**
   ```bash
   cp backend/cmd/your-service/infra/terraform.tfvars.example \
      backend/cmd/your-service/infra/terraform.tfvars
   # Edit with service-specific configuration
   ```

## Troubleshooting

### OpenTofu State Lock

If state is locked:
```bash
cd backend/cmd/api/infra
tofu force-unlock <LOCK_ID>
```

### Docker Build Fails

Verify Dockerfile context:
```bash
cd backend/cmd/api
docker build -f Dockerfile ../../  # Context should be backend/ root
```

### GitHub Actions Secrets Not Found

Verify secrets are set in repository settings:
```bash
gh secret list
```

### Cloud Run Service Won't Start

Check logs:
```bash
gcloud run logs read leaguefindr-api --region=us-west1 --limit=100
```

Common issues:
- Missing environment variables (check GitHub Secrets match OpenTofu variables)
- Service account lacks permissions
- Image doesn't exist in Artifact Registry

### Authentication Issues

Verify Google Cloud authentication:
```bash
gcloud auth list
gcloud config get-value project
```

## Cost Management

### Monitoring

```bash
# View Cloud Run costs
gcloud run services describe leaguefindr-api --region=us-west1

# Check Artifact Registry storage
gsutil du -s gs://leaguefindr-dev-docker-repo
```

### Cost-Saving Tips

1. **Cloud Run scaling:**
   - `min_instances = 0` (scales to zero when idle)
   - `max_instances = 10` (prevents runaway costs)

2. **Docker image optimization:**
   - Multi-stage builds keep images small
   - Alpine Linux base image

3. **Storage cleanup:**
   - Configure lifecycle rules on GCS buckets
   - Delete old Docker images

## Monitoring & Logging

### View Deployment Logs

```bash
# GitHub Actions logs
gh run list --repo yourusername/leaguefindr
gh run view <RUN_ID> --log

# Cloud Run logs
gcloud run logs read leaguefindr-api --region=us-west1 --follow

# Dashboard logs (Vercel)
# Via Vercel dashboard → Settings → Deployments
```

## Rollback

### API Rollback

```bash
# Revert commit
git revert <COMMIT_SHA>
git push origin main

# GitHub Actions will auto-deploy previous version
# Or manually redeploy specific version:
cd backend/cmd/api/infra
tofu apply -var="image_tag=<PREVIOUS_SHA>"
```

### Dashboard Rollback

Via Vercel dashboard:
- Deployments → Select previous deployment → Promote to Production

## Next Steps

1. ✅ Set up GitHub Secrets (WIF provider, Supabase, Clerk)
2. ✅ Test local deployment with `make deploy-all`
3. ✅ Push to main and verify GitHub Actions workflow runs
4. ✅ Verify service URLs work
5. ✅ Set up monitoring and alerts
6. ✅ Scale to additional services (db-backups, scraperv2, etc.)

## References

- [OpenTofu Documentation](https://opentofu.org/docs/)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Documentation](https://vercel.com/docs)
- [Google Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
