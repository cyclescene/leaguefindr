output "service_url" {
  description = "URL of the deployed Cloud Run service"
  value       = module.api_service.service_url
}

output "service_name" {
  description = "Name of the Cloud Run service"
  value       = module.api_service.service_name
}

output "service_account_email" {
  description = "Email of the service account used by the API"
  value       = module.api_service_account.email
}

output "artifact_registry_url" {
  description = "Artifact Registry URL for pushing Docker images"
  value       = local.artifact_registry_url
}
