# GitLab MCP Server

Model Context Protocol (MCP) server for GitLab API integration.

## Features

- **Project Operations**: List, get, create projects; list group projects
- **Issue Operations**: List, get, create, update issues and add comments
- **Merge Request Operations**: List, get, create, merge MRs, list changes, add comments
- **File Operations**: Get file content, create/update files, list repository tree
- **CI/CD Pipelines**: List pipelines, get details, list jobs, trigger pipelines
- **Releases**: List, get, create releases

## Setup

### Prerequisites

- Node.js 20+
- GitLab Personal Access Token (PAT)

### Installation

```bash
cd gitlab
npm install
npm run build
```

### Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` with your GitLab credentials:

```bash
# Required
GITLAB_TOKEN=glpat-xxxxxxxxxxxx

# Optional
GITLAB_API_URL=https://gitlab.com/api/v4  # For self-hosted GitLab
LOG_LEVEL=info
```

### Creating a GitLab Token

1. Go to https://gitlab.com/-/user_settings/personal_access_tokens
2. Click "Add new token"
3. Select required scopes:
   - `api` - Full API access
   - `read_repository` - Repository read access
   - `write_repository` - Repository write access
4. Copy the generated token

## Available Tools

### Project Tools

| Tool | Description |
|------|-------------|
| `gitlab_list_projects` | List projects for authenticated user |
| `gitlab_list_group_projects` | List projects within a group |
| `gitlab_get_project` | Get project details |
| `gitlab_create_project` | Create a new project |

### Issue Tools

| Tool | Description |
|------|-------------|
| `gitlab_list_issues` | List issues for a project |
| `gitlab_get_issue` | Get issue details |
| `gitlab_create_issue` | Create a new issue |
| `gitlab_update_issue` | Update an existing issue |
| `gitlab_add_issue_comment` | Add a comment to an issue |

### Merge Request Tools

| Tool | Description |
|------|-------------|
| `gitlab_list_merge_requests` | List merge requests |
| `gitlab_get_merge_request` | Get MR details |
| `gitlab_create_merge_request` | Create a new MR |
| `gitlab_merge_merge_request` | Merge a MR |
| `gitlab_list_mr_changes` | List files changed in a MR |
| `gitlab_add_mr_comment` | Add a comment to a MR |

### File Tools

| Tool | Description |
|------|-------------|
| `gitlab_get_file` | Get file content |
| `gitlab_create_or_update_file` | Create or update a file |
| `gitlab_list_repository_tree` | List directory contents |

### CI/CD Pipeline Tools

| Tool | Description |
|------|-------------|
| `gitlab_list_pipelines` | List pipelines |
| `gitlab_get_pipeline` | Get pipeline details |
| `gitlab_list_pipeline_jobs` | List jobs in a pipeline |
| `gitlab_trigger_pipeline` | Trigger a new pipeline |

### Release Tools

| Tool | Description |
|------|-------------|
| `gitlab_list_releases` | List releases |
| `gitlab_get_release` | Get release details |
| `gitlab_get_latest_release` | Get latest release |
| `gitlab_create_release` | Create a new release |

## Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
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

## Development

```bash
# Run linter
npm run lint

# Fix lint errors
npm run lint:fix

# Format code
npm run format

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Check for secrets
npm run secretlint
```

## GitLab-specific Concepts

### Project ID

GitLab supports two ways to identify a project:
- **Numeric ID**: e.g., `12345`
- **URL-encoded path**: e.g., `namespace%2Fproject` (for `namespace/project`)

### IID vs ID

- **ID**: Global unique identifier across all GitLab
- **IID**: Internal ID, unique within a project (used for issues, MRs, pipelines)

For example, Issue #1 in Project A has a different global `id` than Issue #1 in Project B, but both have `iid: 1`.

## API Reference

- [GitLab REST API Documentation](https://docs.gitlab.com/ee/api/rest/)
- [Authentication](https://docs.gitlab.com/ee/api/rest/#authentication)
- [Rate Limiting](https://docs.gitlab.com/ee/security/rate_limits.html): 2,000 requests/minute (authenticated)

## License

MIT
