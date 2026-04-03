import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { GitLabClient } from './gitlab/client.js';

// Load configuration
const config = loadConfig();
logger.setLevel(config.logLevel);

// Initialize GitLab client
const gitlab = new GitLabClient(config.gitlab);

// Tool definitions
const tools: Tool[] = [
  // Project Tools
  {
    name: 'gitlab_list_projects',
    description: 'List projects accessible by the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        membership: { type: 'boolean', description: 'Limit to projects the user is a member of' },
        owned: { type: 'boolean', description: 'Limit to projects owned by the user' },
        visibility: {
          type: 'string',
          enum: ['public', 'internal', 'private'],
          description: 'Filter by visibility',
        },
        order_by: {
          type: 'string',
          enum: ['id', 'name', 'path', 'created_at', 'updated_at', 'last_activity_at'],
          description: 'Order by field',
        },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
    },
  },
  {
    name: 'gitlab_list_group_projects',
    description: 'List projects within a group',
    inputSchema: {
      type: 'object',
      properties: {
        group_id: { type: ['string', 'number'], description: 'Group ID or URL-encoded path' },
        visibility: {
          type: 'string',
          enum: ['public', 'internal', 'private'],
          description: 'Filter by visibility',
        },
        order_by: {
          type: 'string',
          enum: ['id', 'name', 'path', 'created_at', 'updated_at', 'last_activity_at'],
          description: 'Order by field',
        },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['group_id'],
    },
  },
  {
    name: 'gitlab_get_project',
    description: 'Get project details',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path (e.g., "namespace/project")',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'gitlab_create_project',
    description: 'Create a new project',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        path: { type: 'string', description: 'Project path (slug)' },
        description: { type: 'string', description: 'Project description' },
        visibility: {
          type: 'string',
          enum: ['private', 'internal', 'public'],
          description: 'Project visibility',
        },
        initialize_with_readme: { type: 'boolean', description: 'Initialize with README' },
        namespace_id: { type: 'number', description: 'Namespace ID to create project in' },
      },
      required: ['name'],
    },
  },

  // Issue Tools
  {
    name: 'gitlab_list_issues',
    description: 'List issues for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        state: {
          type: 'string',
          enum: ['opened', 'closed', 'all'],
          description: 'Issue state filter',
        },
        labels: { type: 'string', description: 'Comma-separated list of label names' },
        order_by: {
          type: 'string',
          enum: ['created_at', 'updated_at'],
          description: 'Order by field',
        },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'gitlab_get_issue',
    description: 'Get issue details',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        issue_iid: { type: 'number', description: 'Issue internal ID (IID)' },
      },
      required: ['project_id', 'issue_iid'],
    },
  },
  {
    name: 'gitlab_create_issue',
    description: 'Create a new issue',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description' },
        labels: { type: 'string', description: 'Comma-separated list of label names' },
        assignee_ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'User IDs to assign',
        },
        milestone_id: { type: 'number', description: 'Milestone ID' },
      },
      required: ['project_id', 'title'],
    },
  },
  {
    name: 'gitlab_update_issue',
    description: 'Update an existing issue',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        issue_iid: { type: 'number', description: 'Issue internal ID (IID)' },
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description' },
        state_event: {
          type: 'string',
          enum: ['close', 'reopen'],
          description: 'State change event',
        },
        labels: { type: 'string', description: 'Comma-separated list of label names' },
        assignee_ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'User IDs to assign',
        },
        milestone_id: { type: 'number', description: 'Milestone ID' },
      },
      required: ['project_id', 'issue_iid'],
    },
  },
  {
    name: 'gitlab_add_issue_comment',
    description: 'Add a comment (note) to an issue',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        issue_iid: { type: 'number', description: 'Issue internal ID (IID)' },
        body: { type: 'string', description: 'Comment body' },
      },
      required: ['project_id', 'issue_iid', 'body'],
    },
  },
  {
    name: 'gitlab_list_issue_notes',
    description: 'List comments (notes) on an issue',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        issue_iid: { type: 'number', description: 'Issue internal ID (IID)' },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        order_by: {
          type: 'string',
          enum: ['created_at', 'updated_at'],
          description: 'Order by field',
        },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['project_id', 'issue_iid'],
    },
  },
  {
    name: 'gitlab_get_issue_note',
    description: 'Get a specific comment (note) on an issue',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        issue_iid: { type: 'number', description: 'Issue internal ID (IID)' },
        note_id: { type: 'number', description: 'Note ID' },
      },
      required: ['project_id', 'issue_iid', 'note_id'],
    },
  },

  // Merge Request Tools
  {
    name: 'gitlab_list_merge_requests',
    description: 'List merge requests for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        state: {
          type: 'string',
          enum: ['opened', 'closed', 'merged', 'all'],
          description: 'MR state filter',
        },
        order_by: {
          type: 'string',
          enum: ['created_at', 'updated_at'],
          description: 'Order by field',
        },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        source_branch: { type: 'string', description: 'Filter by source branch' },
        target_branch: { type: 'string', description: 'Filter by target branch' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'gitlab_get_merge_request',
    description: 'Get merge request details',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        mr_iid: { type: 'number', description: 'Merge request internal ID (IID)' },
      },
      required: ['project_id', 'mr_iid'],
    },
  },
  {
    name: 'gitlab_create_merge_request',
    description: 'Create a new merge request',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        source_branch: { type: 'string', description: 'Source branch name' },
        target_branch: { type: 'string', description: 'Target branch name' },
        title: { type: 'string', description: 'MR title' },
        description: { type: 'string', description: 'MR description' },
        assignee_ids: {
          type: 'array',
          items: { type: 'number' },
          description: 'User IDs to assign',
        },
        labels: { type: 'string', description: 'Comma-separated list of label names' },
        remove_source_branch: {
          type: 'boolean',
          description: 'Remove source branch after merge',
        },
      },
      required: ['project_id', 'source_branch', 'target_branch', 'title'],
    },
  },
  {
    name: 'gitlab_merge_merge_request',
    description: 'Merge a merge request',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        mr_iid: { type: 'number', description: 'Merge request internal ID (IID)' },
        merge_commit_message: { type: 'string', description: 'Custom merge commit message' },
        squash: { type: 'boolean', description: 'Squash commits before merge' },
        should_remove_source_branch: {
          type: 'boolean',
          description: 'Remove source branch after merge',
        },
      },
      required: ['project_id', 'mr_iid'],
    },
  },
  {
    name: 'gitlab_list_mr_changes',
    description: 'List files changed in a merge request',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        mr_iid: { type: 'number', description: 'Merge request internal ID (IID)' },
      },
      required: ['project_id', 'mr_iid'],
    },
  },
  {
    name: 'gitlab_add_mr_comment',
    description: 'Add a comment (note) to a merge request',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        mr_iid: { type: 'number', description: 'Merge request internal ID (IID)' },
        body: { type: 'string', description: 'Comment body' },
      },
      required: ['project_id', 'mr_iid', 'body'],
    },
  },
  {
    name: 'gitlab_list_mr_notes',
    description: 'List comments (notes) on a merge request',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        mr_iid: { type: 'number', description: 'Merge request internal ID (IID)' },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        order_by: {
          type: 'string',
          enum: ['created_at', 'updated_at'],
          description: 'Order by field',
        },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['project_id', 'mr_iid'],
    },
  },
  {
    name: 'gitlab_get_mr_note',
    description: 'Get a specific comment (note) on a merge request',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        mr_iid: { type: 'number', description: 'Merge request internal ID (IID)' },
        note_id: { type: 'number', description: 'Note ID' },
      },
      required: ['project_id', 'mr_iid', 'note_id'],
    },
  },

  // Repository File Tools
  {
    name: 'gitlab_get_file',
    description: 'Get file content from a repository',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        file_path: { type: 'string', description: 'File path within the repository' },
        ref: { type: 'string', description: 'Branch, tag, or commit SHA (default: main)' },
      },
      required: ['project_id', 'file_path'],
    },
  },
  {
    name: 'gitlab_create_or_update_file',
    description: 'Create or update a file in a repository',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        file_path: { type: 'string', description: 'File path within the repository' },
        branch: { type: 'string', description: 'Target branch name' },
        content: {
          type: 'string',
          description: 'File content (plain text, will be base64 encoded)',
        },
        commit_message: { type: 'string', description: 'Commit message' },
        start_branch: { type: 'string', description: 'Start branch if creating new branch' },
      },
      required: ['project_id', 'file_path', 'branch', 'content', 'commit_message'],
    },
  },
  {
    name: 'gitlab_list_repository_tree',
    description: 'List directory contents (repository tree) in a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        path: { type: 'string', description: 'Directory path (empty for root)' },
        ref: { type: 'string', description: 'Branch, tag, or commit SHA' },
        recursive: { type: 'boolean', description: 'List files recursively' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['project_id'],
    },
  },

  // CI/CD Pipeline Tools
  {
    name: 'gitlab_list_pipelines',
    description: 'List pipelines for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        status: {
          type: 'string',
          enum: [
            'created',
            'waiting_for_resource',
            'preparing',
            'pending',
            'running',
            'success',
            'failed',
            'canceled',
            'skipped',
            'manual',
            'scheduled',
          ],
          description: 'Filter by status',
        },
        ref: { type: 'string', description: 'Filter by ref (branch or tag)' },
        order_by: {
          type: 'string',
          enum: ['id', 'status', 'ref', 'updated_at', 'user_id'],
          description: 'Order by field',
        },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'gitlab_get_pipeline',
    description: 'Get pipeline details',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        pipeline_id: { type: 'number', description: 'Pipeline ID' },
      },
      required: ['project_id', 'pipeline_id'],
    },
  },
  {
    name: 'gitlab_list_pipeline_jobs',
    description: 'List jobs for a pipeline',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        pipeline_id: { type: 'number', description: 'Pipeline ID' },
        scope: {
          type: 'string',
          enum: [
            'created',
            'pending',
            'running',
            'failed',
            'success',
            'canceled',
            'skipped',
            'manual',
          ],
          description: 'Filter by job status',
        },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['project_id', 'pipeline_id'],
    },
  },
  {
    name: 'gitlab_trigger_pipeline',
    description: 'Trigger a new pipeline',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        ref: { type: 'string', description: 'Branch or tag to run pipeline on' },
        variables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['key', 'value'],
          },
          description: 'Pipeline variables',
        },
      },
      required: ['project_id', 'ref'],
    },
  },

  // Release Tools
  {
    name: 'gitlab_list_releases',
    description: 'List releases for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        order_by: {
          type: 'string',
          enum: ['released_at', 'created_at'],
          description: 'Order by field',
        },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        per_page: { type: 'number', description: 'Results per page (max 100)' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'gitlab_get_release',
    description: 'Get release details by tag name',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        tag_name: { type: 'string', description: 'Tag name for the release' },
      },
      required: ['project_id', 'tag_name'],
    },
  },
  {
    name: 'gitlab_create_release',
    description: 'Create a new release',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
        tag_name: { type: 'string', description: 'Tag name for the release' },
        name: { type: 'string', description: 'Release name' },
        description: { type: 'string', description: 'Release description (supports Markdown)' },
        ref: { type: 'string', description: 'Branch or commit SHA to create tag from' },
        released_at: { type: 'string', description: 'Release date (ISO 8601 format)' },
      },
      required: ['project_id', 'tag_name'],
    },
  },
  {
    name: 'gitlab_get_latest_release',
    description: 'Get the latest release for a project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: ['string', 'number'],
          description: 'Project ID or URL-encoded path',
        },
      },
      required: ['project_id'],
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
      // Project operations
      case 'gitlab_list_projects':
        return await gitlab.listProjects({
          membership: args.membership as boolean,
          owned: args.owned as boolean,
          visibility: args.visibility as 'public' | 'internal' | 'private',
          order_by: args.order_by as
            | 'id'
            | 'name'
            | 'path'
            | 'created_at'
            | 'updated_at'
            | 'last_activity_at',
          sort: args.sort as 'asc' | 'desc',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'gitlab_list_group_projects':
        return await gitlab.listGroupProjects(args.group_id as string | number, {
          visibility: args.visibility as 'public' | 'internal' | 'private',
          order_by: args.order_by as
            | 'id'
            | 'name'
            | 'path'
            | 'created_at'
            | 'updated_at'
            | 'last_activity_at',
          sort: args.sort as 'asc' | 'desc',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'gitlab_get_project':
        return await gitlab.getProject(args.project_id as string | number);

      case 'gitlab_create_project':
        return await gitlab.createProject({
          name: args.name as string,
          path: args.path as string,
          description: args.description as string,
          visibility: args.visibility as 'private' | 'internal' | 'public',
          initialize_with_readme: args.initialize_with_readme as boolean,
          namespace_id: args.namespace_id as number,
        });

      // Issue operations
      case 'gitlab_list_issues':
        return await gitlab.listIssues(args.project_id as string | number, {
          state: args.state as 'opened' | 'closed' | 'all',
          labels: args.labels as string,
          order_by: args.order_by as 'created_at' | 'updated_at',
          sort: args.sort as 'asc' | 'desc',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'gitlab_get_issue':
        return await gitlab.getIssue(args.project_id as string | number, args.issue_iid as number);

      case 'gitlab_create_issue':
        return await gitlab.createIssue(args.project_id as string | number, {
          title: args.title as string,
          description: args.description as string,
          labels: args.labels as string,
          assignee_ids: args.assignee_ids as number[],
          milestone_id: args.milestone_id as number,
        });

      case 'gitlab_update_issue':
        return await gitlab.updateIssue(
          args.project_id as string | number,
          args.issue_iid as number,
          {
            title: args.title as string,
            description: args.description as string,
            state_event: args.state_event as 'close' | 'reopen',
            labels: args.labels as string,
            assignee_ids: args.assignee_ids as number[],
            milestone_id: args.milestone_id as number,
          }
        );

      case 'gitlab_add_issue_comment':
        return await gitlab.addIssueComment(
          args.project_id as string | number,
          args.issue_iid as number,
          args.body as string
        );

      case 'gitlab_list_issue_notes':
        return await gitlab.listIssueNotes(
          args.project_id as string | number,
          args.issue_iid as number,
          {
            sort: args.sort as 'asc' | 'desc',
            order_by: args.order_by as 'created_at' | 'updated_at',
            per_page: args.per_page as number,
            page: args.page as number,
          }
        );

      case 'gitlab_get_issue_note':
        return await gitlab.getIssueNote(
          args.project_id as string | number,
          args.issue_iid as number,
          args.note_id as number
        );

      // Merge request operations
      case 'gitlab_list_merge_requests':
        return await gitlab.listMergeRequests(args.project_id as string | number, {
          state: args.state as 'opened' | 'closed' | 'merged' | 'all',
          order_by: args.order_by as 'created_at' | 'updated_at',
          sort: args.sort as 'asc' | 'desc',
          source_branch: args.source_branch as string,
          target_branch: args.target_branch as string,
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'gitlab_get_merge_request':
        return await gitlab.getMergeRequest(
          args.project_id as string | number,
          args.mr_iid as number
        );

      case 'gitlab_create_merge_request':
        return await gitlab.createMergeRequest(args.project_id as string | number, {
          source_branch: args.source_branch as string,
          target_branch: args.target_branch as string,
          title: args.title as string,
          description: args.description as string,
          assignee_ids: args.assignee_ids as number[],
          labels: args.labels as string,
          remove_source_branch: args.remove_source_branch as boolean,
        });

      case 'gitlab_merge_merge_request':
        return await gitlab.mergeMergeRequest(
          args.project_id as string | number,
          args.mr_iid as number,
          {
            merge_commit_message: args.merge_commit_message as string,
            squash: args.squash as boolean,
            should_remove_source_branch: args.should_remove_source_branch as boolean,
          }
        );

      case 'gitlab_list_mr_changes':
        return await gitlab.listMRChanges(
          args.project_id as string | number,
          args.mr_iid as number
        );

      case 'gitlab_add_mr_comment':
        return await gitlab.addMRComment(
          args.project_id as string | number,
          args.mr_iid as number,
          args.body as string
        );

      case 'gitlab_list_mr_notes':
        return await gitlab.listMRNotes(args.project_id as string | number, args.mr_iid as number, {
          sort: args.sort as 'asc' | 'desc',
          order_by: args.order_by as 'created_at' | 'updated_at',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'gitlab_get_mr_note':
        return await gitlab.getMRNote(
          args.project_id as string | number,
          args.mr_iid as number,
          args.note_id as number
        );

      // File operations
      case 'gitlab_get_file': {
        const content = await gitlab.getFile(
          args.project_id as string | number,
          args.file_path as string,
          (args.ref as string) || 'main'
        );
        // Decode base64 content if present
        if (content.content && content.encoding === 'base64') {
          const decoded = Buffer.from(content.content, 'base64').toString('utf-8');
          return { ...content, content: decoded, encoding: 'utf-8' };
        }
        return content;
      }

      case 'gitlab_create_or_update_file': {
        // Encode content to base64
        const base64Content = Buffer.from(args.content as string).toString('base64');
        return await gitlab.createOrUpdateFile(
          args.project_id as string | number,
          args.file_path as string,
          {
            branch: args.branch as string,
            content: base64Content,
            commit_message: args.commit_message as string,
            start_branch: args.start_branch as string,
            encoding: 'base64',
          }
        );
      }

      case 'gitlab_list_repository_tree':
        return await gitlab.listRepositoryTree(args.project_id as string | number, {
          path: args.path as string,
          ref: args.ref as string,
          recursive: args.recursive as boolean,
          per_page: args.per_page as number,
          page: args.page as number,
        });

      // Pipeline operations
      case 'gitlab_list_pipelines':
        return await gitlab.listPipelines(args.project_id as string | number, {
          status: args.status as
            | 'created'
            | 'waiting_for_resource'
            | 'preparing'
            | 'pending'
            | 'running'
            | 'success'
            | 'failed'
            | 'canceled'
            | 'skipped'
            | 'manual'
            | 'scheduled',
          ref: args.ref as string,
          order_by: args.order_by as 'id' | 'status' | 'ref' | 'updated_at' | 'user_id',
          sort: args.sort as 'asc' | 'desc',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'gitlab_get_pipeline':
        return await gitlab.getPipeline(
          args.project_id as string | number,
          args.pipeline_id as number
        );

      case 'gitlab_list_pipeline_jobs':
        return await gitlab.listPipelineJobs(
          args.project_id as string | number,
          args.pipeline_id as number,
          {
            scope: args.scope as
              | 'created'
              | 'pending'
              | 'running'
              | 'failed'
              | 'success'
              | 'canceled'
              | 'skipped'
              | 'manual',
            per_page: args.per_page as number,
            page: args.page as number,
          }
        );

      case 'gitlab_trigger_pipeline':
        return await gitlab.triggerPipeline(args.project_id as string | number, {
          ref: args.ref as string,
          variables: args.variables as Array<{ key: string; value: string }>,
        });

      // Release operations
      case 'gitlab_list_releases':
        return await gitlab.listReleases(args.project_id as string | number, {
          order_by: args.order_by as 'released_at' | 'created_at',
          sort: args.sort as 'asc' | 'desc',
          per_page: args.per_page as number,
          page: args.page as number,
        });

      case 'gitlab_get_release':
        return await gitlab.getRelease(args.project_id as string | number, args.tag_name as string);

      case 'gitlab_create_release':
        return await gitlab.createRelease(args.project_id as string | number, {
          tag_name: args.tag_name as string,
          name: args.name as string,
          description: args.description as string,
          ref: args.ref as string,
          released_at: args.released_at as string,
        });

      case 'gitlab_get_latest_release':
        return await gitlab.getLatestRelease(args.project_id as string | number);

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
      name: 'gitlab-mcp-server',
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

  logger.info('GitLab MCP Server started');
}

main().catch((error) => {
  logger.error('Server failed to start', { error });
  process.exit(1);
});
