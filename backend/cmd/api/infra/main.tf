# Get the artifact registry repository URL from root infrastructure
# This will be created when you run: tofu apply in the infrastructure directory
locals {
  artifact_registry_url = "${var.region}-docker.pkg.dev/${var.project_id}/leaguefindr"
  image_url             = "${local.artifact_registry_url}/api:${var.image_tag}"
}

# Create service account for the API
module "api_service_account" {
  source = "../../../../infrastructure/modules/service-account"

  account_id   = "leaguefindr-api"
  display_name = "League Findr API Service Account"
  description  = "Service account for League Findr API Cloud Run service"
  project_id   = var.project_id

  roles = [
    "roles/storage.objectCreator",
    "roles/storage.objectViewer",
    "roles/iam.serviceAccountTokenCreator",
  ]
}

# Create Cloud Run service
module "api_service" {
  source = "../../../../infrastructure/modules/cloud-run-service"

  service_name          = var.service_name
  region                = var.region
  image                 = local.image_url
  service_account_email = module.api_service_account.email

  env_vars = {
    ENV                      = var.env
    SUPABASE_URL             = var.supabase_url
    SUPABASE_ANON_KEY        = var.supabase_anon_key
    SUPABASE_SECRET_KEY      = var.supabase_secret_key
    CLERK_SECRET_KEY         = var.clerk_secret_key
    SKIP_EMAIL_VERIFICATION  = var.skip_email_verification ? "true" : "false"
    PROJECT_ID              = var.project_id
  }

  container_port        = var.container_port
  cpu_limit             = var.cpu_limit
  memory_limit          = var.memory_limit
  min_instances         = var.min_instances
  max_instances         = var.max_instances
  timeout               = "${var.timeout_seconds}s"
  allow_unauthenticated = var.allow_unauthenticated
  labels                = var.labels

  depends_on = [module.api_service_account]
}
