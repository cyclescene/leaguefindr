terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }

  # Configure remote state storage in GCS
  backend "gcs" {
    bucket = "leaguefindr-terraform-state"
    prefix = "services/api"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}
