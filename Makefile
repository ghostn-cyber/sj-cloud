# Makefile for SJ Cloud Platform Ingress Layer & Service Mesh Foundation
export NODE_PATH=platform/service-mesh/node_modules

.PHONY: init network deploy validate lint test benchmark restart logs status destroy all \
        registry discovery health routing retry validate-services service-status service-test mesh mesh-test \
        validate-runtime tenant tenant-test tenant-validate tenant-create tenant-delete tenant-status tenant-list tenant-logs tenant-metrics tenant-rollback \
        reconcile tenant-audit tenant-queue

INFRA_DIR=infrastructure
SCRIPTS_DIR=$(INFRA_DIR)/scripts
TESTS_DIR=$(INFRA_DIR)/tests

all: init validate validate-services deploy mesh test

init:
	@echo "=== Initializing Environment ==="
	@if [ ! -f $(INFRA_DIR)/.env ]; then \
		cp $(INFRA_DIR)/.env.example $(INFRA_DIR)/.env; \
		echo "✅ Copied .env.example to .env"; \
	else \
		echo "✅ .env file already exists"; \
	fi

network:
	@echo "=== Creating Network Foundation ==="
	@bash $(SCRIPTS_DIR)/setup-networks.sh

deploy: network
	@echo "=== Deploying Ingress Stack ==="
	@cd $(INFRA_DIR) && docker compose --env-file .env -f compose/10-traefik.yml up -d --build
	@echo "Waiting for stack to spin up..."
	@sleep 3

validate:
	@echo "=== Running Ingress Configuration Validation ==="
	@bash $(SCRIPTS_DIR)/validate-config.sh

validate-services:
	@echo "=== Running Service Mesh Configuration Validation ==="
	@bash $(SCRIPTS_DIR)/validate-registry.sh

registry: validate-services

discovery:
	@echo "=== Running DNS Discovery Tests ==="
	@bash $(TESTS_DIR)/discovery/dns.sh

health:
	@echo "=== Running Health Monitoring Tests ==="
	@bash $(TESTS_DIR)/discovery/health.sh

routing:
	@echo "=== Running Proxy Routing Tests ==="
	@bash $(TESTS_DIR)/discovery/routing.sh

retry:
	@echo "=== Running Proxy Retry Tests ==="
	@bash $(TESTS_DIR)/discovery/retry.sh

service-status:
	@echo "=== Service Mesh Registry Status ==="
	@docker exec sj-billing node -e "const http = require('http'); http.get('http://registry-api:8080/services', (res) => { let body = ''; res.on('data', c => body += c); res.on('end', () => { const list = JSON.parse(body); console.table(list.map(s => ({ ID: s.id, Name: s.name, Status: s.status, Network: s.network, Port: s.kubernetes.port }))); }); });" 2>/dev/null || echo "❌ Service registry is not running."

service-test:
	@echo "=== Testing Mock Service Ping ==="
	@docker exec sj-billing curl -s http://sj-auth:80/health || echo "❌ Service ping failed."

mesh: network validate-services
	@echo "=== Deploying Service Mesh Stack ==="
	@cd $(INFRA_DIR) && docker compose --env-file .env -f compose/20-mesh.yml up -d --build
	@echo "Waiting for service mesh stack to spin up..."
	@sleep 5

mesh-test:
	@echo "=== Running Service Mesh Integration Tests ==="
	@docker restart sj-mesh-proxy sj-auth >/dev/null && sleep 1
	@bash $(TESTS_DIR)/discovery/registry.sh
	@bash $(TESTS_DIR)/discovery/dns.sh
	@bash $(TESTS_DIR)/discovery/health.sh
	@bash $(TESTS_DIR)/discovery/routing.sh
	@bash $(TESTS_DIR)/discovery/telemetry.sh
	@bash $(TESTS_DIR)/discovery/timeouts.sh
	@bash $(TESTS_DIR)/discovery/retry.sh
	@bash $(TESTS_DIR)/discovery/circuit-breaker.sh
	@echo "✅ All service mesh integration tests passed successfully!"

lint: validate validate-services
	@echo "✅ Configuration linting passed."

validate-runtime:
	@echo "=== Running Runtime Governance Validation ==="
	@node infrastructure/tests/validation/runtime-validation.js

governance-test: validate-runtime
	@echo "=== Running Runtime Governance Integration Tests ==="
	@node infrastructure/tests/discovery/governance.js

test:
	@echo "=== Running Runtime Ingress Validation ==="
	@bash $(SCRIPTS_DIR)/validate-traefik.sh
	@$(MAKE) governance-test
	@$(MAKE) mesh-test

benchmark:
	@echo "=== Running Performance Baselines ==="
	@bash $(TESTS_DIR)/performance/baseline.sh

restart:
	@echo "=== Restarting Stack ==="
	@cd $(INFRA_DIR) && docker compose --env-file .env -f compose/10-traefik.yml restart
	@cd $(INFRA_DIR) && docker compose --env-file .env -f compose/20-mesh.yml restart

logs:
	@echo "=== Showing Live Service Mesh Logs ==="
	@cd $(INFRA_DIR) && docker compose --env-file .env -f compose/20-mesh.yml logs -f --tail 100

status:
	@echo "=== Stack Status ==="
	@cd $(INFRA_DIR) && docker compose --env-file .env -f compose/10-traefik.yml ps
	@cd $(INFRA_DIR) && docker compose --env-file .env -f compose/20-mesh.yml ps

destroy:
	@echo "=== Destroying Ingress and Service Mesh Stacks ==="
	@cd $(INFRA_DIR) && docker compose --env-file .env -f compose/20-mesh.yml down 2>/dev/null || true
	@cd $(INFRA_DIR) && docker compose --env-file .env -f compose/10-traefik.yml down 2>/dev/null || true
	@echo "Removing platform networks..."
	@docker network rm sj-edge sj-proxy sj-services sj-data sj-monitoring sj-backup 2>/dev/null || true
	@echo "Clean up complete."

# Tenant Lifecycle Management
tenant: tenant-validate tenant-test
	@echo "=== Tenant Lifecycle Subsystem Ready ==="

tenant-test:
	@echo "=== Running Tenant Lifecycle Integration Tests ==="
	@bash $(TESTS_DIR)/validation/validate-tenants.sh
	@bash $(TESTS_DIR)/validation/validate-lifecycle.sh
	@bash $(TESTS_DIR)/validation/validate-provisioning.sh
	@bash $(TESTS_DIR)/validation/validate-routing.sh
	@bash $(TESTS_DIR)/validation/validate-certificates.sh
	@echo "✅ All tenant lifecycle integration tests passed."

tenant-validate:
	@echo "=== Running Tenant Registry Schema Validation ==="
	@bash $(TESTS_DIR)/validation/validate-tenants.sh

tenant-create:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make tenant-create ID=<tenant-id> PLAN=<plan>"; exit 1; fi
	@echo "=== Creating Tenant $(ID) ==="
	@curl -s -X POST -H "Content-Type: application/json" -d '{"tenant_id": "$(ID)", "plan": "$(PLAN)"}' http://localhost:8083/tenants || echo "❌ Failed to send provision request."

tenant-delete:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make tenant-delete ID=<tenant-id>"; exit 1; fi
	@echo "=== Deleting Tenant $(ID) ==="
	@curl -s -X DELETE http://localhost:8083/tenants/$(ID) || echo "❌ Failed to send delete request."

tenant-status:
	@if [ -z "$(ID)" ]; then echo "=== Platform Tenant Status Summary ==="; curl -s http://localhost:8083/tenants; else echo "=== Status of Tenant $(ID) ==="; curl -s http://localhost:8083/tenants/$(ID)/status; fi

tenant-list:
	@echo "=== List of Platform Tenants ==="
	@curl -s http://localhost:8083/tenants

tenant-logs:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make tenant-logs ID=<tenant-id>"; exit 1; fi
	@echo "=== Logs for Tenant $(ID) ==="
	@curl -s http://localhost:8083/tenants/$(ID)/logs

tenant-metrics:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make tenant-metrics ID=<tenant-id>"; exit 1; fi
	@echo "=== Metrics for Tenant $(ID) ==="
	@curl -s http://localhost:8083/tenants/$(ID)/metrics

tenant-rollback:
	@if [ -z "$(ID)" ] || [ -z "$(VERSION)" ]; then echo "❌ Error: ID and VERSION are required. Usage: make tenant-rollback ID=<tenant-id> VERSION=<version>"; exit 1; fi
	@echo "=== Rolling Back Tenant $(ID) to version $(VERSION) ==="
	@curl -s -X POST -H "Content-Type: application/json" -d '{"version": $(VERSION)}' http://localhost:8083/tenants/$(ID)/rollback

reconcile:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make reconcile ID=<tenant-id>"; exit 1; fi
	@echo "=== Reconciling Tenant $(ID) ==="
	@curl -s -X POST http://localhost:8083/admin/tenants/$(ID)/reconcile

tenant-audit:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make tenant-audit ID=<tenant-id>"; exit 1; fi
	@echo "=== Audit Trail for Tenant $(ID) ==="
	@curl -s http://localhost:8083/admin/tenants/$(ID)/audit

tenant-queue:
	@if [ -z "$(ID)" ]; then echo "=== Platform Tasks Queue Status ==="; curl -s http://localhost:8083/admin/tenants/$(ID); else echo "=== Status of Tenant $(ID) Task Queue ==="; curl -s http://localhost:8083/admin/tenants/$(ID); fi

# Application Lifecycle Management
.PHONY: app-validate app-test app-create app-build app-deploy app-rollback app-restart app-status app-metrics

app-validate:
	@echo "=== Running Application Registry & Schema Validation ==="
	@bash $(SCRIPTS_DIR)/validate-applications.sh
	@bash $(SCRIPTS_DIR)/validate-images.sh
	@bash $(SCRIPTS_DIR)/validate-autoscaling.sh
	@echo "✅ All application schema validations passed."

app-test: app-validate
	@echo "=== Running Application Lifecycle Integration Tests ==="
	@bash $(TESTS_DIR)/applications/test-builds.sh
	@bash $(TESTS_DIR)/applications/test-releases.sh
	@bash $(TESTS_DIR)/applications/test-deployments.sh
	@bash $(TESTS_DIR)/applications/test-rollback.sh
	@echo "✅ All application lifecycle integration tests passed."

app-create:
	@if [ -z "$(ID)" ] || [ -z "$(TENANT)" ]; then echo "❌ Error: ID and TENANT are required. Usage: make app-create ID=<app-id> TENANT=<tenant-id>"; exit 1; fi
	@echo "=== Registering Application $(ID) for Tenant $(TENANT) ==="
	@curl -s -X POST -H "Content-Type: application/json" -d '{"application_id": "$(ID)", "tenant_id": "$(TENANT)", "display_name": "$(ID)"}' http://localhost:8083/applications || echo "❌ Failed to send register request."

app-build:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make app-build ID=<app-id>"; exit 1; fi
	@echo "=== Building Application $(ID) ==="
	@curl -s -X POST http://localhost:8083/applications/$(ID)/build || echo "❌ Failed to send build request."

app-deploy:
	@if [ -z "$(ID)" ] || [ -z "$(RELEASE)" ]; then echo "❌ Error: ID and RELEASE are required. Usage: make app-deploy ID=<app-id> RELEASE=<release-id>"; exit 1; fi
	@echo "=== Deploying Application $(ID) Release $(RELEASE) ==="
	@curl -s -X POST -H "Content-Type: application/json" -d '{"releaseId": "$(RELEASE)"}' http://localhost:8083/applications/$(ID)/deploy || echo "❌ Failed to send deploy request."

app-rollback:
	@if [ -z "$(ID)" ] || [ -z "$(RELEASE)" ]; then echo "❌ Error: ID and RELEASE are required. Usage: make app-rollback ID=<app-id> RELEASE=<release-id>"; exit 1; fi
	@echo "=== Rolling Back Application $(ID) to Release $(RELEASE) ==="
	@curl -s -X POST -H "Content-Type: application/json" -d '{"releaseId": "$(RELEASE)"}' http://localhost:8083/applications/$(ID)/rollback || echo "❌ Failed to send rollback request."

app-restart:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make app-restart ID=<app-id>"; exit 1; fi
	@echo "=== Restarting Application $(ID) ==="
	@curl -s -X POST http://localhost:8083/applications/$(ID)/restart || echo "❌ Failed to send restart request."

app-status:
	@if [ -z "$(ID)" ]; then echo "=== Listing All Applications ==="; curl -s http://localhost:8083/applications; else echo "=== Status of Application $(ID) ==="; curl -s http://localhost:8083/applications/$(ID)/runtime; fi

app-metrics:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make app-metrics ID=<app-id>"; exit 1; fi
	@echo "=== Metrics for Application $(ID) ==="
	@curl -s http://localhost:8083/applications/$(ID)/metrics



