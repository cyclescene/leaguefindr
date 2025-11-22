# Deployment Setup Checklist

Use this checklist to ensure your CI/CD pipeline is properly configured.

## Local Setup

- [ ] OpenTofu installed: `tofu version`
- [ ] Google Cloud SDK installed: `gcloud version`
- [ ] Docker installed: `docker --version`
- [ ] Go 1.23+ installed: `go version`
- [ ] In `backend/` directory: `make init-backend`
- [ ] State bucket created: `make setup-state`
- [ ] Docker registry created: `make setup-registry`

## GitHub Repository Secrets

Configure these in GitHub: Settings → Secrets and variables → Repository secrets

**Workload Identity Federation (for GCP access):**
- [ ] `WIF_PROVIDER` - Your WIF provider resource name
- [ ] `WIF_SERVICE_ACCOUNT` - Service account email for GCP

**Supabase Configuration:**
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SECRET_KEY` - Supabase secret key

**Clerk Authentication:**
- [ ] `CLERK_SECRET_KEY` - Your Clerk secret key

## API Service Configuration

- [ ] Created `backend/cmd/api/infra/terraform.tfvars` from `.example`
- [ ] Filled in Supabase URL and keys
- [ ] Filled in Clerk secret key
- [ ] Verified `terraform.tfvars` is git-ignored (in .gitignore)
- [ ] Verified backend state bucket is created: `gsutil ls -b gs://leaguefindr-dev-terraform-state`

## GitHub Actions Workflow

- [ ] `.github/workflows/deploy-api.yml` exists
- [ ] Workflow file has correct paths and environment variables
- [ ] Tested manual workflow dispatch: Actions → Deploy API → Run workflow

## Local Testing

- [ ] Built API locally: `cd backend/cmd/api && make build`
- [ ] Pushed image to registry: `make push`
- [ ] Deployed with OpenTofu: `make deploy`
- [ ] Service deployed successfully to Cloud Run
- [ ] Can access service via URL from `tofu output service_url`

## Dashboard Setup (Vercel)

- [ ] Repository connected to Vercel
- [ ] Root directory set to `frontend/dashboard`
- [ ] Vercel deployed dashboard successfully
- [ ] Auto-deployments enabled for `main` branch

## Verification

### Local Deployment
```bash
cd backend/cmd/api

# Build and deploy
make deploy-all

# Verify
cd infra
tofu output service_url

# Test the endpoint
curl $(tofu output -raw service_url)
```

### GitHub Actions Deployment
```bash
# Push a test change to main
echo "# Test" >> backend/cmd/api/main.go

# Verify workflow runs
gh workflow run deploy-api.yml --ref main

# Monitor
gh run watch

# Check service deployed
gcloud run services describe leaguefindr-api --region=us-west1
```

### Check Terraform State

```bash
# Verify state file in bucket
gsutil ls gs://leaguefindr-dev-terraform-state/services/api/

# Verify service was created
gcloud run services list --region=us-west1
```

## Common Setup Issues

### "Backend initialization required"
**Solution:** Run `tofu init` in the infra directory
```bash
cd backend/cmd/api/infra
tofu init
```

### "Service account lacks permissions"
**Solution:** Update GitHub secret `WIF_SERVICE_ACCOUNT` to a service account with Cloud Run permissions:
```bash
gcloud iam roles describe roles/run.admin
```

### "Docker image not found in Artifact Registry"
**Solution:** Verify image was pushed:
```bash
gcloud artifacts docker images list us-west1-docker.pkg.dev/leaguefindr-dev/leaguefindr
```

### "terraform.tfvars not being used"
**Solution:** Verify it exists in the infra directory:
```bash
ls -la backend/cmd/api/infra/terraform.tfvars
```

### GitHub Actions workflow not triggering
**Solution:** Check the path filters in `.github/workflows/deploy-api.yml`
```bash
# Verify paths are correct
git log --name-only -1  # Should show backend/cmd/api changes
```

## Monitoring After Deployment

### Cloud Run Logs
```bash
gcloud run logs read leaguefindr-api --region=us-west1 --follow
```

### Terraform State
```bash
cd backend/cmd/api/infra
tofu show  # See current infrastructure state
```

### Service Status
```bash
gcloud run services describe leaguefindr-api --region=us-west1
```

### Artifact Registry
```bash
gcloud artifacts docker images list us-west1-docker.pkg.dev/leaguefindr-dev/leaguefindr/api
```

## Next: Adding Another Backend Service

To deploy another service (e.g., `db-backups`):

- [ ] Create `backend/cmd/db-backups/infra/` directory
- [ ] Copy OpenTofu files from API as template
- [ ] Create `backend/cmd/db-backups/Dockerfile`
- [ ] Create `backend/cmd/db-backups/Makefile`
- [ ] Create `backend/cmd/db-backups/main.go`
- [ ] Create `.github/workflows/deploy-db-backups.yml`
- [ ] Test local deployment: `cd backend/cmd/db-backups && make deploy-all`
- [ ] Push to main and verify GitHub Actions runs

## Support

For issues with:
- **OpenTofu**: https://opentofu.org/docs/
- **Cloud Run**: https://cloud.google.com/run/docs
- **GitHub Actions**: https://docs.github.com/en/actions/quickstart
- **Vercel**: https://vercel.com/docs

---

**Checklist Complete?** You're ready for production! 🚀
