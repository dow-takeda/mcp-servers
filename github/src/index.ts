import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { GitHubClient } from './github/client.js';

// Load configuration
const config = loadConfig();
logger.setLevel(config.logLevel);

// Initialize GitHub client
const github = new GitHubClient(config.github);

// Tool definitions
const tools: Tool[] = [
  // Repository Tools
  {
    name: 'github_list_repos',
    description: 'List repositories for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['all', 'owner', 'public', 'private', 'member'],
          description: 'Type of repositories to list',
        },
        sort: {
          type: 'string',
          enum: ['created', 'updated', 'pushed', 'full_name'],
          description: 'Sort field',
        },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
    },
  },
  {
    name: 'github_list_org_repos',
    description: 'List repositories for an organization',
    inputSchema: {
      type: 'object',
      properties: {
        org: { type: 'string', description: 'Organization name' },
        type: {
          type: 'string',
          enum: ['all', 'public', 'private', 'forks', 'sources', 'member'],
          description: 'Type of repositories to list',
        },
        sort: {
          type: 'string',
          enum: ['created', 'updated', 'pushed', 'full_name'],
          description: 'Sort field',
        },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['org'],
    },
  },
  {
    name: 'github_get_repo',
    description: 'Get repository details',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'github_create_repo',
    description: 'Create a new repository',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Repository name' },
        description: { type: 'string', description: 'Repository description' },
        private: { type: 'boolean', description: 'Whether the repository is private' },
        auto_init: { type: 'boolean', description: 'Initialize with README' },
      },
      required: ['name'],
    },
  },

  // Issue Tools
  {
    name: 'github_list_issues',
    description: 'List issues for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: {
          type: 'string',
          enum: ['open', 'closed', 'all'],
          description: 'Issue state filter',
        },
        labels: { type: 'string', description: 'Comma-separated list of label names' },
        sort: {
          type: 'string',
          enum: ['created', 'updated', 'comments'],
          description: 'Sort field',
        },
        direction: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'github_get_issue',
    description: 'Get issue details',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        issue_number: { type: 'number', description: 'Issue number' },
      },
      required: ['owner', 'repo', 'issue_number'],
    },
  },
  {
    name: 'github_create_issue',
    description: 'Create a new issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body' },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to apply',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Usernames to assign',
        },
        milestone: { type: 'number', description: 'Milestone number' },
      },
      required: ['owner', 'repo', 'title'],
    },
  },
  {
    name: 'github_update_issue',
    description: 'Update an existing issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        issue_number: { type: 'number', description: 'Issue number' },
        title: { type: 'string', description: 'Issue title' },
        body: { type: 'string', description: 'Issue body' },
        state: { type: 'string', enum: ['open', 'closed'], description: 'Issue state' },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to apply',
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Usernames to assign',
        },
      },
      required: ['owner', 'repo', 'issue_number'],
    },
  },
  {
    name: 'github_add_issue_comment',
    description: 'Add a comment to an issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        issue_number: { type: 'number', description: 'Issue number' },
        body: { type: 'string', description: 'Comment body' },
      },
      required: ['owner', 'repo', 'issue_number', 'body'],
    },
  },
  {
    name: 'github_list_issue_comments',
    description: 'List comments on an issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        issue_number: { type: 'number', description: 'Issue number' },
        sort: {
          type: 'string',
          enum: ['created', 'updated'],
          description: 'Sort field',
        },
        direction: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        since: {
          type: 'string',
          description: 'Only return comments updated after this ISO 8601 timestamp',
        },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['owner', 'repo', 'issue_number'],
    },
  },
  {
    name: 'github_get_issue_comment',
    description: 'Get a specific comment on an issue',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        comment_id: { type: 'number', description: 'Comment ID' },
      },
      required: ['owner', 'repo', 'comment_id'],
    },
  },

  // Pull Request Tools
  {
    name: 'github_list_pull_requests',
    description: 'List pull requests for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        state: {
          type: 'string',
          enum: ['open', 'closed', 'all'],
          description: 'PR state filter',
        },
        head: { type: 'string', description: 'Filter by head branch (user:branch)' },
        base: { type: 'string', description: 'Filter by base branch' },
        sort: {
          type: 'string',
          enum: ['created', 'updated', 'popularity', 'long-running'],
          description: 'Sort field',
        },
        direction: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'github_get_pull_request',
    description: 'Get pull request details',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'github_create_pull_request',
    description: 'Create a new pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        title: { type: 'string', description: 'PR title' },
        head: { type: 'string', description: 'Head branch name' },
        base: { type: 'string', description: 'Base branch name' },
        body: { type: 'string', description: 'PR body' },
        draft: { type: 'boolean', description: 'Create as draft PR' },
      },
      required: ['owner', 'repo', 'title', 'head', 'base'],
    },
  },
  {
    name: 'github_merge_pull_request',
    description: 'Merge a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
        commit_title: { type: 'string', description: 'Merge commit title' },
        commit_message: { type: 'string', description: 'Merge commit message' },
        merge_method: {
          type: 'string',
          enum: ['merge', 'squash', 'rebase'],
          description: 'Merge method',
        },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'github_list_pr_files',
    description: 'List files changed in a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'github_add_pr_comment',
    description: 'Add a comment to a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
        body: { type: 'string', description: 'Comment body' },
      },
      required: ['owner', 'repo', 'pull_number', 'body'],
    },
  },
  {
    name: 'github_list_pr_comments',
    description: 'List comments on a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        pull_number: { type: 'number', description: 'Pull request number' },
        sort: {
          type: 'string',
          enum: ['created', 'updated'],
          description: 'Sort field',
        },
        direction: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        since: {
          type: 'string',
          description: 'Only return comments updated after this ISO 8601 timestamp',
        },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['owner', 'repo', 'pull_number'],
    },
  },
  {
    name: 'github_get_pr_comment',
    description: 'Get a specific comment on a pull request',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        comment_id: { type: 'number', description: 'Comment ID' },
      },
      required: ['owner', 'repo', 'comment_id'],
    },
  },

  // File Operations
  {
    name: 'github_get_file_content',
    description: 'Get file content from a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'File path' },
        ref: { type: 'string', description: 'Branch, tag, or commit SHA' },
      },
      required: ['owner', 'repo', 'path'],
    },
  },
  {
    name: 'github_create_or_update_file',
    description: 'Create or update a file in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'File path' },
        message: { type: 'string', description: 'Commit message' },
        content: { type: 'string', description: 'File content (will be base64 encoded)' },
        sha: { type: 'string', description: 'SHA of file to update (required for updates)' },
        branch: { type: 'string', description: 'Branch name' },
      },
      required: ['owner', 'repo', 'path', 'message', 'content'],
    },
  },
  {
    name: 'github_list_directory',
    description: 'List directory contents in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        path: { type: 'string', description: 'Directory path (empty for root)' },
        ref: { type: 'string', description: 'Branch, tag, or commit SHA' },
      },
      required: ['owner', 'repo'],
    },
  },

  // GitHub Actions
  {
    name: 'github_list_workflows',
    description: 'List workflows in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'github_list_workflow_runs',
    description: 'List workflow runs',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        workflow_id: {
          type: ['number', 'string'],
          description: 'Workflow ID or filename',
        },
        branch: { type: 'string', description: 'Filter by branch' },
        status: {
          type: 'string',
          enum: ['queued', 'in_progress', 'completed'],
          description: 'Filter by status',
        },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['owner', 'repo', 'workflow_id'],
    },
  },
  {
    name: 'github_trigger_workflow',
    description: 'Trigger a workflow dispatch event',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        workflow_id: {
          type: ['number', 'string'],
          description: 'Workflow ID or filename',
        },
        ref: { type: 'string', description: 'Branch or tag to run workflow on' },
        inputs: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Workflow inputs',
        },
      },
      required: ['owner', 'repo', 'workflow_id', 'ref'],
    },
  },

  // Releases
  {
    name: 'github_list_releases',
    description: 'List releases for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'github_get_release',
    description: 'Get release details',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        release_id: { type: 'number', description: 'Release ID' },
      },
      required: ['owner', 'repo', 'release_id'],
    },
  },
  {
    name: 'github_get_latest_release',
    description: 'Get the latest release for a repository',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'github_create_release',
    description: 'Create a new release',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'Repository owner' },
        repo: { type: 'string', description: 'Repository name' },
        tag_name: { type: 'string', description: 'Tag name for the release' },
        name: { type: 'string', description: 'Release name' },
        body: { type: 'string', description: 'Release body/description' },
        draft: { type: 'boolean', description: 'Create as draft' },
        prerelease: { type: 'boolean', description: 'Mark as prerelease' },
        target_commitish: {
          type: 'string',
          description: 'Branch or commit SHA for the tag',
        },
      },
      required: ['owner', 'repo', 'tag_name'],
    },
  },
];

// Tool handler type definitions
interface ToolArgs {
  [key: string]: unknown;
}

// Handle tool calls
async function handleToolCall(name: string, args: ToolArgs): Promise<unknown> {
  logger.info(`Handling tool call: ${name}`, { args });

  try {
    switch (name) {
      // Repository operations
      case 'github_list_repos':
        return await github.listRepos({
          type: args.type as 'all' | 'owner' | 'public' | 'private' | 'member',
          sort: args.sort as 'created' | 'updated' | 'pushed' | 'full_name',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'github_list_org_repos':
        return await github.listOrgRepos(args.org as string, {
          type: args.type as 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member',
          sort: args.sort as 'created' | 'updated' | 'pushed' | 'full_name',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'github_get_repo':
        return await github.getRepo(args.owner as string, args.repo as string);

      case 'github_create_repo':
        return await github.createRepo({
          name: args.name as string,
          description: args.description as string,
          private: args.private as boolean,
          auto_init: args.auto_init as boolean,
        });

      // Issue operations
      case 'github_list_issues':
        return await github.listIssues(args.owner as string, args.repo as string, {
          state: args.state as 'open' | 'closed' | 'all',
          labels: args.labels as string,
          sort: args.sort as 'created' | 'updated' | 'comments',
          direction: args.direction as 'asc' | 'desc',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'github_get_issue':
        return await github.getIssue(
          args.owner as string,
          args.repo as string,
          args.issue_number as number
        );

      case 'github_create_issue':
        return await github.createIssue(args.owner as string, args.repo as string, {
          title: args.title as string,
          body: args.body as string,
          labels: args.labels as string[],
          assignees: args.assignees as string[],
          milestone: args.milestone as number,
        });

      case 'github_update_issue':
        return await github.updateIssue(
          args.owner as string,
          args.repo as string,
          args.issue_number as number,
          {
            title: args.title as string,
            body: args.body as string,
            state: args.state as 'open' | 'closed',
            labels: args.labels as string[],
            assignees: args.assignees as string[],
          }
        );

      case 'github_add_issue_comment':
        return await github.addIssueComment(
          args.owner as string,
          args.repo as string,
          args.issue_number as number,
          args.body as string
        );

      case 'github_list_issue_comments':
        return await github.listIssueComments(
          args.owner as string,
          args.repo as string,
          args.issue_number as number,
          {
            sort: args.sort as 'created' | 'updated',
            direction: args.direction as 'asc' | 'desc',
            since: args.since as string,
            per_page: args.per_page as number,
            page: args.page as number,
          }
        );

      case 'github_get_issue_comment':
        return await github.getIssueComment(
          args.owner as string,
          args.repo as string,
          args.comment_id as number
        );

      // Pull request operations
      case 'github_list_pull_requests':
        return await github.listPullRequests(args.owner as string, args.repo as string, {
          state: args.state as 'open' | 'closed' | 'all',
          head: args.head as string,
          base: args.base as string,
          sort: args.sort as 'created' | 'updated' | 'popularity' | 'long-running',
          direction: args.direction as 'asc' | 'desc',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'github_get_pull_request':
        return await github.getPullRequest(
          args.owner as string,
          args.repo as string,
          args.pull_number as number
        );

      case 'github_create_pull_request':
        return await github.createPullRequest(args.owner as string, args.repo as string, {
          title: args.title as string,
          head: args.head as string,
          base: args.base as string,
          body: args.body as string,
          draft: args.draft as boolean,
        });

      case 'github_merge_pull_request':
        return await github.mergePullRequest(
          args.owner as string,
          args.repo as string,
          args.pull_number as number,
          {
            commit_title: args.commit_title as string,
            commit_message: args.commit_message as string,
            merge_method: args.merge_method as 'merge' | 'squash' | 'rebase',
          }
        );

      case 'github_list_pr_files':
        return await github.listPRFiles(
          args.owner as string,
          args.repo as string,
          args.pull_number as number,
          {
            per_page: args.per_page as number,
            page: args.page as number,
          }
        );

      case 'github_add_pr_comment':
        return await github.addPRComment(
          args.owner as string,
          args.repo as string,
          args.pull_number as number,
          args.body as string
        );

      case 'github_list_pr_comments':
        return await github.listPRComments(
          args.owner as string,
          args.repo as string,
          args.pull_number as number,
          {
            sort: args.sort as 'created' | 'updated',
            direction: args.direction as 'asc' | 'desc',
            since: args.since as string,
            per_page: args.per_page as number,
            page: args.page as number,
          }
        );

      case 'github_get_pr_comment':
        return await github.getPRComment(
          args.owner as string,
          args.repo as string,
          args.comment_id as number
        );

      // File operations
      case 'github_get_file_content': {
        const content = await github.getFileContent(
          args.owner as string,
          args.repo as string,
          args.path as string,
          args.ref as string
        );
        // Decode base64 content if present
        if (content.content && content.encoding === 'base64') {
          const decoded = Buffer.from(content.content, 'base64').toString('utf-8');
          return { ...content, content: decoded, encoding: 'utf-8' };
        }
        return content;
      }

      case 'github_create_or_update_file': {
        // Encode content to base64
        const base64Content = Buffer.from(args.content as string).toString('base64');
        return await github.createOrUpdateFile(
          args.owner as string,
          args.repo as string,
          args.path as string,
          {
            message: args.message as string,
            content: base64Content,
            sha: args.sha as string,
            branch: args.branch as string,
          }
        );
      }

      case 'github_list_directory':
        return await github.listDirectory(
          args.owner as string,
          args.repo as string,
          (args.path as string) || '',
          args.ref as string
        );

      // GitHub Actions
      case 'github_list_workflows':
        return await github.listWorkflows(args.owner as string, args.repo as string, {
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'github_list_workflow_runs':
        return await github.listWorkflowRuns(
          args.owner as string,
          args.repo as string,
          args.workflow_id as number | string,
          {
            branch: args.branch as string,
            status: args.status as 'queued' | 'in_progress' | 'completed',
            per_page: args.per_page as number,
            page: args.page as number,
          }
        );

      case 'github_trigger_workflow':
        await github.triggerWorkflow(
          args.owner as string,
          args.repo as string,
          args.workflow_id as number | string,
          {
            ref: args.ref as string,
            inputs: args.inputs as Record<string, string>,
          }
        );
        return { success: true, message: 'Workflow dispatch triggered' };

      // Releases
      case 'github_list_releases':
        return await github.listReleases(args.owner as string, args.repo as string, {
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'github_get_release':
        return await github.getRelease(
          args.owner as string,
          args.repo as string,
          args.release_id as number
        );

      case 'github_get_latest_release':
        return await github.getLatestRelease(args.owner as string, args.repo as string);

      case 'github_create_release':
        return await github.createRelease(args.owner as string, args.repo as string, {
          tag_name: args.tag_name as string,
          name: args.name as string,
          body: args.body as string,
          draft: args.draft as boolean,
          prerelease: args.prerelease as boolean,
          target_commitish: args.target_commitish as string,
        });

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Tool call failed: ${name}`, { error });
    throw error;
  }
}

// Create and run the server
async function main(): Promise<void> {
  const server = new Server(
    {
      name: 'github-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await handleToolCall(name, args as ToolArgs);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('GitHub MCP Server started');
}

main().catch((error) => {
  logger.error('Server failed to start', { error });
  process.exit(1);
});
