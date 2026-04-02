# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains Model Context Protocol (MCP) servers that enable Claude to interact with external services.

### Available Servers

- **jira-confluence**: JIRA/Confluence integration (Atlassian Cloud APIs)
- **github**: GitHub integration (GitHub REST API)
- **gitlab**: GitLab integration (GitLab REST API v4)

## Build and Development Commands

### jira-confluence server

```bash
cd jira-confluence

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start compiled server
npm start

# Linting and formatting
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint errors
npm run format        # Format code with Prettier

# Testing
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report

# Security
npm run secretlint    # Scan for secrets
```

### github server

```bash
cd github

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start compiled server
npm run dev

# Linting and formatting
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint errors
npm run format        # Format code with Prettier

# Testing
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report

# Security
npm run secretlint    # Scan for secrets
```

### gitlab server

```bash
cd gitlab

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start compiled server
npm start

# Linting and formatting
npm run lint          # Check for lint errors
npm run lint:fix      # Auto-fix lint errors
npm run format        # Format code with Prettier

# Testing
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report

# Security
npm run secretlint    # Scan for secrets
```

## Architecture

### MCP Server Structure

Each server follows the same structure:

```
{server}/src/
├── index.ts              # MCP server entry point, tool definitions, request handlers
├── {service}/
│   └── client.ts         # API client class
└── utils/
    ├── config.ts         # Environment variable loading
    ├── auth.ts           # Auth header generation
    └── logger.ts         # Logger with configurable levels
```

### Key Design Patterns

- **Single entry point**: `index.ts` defines all MCP tools and routes requests to appropriate client methods
- **Client classes**: Wrap Axios instances with pre-configured auth headers
- **Tool naming convention**: `{service}_{action}` (e.g., `jira_search_issues`, `github_list_repos`)

### API Integration

**JIRA/Confluence:**
- JIRA uses REST API v3: `{baseUrl}/rest/api/3/`
- Confluence uses REST API v2: `{baseUrl}/wiki/api/v2/`
- Both use Basic Auth with email + API token
- JIRA descriptions use Atlassian Document Format (ADF)

**GitHub:**
- Uses REST API: `https://api.github.com/`
- Bearer token authentication with Personal Access Token
- Rate limit: 5,000 requests/hour (authenticated)

**GitLab:**
- Uses REST API v4: `https://gitlab.com/api/v4/`
- PRIVATE-TOKEN header authentication with Personal Access Token
- Rate limit: 2,000 requests/minute (authenticated)

## Environment Configuration

### jira-confluence

Required environment variables (see `jira-confluence/.env.example`):
- `JIRA_BASE_URL`, `JIRA_USER_EMAIL`, `JIRA_API_TOKEN`
- `CONFLUENCE_BASE_URL`, `CONFLUENCE_USER_EMAIL`, `CONFLUENCE_API_TOKEN`
- `LOG_LEVEL` (optional, defaults to 'info')

### github

Required environment variables (see `github/.env.example`):
- `GITHUB_TOKEN` - GitHub Personal Access Token
- `GITHUB_API_URL` (optional, for GitHub Enterprise)
- `LOG_LEVEL` (optional, defaults to 'info')

### gitlab

Required environment variables (see `gitlab/.env.example`):
- `GITLAB_TOKEN` - GitLab Personal Access Token
- `GITLAB_API_URL` (optional, defaults to `https://gitlab.com/api/v4`)
- `LOG_LEVEL` (optional, defaults to 'info')

## Claude Desktop/Code Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jira-confluence": {
      "command": "node",
      "args": ["/path/to/mcp-servers/jira-confluence/dist/index.js"],
      "env": {
        "JIRA_BASE_URL": "https://your-domain.atlassian.net",
        "JIRA_USER_EMAIL": "...",
        "JIRA_API_TOKEN": "...",
        "CONFLUENCE_BASE_URL": "https://your-domain.atlassian.net",
        "CONFLUENCE_USER_EMAIL": "...",
        "CONFLUENCE_API_TOKEN": "..."
      }
    },
    "github": {
      "command": "node",
      "args": ["/path/to/mcp-servers/github/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    },
    "gitlab": {
      "command": "node",
      "args": ["/path/to/mcp-servers/gitlab/dist/index.js"],
      "env": {
        "GITLAB_TOKEN": "glpat-xxxxxxxxxxxx"
      }
    }
  }
}
```

## Adding New MCP Servers

When adding a new service integration:
1. Create a new directory at repository root (e.g., `slack/`)
2. Follow the same structure: client class for API wrapper, utils for shared logic
3. Define tools in the entry point with clear `inputSchema` definitions
4. Add ESLint, Prettier, Secretlint, Vitest configuration
5. Update CI workflow to include the new server
6. Update this file and root README.md

## Development Flow

**This flow MUST be strictly followed.** When receiving a modification request from the user, follow these steps:

1. **Receive Request**: Receive the request from the user (text or file path). If a file path is provided, read the file.
2. **Create Plan**: Enter Plan mode and create an implementation plan for user approval.
3. **Create Issue**: After user approval, create a GitHub Issue.
4. **Create Branch**: Create a feature branch. Naming convention: `feature/{issue_number}-{summary_2_5_words_snake_case}`
5. **Implement**: Make the modifications. Ensure unit tests are sufficient (add if needed).
6. **Local Validation**: Run `make check` (lint, security check, unit tests). Fix any issues and re-run.
7. **Commit**: After all checks pass, commit. Prefix commit message with `#{issue_number}`.
8. **Push & Create PR**: Push to GitHub and create a Pull Request. Report to the user.
9. **Review Response**:
   - If user **rejects** the PR: Comment the rejection reason on the Issue and restart from step 5.
   - If user **approves** the PR: Add a summary comment to the Issue and close it.
