PROJECT_ID := leaguefindr-dev
REGION := us-west1
REPO_NAME := leaguefindr

.PHONY: help setup-registry init-backend clean destroy-registry

help:
	@echo "League Findr Backend Makefile"
	@echo "=============================="
	@echo ""
	@echo "Registry & Setup:"
	@echo "  make setup-registry    - Create Artifact Registry (must run once)"
	@echo "  make init-backend      - Initialize backend setup (gcloud auth, etc.)"
	@echo "  make destroy-registry  - Destroy Artifact Registry"
	@echo ""
	@echo "Service Deployment:"
	@echo "  make api-deploy        - Deploy API service"
	@echo "  make api-build         - Build API Docker image"
	@echo "  make api-push          - Push API image to registry"
	@echo ""
	@echo "Utilities:"
	@echo "  make list-images       - List all images in registry"
	@echo "  make clean             - Clean up local artifacts"

# Initialize gcloud and authenticate
init-backend:
	@echo "Initializing backend setup..."
	@echo "Authenticating with GCP..."
	gcloud auth login
	gcloud config set project $(PROJECT_ID)
	@echo "Configuring Docker for Artifact Registry..."
	gcloud auth configure-docker $(REGION)-docker.pkg.dev --quiet
	@echo "✓ Backend initialized!"

# Create Artifact Registry repository
setup-registry:
	@echo "Creating Artifact Registry repository..."
	@echo "Project: $(PROJECT_ID)"
	@echo "Region: $(REGION)"
	@echo "Repository: $(REPO_NAME)"
	gcloud artifacts repositories create $(REPO_NAME) \
		--project=$(PROJECT_ID) \
		--repository-format=docker \
		--location=$(REGION) \
		--description="Docker registry for leaguefindr services" \
		--labels=managed-by=manual,project=leaguefindr || \
		echo "Repository may already exist. Continuing..."
	@echo "✓ Artifact Registry created!"
	@echo ""
	@echo "Registry URL: $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(REPO_NAME)"

# Destroy Artifact Registry repository
destroy-registry:
	@echo "⚠️  Destroying Artifact Registry repository..."
	@echo "Project: $(PROJECT_ID)"
	@echo "Repository: $(REPO_NAME)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		gcloud artifacts repositories delete $(REPO_NAME) \
			--project=$(PROJECT_ID) \
			--location=$(REGION) \
			--quiet; \
		echo "✓ Repository deleted!"; \
	else \
		echo "Cancelled."; \
	fi

# List all images in the registry
list-images:
	@echo "Images in $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(REPO_NAME):"
	gcloud artifacts docker images list \
		$(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(REPO_NAME) \
		--project=$(PROJECT_ID)

# Deploy API service
api-deploy:
	@echo "Deploying API service..."
	cd cmd/api && make deploy-all

# Build API Docker image
api-build:
	@echo "Building API Docker image..."
	cd cmd/api && make build

# Push API image to registry
api-push:
	@echo "Pushing API image to registry..."
	cd cmd/api && make push

# Clean up local artifacts
clean:
	@echo "Cleaning up local artifacts..."
	cd cmd/api && make clean
	@echo "✓ Cleaned!"

.PHONY: help setup-registry init-backend destroy-registry list-images api-deploy api-build api-push clean
