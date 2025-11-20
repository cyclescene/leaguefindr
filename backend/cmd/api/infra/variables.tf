variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "leaguefindr-dev"
}

variable "region" {
  description = "GCP region for resources (california)"
  type        = string
  default     = "us-west1"
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "leaguefindr-api"
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "container_port" {
  description = "Port the API listens on"
  type        = number
  default     = 8080
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 10
}

variable "cpu_limit" {
  description = "CPU limit per instance"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit per instance"
  type        = string
  default     = "512Mi"
}

variable "timeout_seconds" {
  description = "Request timeout in seconds"
  type        = number
  default     = 300
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated access to the API"
  type        = bool
  default     = true
}

# Supabase configuration
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "supabase_secret_key" {
  description = "Supabase secret key"
  type        = string
  sensitive   = true
}

# Clerk Auth configuration
variable "clerk_secret_key" {
  description = "Clerk secret key for authentication"
  type        = string
  sensitive   = true
}

variable "env" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "skip_email_verification" {
  description = "Skip email verification in auth flow"
  type        = bool
  default     = true
}

variable "labels" {
  description = "Labels to apply to Cloud Run service"
  type        = map(string)
  default = {
    app         = "leaguefindr"
    service     = "api"
    environment = "dev"
    managed-by  = "opentofu"
  }
}
