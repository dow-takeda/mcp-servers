# GitHub MCP Server

Model Context Protocol (MCP) server for GitHub API integration.

## Features

- **Repository Operations**: List, get, create repositories
- **Issue Operations**: List, get, create, update issues and add comments
- **Pull Request Operations**: List, get, create, merge PRs and add comments
- **File Operations**: Get file content, create/update files, list directories
- **GitHub Actions**: List workflows, list runs, trigger workflows
- **Releases**: List, get, create releases

## Setup

### Prerequisites

- Node.js 20+
- GitHub Personal Access Token (PAT)

### Installation

```bash
cd github
npm install
npm run build
```

### Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` with your GitHub credentials:

```bash
# Required
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Optional
GITHUB_API_URL=https://api.github.com  # For GitHub Enterprise
LOG_LEVEL=info
```

### Creating a GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)" or "Generate new token"
3. Select required scopes:
   - `repo` - Repository access
   - `workflow` - GitHub Actions
   - `read:org` - Organization information (optional)
4. Copy the generated token

## Available Tools

### Repository Tools

| Tool | Description |
|------|-------------|
| `github_list_repos` | List repositories for authenticated user |
| `github_list_org_repos` | List repositories for an organization |
| `github_get_repo` | Get repository details |
| `github_create_repo` | Create a new repository |

### Issue Tools

| Tool | Description |
|------|-------------|
| `github_list_issues` | List issues for a repository |
| `github_get_issue` | Get issue details |
| `github_create_issue` | Create a new issue |
| `github_update_issue` | Update an existing issue |
| `github_add_issue_comment` | Add a comment to an issue |

### Pull Request Tools

| Tool | Description |
|------|-------------|
| `github_list_pull_requests` | List pull requests |
| `github_get_pull_request` | Get PR details |
| `github_create_pull_request` | Create a new PR |
| `github_merge_pull_request` | Merge a PR |
| `github_list_pr_files` | List files changed in a PR |
| `github_add_pr_comment` | Add a comment to a PR |

### File Tools

| Tool | Description |
|------|-------------|
| `github_get_file_content` | Get file content |
| `github_create_or_update_file` | Create or update a file |
| `github_list_directory` | List directory contents |

### GitHub Actions Tools

| Tool | Description |
|------|-------------|
| `github_list_workflows` | List workflows |
| `github_list_workflow_runs` | List workflow runs |
| `github_trigger_workflow` | Trigger a workflow |

### Release Tools

| Tool | Description |
|------|-------------|
| `github_list_releases` | List releases |
| `github_get_release` | Get release details |
| `github_get_latest_release` | Get latest release |
| `github_create_release` | Create a new release |

## Claude Desktop Integration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
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

## API Reference

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Authentication](https://docs.github.com/en/rest/authentication)
- [Rate Limiting](https://docs.github.com/en/rest/rate-limit): 5,000 requests/hour (authenticated)

## License

MIT
