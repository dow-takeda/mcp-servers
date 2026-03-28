# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains Model Context Protocol (MCP) servers that enable Claude to interact with external services.

### Available Servers

- **jira-confluence**: JIRA/Confluence integration (Atlassian Cloud APIs)
- **github**: GitHub integration (GitHub REST API)

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
