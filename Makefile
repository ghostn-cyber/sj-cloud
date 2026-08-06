# Makefile for SJ Cloud Platform Ingress Layer & Service Mesh Foundation
export NODE_PATH=platform/service-mesh/node_modules

.PHONY: init network deploy validate lint test performance-benchmark restart logs status destroy all \
        registry discovery discovery-health routing retry validate-services service-status service-test mesh mesh-test \
        validate-runtime tenant tenant-test tenant-validate tenant-create tenant-delete tenant-status tenant-list tenant-logs tenant-metrics tenant-rollback \
        reconcile tenant-audit tenant-queue operations-test operations-validate


INFRA_DIR=infrastructure
SCRIPTS_DIR=$(INFRA_DIR)/scripts
TESTS_DIR=$(INFRA_DIR)/tests

all: init validate validate-services up test

init:
	@echo "=== Initializing Platform Environment ==="
	@bash $(SCRIPTS_DIR)/bootstrap.sh

network:
	@echo "=== Creating Network Foundation ==="
	@bash $(SCRIPTS_DIR)/setup-networks.sh

doctor:
	@echo "=== Environment Check ==="
	@bash $(SCRIPTS_DIR)/doctor.sh

up: doctor init
	@echo "=== Deploying Platform Stacks ==="
	@cd $(INFRA_DIR) && docker compose \
		-f compose/00-core.yml \
		-f compose/10-platform.yml \
		-f compose/20-mesh.yml \
		-f compose/30-storage.yml \
		-f compose/40-monitoring.yml \
		-f compose/50-observability.yml \
		-f compose/60-development.yml \
		-f compose/70-tools.yml up -d --build
	@echo "Waiting for services healthchecks..."
	@sleep 10

deploy: up

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

discovery-health:
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

performance-benchmark:
	@echo "=== Running Performance Baselines ==="
	@bash $(TESTS_DIR)/performance/baseline.sh

restart:
	@echo "=== Restarting Stacks ==="
	@cd $(INFRA_DIR) && docker compose \
		-f compose/00-core.yml \
		-f compose/10-platform.yml \
		-f compose/20-mesh.yml \
		-f compose/30-storage.yml \
		-f compose/40-monitoring.yml \
		-f compose/50-observability.yml \
		-f compose/60-development.yml \
		-f compose/70-tools.yml restart

logs:
	@echo "=== Showing Aggregated Logs ==="
	@bash $(SCRIPTS_DIR)/logs.sh --tail 100

status:
	@echo "=== Platform Services Status ==="
	@bash $(SCRIPTS_DIR)/status.sh

down:
	@echo "=== Stopping Platform Services ==="
	@cd $(INFRA_DIR) && docker compose \
		-f compose/00-core.yml \
		-f compose/10-platform.yml \
		-f compose/20-mesh.yml \
		-f compose/30-storage.yml \
		-f compose/40-monitoring.yml \
		-f compose/50-observability.yml \
		-f compose/60-development.yml \
		-f compose/70-tools.yml down

destroy: down
	@echo "=== Performing Full System Cleanup ==="
	@bash $(SCRIPTS_DIR)/cleanup.sh

clean: destroy

reset:
	@echo "=== Full System Reset ==="
	@bash $(SCRIPTS_DIR)/reset.sh

diagnostics:
	@echo "=== Cluster Diagnostics ==="
	@bash $(SCRIPTS_DIR)/diagnostics.sh

infrastructure-test:
	@echo "=== Running E2E Infrastructure Test Suite ==="
	@bash $(TESTS_DIR)/infrastructure-test.sh

# Platform Infrastructure Management & Governance
.PHONY: bootstrap verify-backup benchmark health inventory drift audit \
        infra-inventory infra-drift infra-policies infra-quota infra-image-gov infra-backup infra-dr

bootstrap:
	@echo "=== Bootstrapping Local Cloud Infrastructure ==="
	@bash $(SCRIPTS_DIR)/bootstrap.sh

verify-backup:
	@echo "=== Verifying Backup & Recovery Integrity ==="
	@bash $(SCRIPTS_DIR)/verify-backup.sh

benchmark:
	@echo "=== Benchmarking Infrastructure Performance ==="
	@bash $(SCRIPTS_DIR)/benchmark.sh

health:
	@echo "=== Querying Platform Health Engine Score ==="
	@curl -s http://localhost:3000/admin/infrastructure/health || echo "❌ Error: Could not connect to Tenant Manager Administration API."

inventory:
	@echo "=== Discovered Resource Inventory ==="
	@curl -s http://localhost:3000/admin/infrastructure/inventory || echo "❌ Error: Could not connect to Tenant Manager Administration API."

drift:
	@echo "=== Running Infrastructure Drift Detection ==="
	@curl -s http://localhost:3000/admin/infrastructure/drift || echo "❌ Error: Could not connect to Tenant Manager Administration API."

audit:
	@echo "=== Aggregated System Operations Audit Log ==="
	@curl -s http://localhost:3000/admin/infrastructure/audit || echo "❌ Error: Could not connect to Tenant Manager Administration API."

infra-inventory:
	@echo "=== Discovering Infrastructure Inventory ==="
	@bash $(SCRIPTS_DIR)/inventory.sh

infra-drift:
	@echo "=== Detecting Infrastructure Drift ==="
	@bash $(SCRIPTS_DIR)/drift-detect.sh

infra-policies:
	@echo "=== Querying Infrastructure Policies ==="
	@bash $(SCRIPTS_DIR)/policy-check.sh

infra-quota:
	@if [ -z "$(TENANT)" ]; then echo "❌ Error: TENANT is required. Usage: make infra-quota TENANT=<tenant-id> [LIMITS=<json-limits>]"; exit 1; fi
	@echo "=== Querying/Mutating Quotas for $(TENANT) ==="
	@if [ -n "$(LIMITS)" ]; then \
		bash $(SCRIPTS_DIR)/quota.sh "$(TENANT)" '$(LIMITS)'; \
	else \
		bash $(SCRIPTS_DIR)/quota.sh "$(TENANT)"; \
	fi

infra-image-gov:
	@if [ -z "$(IMAGE)" ]; then echo "❌ Error: IMAGE is required. Usage: make infra-image-gov IMAGE=<image-name>"; exit 1; fi
	@echo "=== Validating Image Governance for $(IMAGE) ==="
	@bash $(SCRIPTS_DIR)/image-gov.sh "$(IMAGE)"

infra-backup:
	@if [ -z "$(TENANT)" ]; then echo "❌ Error: TENANT is required. Usage: make infra-backup TENANT=<tenant-id>"; exit 1; fi
	@echo "=== Taking Backup for Tenant $(TENANT) ==="
	@bash $(SCRIPTS_DIR)/backup.sh "$(TENANT)"

infra-dr:
	@echo "=== Generating Disaster Recovery Platform Snapshot ==="
	@bash $(SCRIPTS_DIR)/dr.sh

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
	@bash $(SCRIPTS_DIR)/validate-cicd.sh
	@$(MAKE) operations-validate
	@echo "✅ All application schema validations passed."

app-test: app-validate
	@echo "=== Running Application Lifecycle Integration Tests ==="
	@bash $(TESTS_DIR)/applications/test-builds.sh
	@bash $(TESTS_DIR)/applications/test-releases.sh
	@bash $(TESTS_DIR)/applications/test-deployments.sh
	@bash $(TESTS_DIR)/applications/test-rollback.sh
	@bash $(TESTS_DIR)/applications/test-cicd.sh
	@$(MAKE) operations-test
	@echo "✅ All application lifecycle integration tests passed."


app-create:
	@if [ -z "$(ID)" ] || [ -z "$(TENANT)" ]; then echo "❌ Error: ID and TENANT are required. Usage: make app-create ID=<app-id> TENANT=<tenant-id>"; exit 1; fi
	@echo "=== Registering Application $(ID) for Tenant $(TENANT) ==="
	@curl -s -X POST -H "Content-Type: application/json" -d '{"application_id": "$(ID)", "tenant_id": "$(TENANT)", "display_name": "$(ID)"}' http://localhost:8083/applications || echo "❌ Failed to send register request."

app-build:
	@if [ -z "$(ID)" ]; then echo "❌ Error: ID is required. Usage: make app-build ID=<app-id>"; exit 1; fi
	@echo "=== Building Application $(ID) ==="
	@curl -s -X POST -H "x-pipeline-execution: true" http://localhost:8083/applications/$(ID)/build || echo "❌ Failed to send build request."

app-deploy:
	@if [ -z "$(ID)" ] || [ -z "$(RELEASE)" ]; then echo "❌ Error: ID and RELEASE are required. Usage: make app-deploy ID=<app-id> RELEASE=<release-id>"; exit 1; fi
	@echo "=== Deploying Application $(ID) Release $(RELEASE) ==="
	@curl -s -X POST -H "Content-Type: application/json" -H "x-pipeline-execution: true" -d '{"releaseId": "$(RELEASE)"}' http://localhost:8083/applications/$(ID)/deploy || echo "❌ Failed to send deploy request."

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

# CI/CD & Developer Platform targets
.PHONY: repo-register repo-sync pipeline-trigger pipeline-status pipeline-logs secret-set promote promote-approve

repo-register:
	@if [ -z "$(ID)" ] || [ -z "$(TENANT)" ] || [ -z "$(URL)" ]; then echo "❌ Error: ID, TENANT, and URL are required. Usage: make repo-register ID=<repo-id> TENANT=<tenant-id> URL=<git-url>"; exit 1; fi
	@echo "=== Registering Repository $(ID) for Tenant $(TENANT) ==="
	@curl -s -X POST -H "Content-Type: application/json" -d '{"repository_id": "$(ID)", "url": "$(URL)", "provider": "local"}' http://localhost:8083/tenants/$(TENANT)/repositories

repo-sync:
	@if [ -z "$(ID)" ] || [ -z "$(TENANT)" ]; then echo "❌ Error: ID and TENANT are required. Usage: make repo-sync ID=<repo-id> TENANT=<tenant-id>"; exit 1; fi
	@echo "=== Syncing Repository $(ID) ==="
	@curl -s -X POST http://localhost:8083/tenants/$(TENANT)/repositories/$(ID)/sync

pipeline-trigger:
	@if [ -z "$(ID)" ] || [ -z "$(TENANT)" ]; then echo "❌ Error: ID (app-id) and TENANT are required. Usage: make pipeline-trigger ID=<app-id> TENANT=<tenant-id> [BRANCH=main]"; exit 1; fi
	@echo "=== Triggering Pipeline for App $(ID) ==="
	@curl -s -X POST -H "Content-Type: application/json" -d '{"application_id": "$(ID)", "branch": "$(BRANCH)"}' http://localhost:8083/tenants/$(TENANT)/pipelines/trigger

pipeline-status:
	@if [ -z "$(RUN)" ] || [ -z "$(TENANT)" ]; then echo "❌ Error: RUN and TENANT are required. Usage: make pipeline-status RUN=<run-id> TENANT=<tenant-id>"; exit 1; fi
	@curl -s http://localhost:8083/tenants/$(TENANT)/pipelines/runs/$(RUN)

pipeline-logs:
	@if [ -z "$(RUN)" ] || [ -z "$(TENANT)" ]; then echo "❌ Error: RUN and TENANT are required. Usage: make pipeline-logs RUN=<run-id> TENANT=<tenant-id>"; exit 1; fi
	@curl -s http://localhost:8083/tenants/$(TENANT)/pipelines/runs/$(RUN)/logs

secret-set:
	@if [ -z "$(NAME)" ] || [ -z "$(VALUE)" ] || [ -z "$(TENANT)" ]; then echo "❌ Error: NAME, VALUE, and TENANT are required. Usage: make secret-set NAME=<name> VALUE=<value> TENANT=<tenant-id>"; exit 1; fi
	@curl -s -X POST -H "Content-Type: application/json" -d '{"name": "$(NAME)", "value": "$(VALUE)"}' http://localhost:8083/tenants/$(TENANT)/secrets

promote:
	@if [ -z "$(ID)" ] || [ -z "$(RELEASE)" ] || [ -z "$(SRC)" ] || [ -z "$(TARGET)" ] || [ -z "$(TENANT)" ]; then echo "❌ Error: ID, RELEASE, SRC, TARGET, and TENANT are required. Usage: make promote ID=<app-id> RELEASE=<release-id> SRC=<src-env> TARGET=<target-env> TENANT=<tenant-id>"; exit 1; fi
	@curl -s -X POST -H "Content-Type: application/json" -d '{"application_id": "$(ID)", "release_id": "$(RELEASE)", "source_env": "$(SRC)", "target_env": "$(TARGET)"}' http://localhost:8083/tenants/$(TENANT)/promotions

promote-approve:
	@if [ -z "$(ID)" ] || [ -z "$(TENANT)" ]; then echo "❌ Error: ID (promo-id) and TENANT are required. Usage: make promote-approve ID=<promo-id> TENANT=<tenant-id>"; exit 1; fi
	@curl -s -X POST -H "Content-Type: application/json" -d '{"approver": "admin"}' http://localhost:8083/tenants/$(TENANT)/promotions/$(ID)/approve

# Platform Operations & Observability targets
.PHONY: operations-test operations-validate

operations-test: operations-validate
	@echo "=== Running E2E Operations & SRE Integration Tests ==="
	@bash $(TESTS_DIR)/applications/test-operations.sh

operations-validate:
	@echo "=== Running Operations & Observability Validation ==="
	@bash $(SCRIPTS_DIR)/validate-operations.sh

# Platform Configuration Layer targets
.PHONY: config-test

config-test:
	@echo "=== Running Platform Configuration Validation Tests ==="
	@bash $(SCRIPTS_DIR)/validate-config-platform.sh





