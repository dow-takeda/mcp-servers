# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains Model Context Protocol (MCP) servers that enable Claude to interact with external services. Currently implemented: JIRA/Confluence integration.

## Build and Development Commands

### jira-confluence server (TypeScript)

```bash
cd jira-confluence

# Install dependencies
npm install

# Build TypeScript
npm run build

# Build and run
npm run dev

# Start compiled server
npm start

# Watch mode for development
npm run watch

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
npm run audit         # Check for vulnerabilities
```

## Architecture

### MCP Server Structure (jira-confluence)

```
jira-confluence/src/
├── index.ts              # MCP server entry point, tool definitions, request handlers
├── jira/
│   └── client.ts         # JiraClient class - JIRA REST API v3 wrapper
├── confluence/
│   └── client.ts         # ConfluenceClient class - Confluence REST API v2 wrapper
└── utils/
    ├── config.ts         # Environment variable loading with Zod-style validation
    ├── auth.ts           # Basic Auth header generation for Atlassian APIs
    └── logger.ts         # Simple logger with configurable levels
```

### Key Design Patterns

- **Single entry point**: `index.ts` defines all MCP tools and routes requests to appropriate client methods
- **Client classes**: `JiraClient` and `ConfluenceClient` wrap Axios instances with pre-configured auth headers
- **Tool naming convention**: `{service}_{action}` (e.g., `jira_search_issues`, `confluence_create_page`)

### API Integration

- JIRA uses REST API v3: `{baseUrl}/rest/api/3/`
- Confluence uses REST API v2: `{baseUrl}/wiki/api/v2/`
- Both use Basic Auth with email + API token
- JIRA descriptions use Atlassian Document Format (ADF) for rich text

## Environment Configuration

Required environment variables (see `.env.example`):
- `JIRA_BASE_URL`, `JIRA_USER_EMAIL`, `JIRA_API_TOKEN`
- `CONFLUENCE_BASE_URL`, `CONFLUENCE_USER_EMAIL`, `CONFLUENCE_API_TOKEN`
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
    }
  }
}
```

## Adding New MCP Servers

When adding a new service integration:
1. Create a new directory at repository root (e.g., `slack/`)
2. Follow the same structure: client class for API wrapper, utils for shared logic
3. Define tools in the entry point with clear `inputSchema` definitions
4. Update root README.md with the new service
