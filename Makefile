.PHONY: check check-jira-confluence check-github install build lint test secretlint

# Run all checks (lint, security, tests) for all servers
check: check-jira-confluence check-github
	@echo "All checks passed!"

# Check jira-confluence server
check-jira-confluence:
	@echo "=== Checking jira-confluence ==="
	cd jira-confluence && npm run lint && npm run secretlint && npm test

# Check github server
check-github:
	@echo "=== Checking github ==="
	cd github && npm run lint && npm run secretlint && npm test

# Install dependencies for all servers
install:
	cd jira-confluence && npm install
	cd github && npm install

# Build all servers
build:
	cd jira-confluence && npm run build
	cd github && npm run build

# Run lint for all servers
lint:
	cd jira-confluence && npm run lint
	cd github && npm run lint

# Run tests for all servers
test:
	cd jira-confluence && npm test
	cd github && npm test

# Run security checks for all servers
secretlint:
	cd jira-confluence && npm run secretlint
	cd github && npm run secretlint
