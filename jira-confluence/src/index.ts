#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { loadConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { JiraClient } from './jira/client.js';
import { ConfluenceClient } from './confluence/client.js';

// Load configuration
const config = loadConfig();
logger.setLevel(config.logLevel as any);

// Initialize clients
const jiraClient = new JiraClient(config.jira);
const confluenceClient = new ConfluenceClient(config.confluence);

// Define available tools
const tools: Tool[] = [
  // JIRA Tools
  {
    name: 'jira_search_issues',
    description:
      'Search for JIRA issues using JQL (JIRA Query Language). Returns a list of issues matching the query.',
    inputSchema: {
      type: 'object',
      properties: {
        jql: {
          type: 'string',
          description: 'JQL query string (e.g., "project = PROJ AND status = Open")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 50)',
          default: 50,
        },
      },
      required: ['jql'],
    },
  },
  {
    name: 'jira_get_issue',
    description: 'Get detailed information about a specific JIRA issue by its key (e.g., PROJ-123)',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_create_issue',
    description: 'Create a new JIRA issue in a specified project',
    inputSchema: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'The project key (e.g., PROJ)',
        },
        summary: {
          type: 'string',
          description: 'Issue summary/title',
        },
        issueType: {
          type: 'string',
          description: 'Issue type (e.g., Bug, Task, Story)',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue',
        },
        priority: {
          type: 'string',
          description: 'Priority (e.g., High, Medium, Low)',
        },
      },
      required: ['projectKey', 'summary', 'issueType'],
    },
  },
  {
    name: 'jira_add_comment',
    description: 'Add a comment to an existing JIRA issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
        comment: {
          type: 'string',
          description: 'Comment text to add',
        },
      },
      required: ['issueKey', 'comment'],
    },
  },
  {
    name: 'jira_get_transitions',
    description: 'Get available status transitions for a JIRA issue',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
      },
      required: ['issueKey'],
    },
  },
  {
    name: 'jira_transition_issue',
    description: 'Transition a JIRA issue to a new status',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'The issue key (e.g., PROJ-123)',
        },
        transitionId: {
          type: 'string',
          description: 'The transition ID to apply (get from jira_get_transitions)',
        },
      },
      required: ['issueKey', 'transitionId'],
    },
  },

  // Confluence Tools
  {
    name: 'confluence_list_spaces',
    description: 'List all accessible Confluence spaces',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of spaces to return (default: 25)',
          default: 25,
        },
      },
    },
  },
  {
    name: 'confluence_search_pages',
    description: 'Search for Confluence pages by title and/or space',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Page title to search for',
        },
        spaceKey: {
          type: 'string',
          description: 'Space key to search within',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 25)',
          default: 25,
        },
      },
    },
  },
  {
    name: 'confluence_get_page',
    description: 'Get detailed content of a Confluence page by its ID',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID',
        },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'confluence_create_page',
    description: 'Create a new Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        spaceId: {
          type: 'string',
          description: 'The space ID where the page will be created',
        },
        title: {
          type: 'string',
          description: 'Page title',
        },
        body: {
          type: 'string',
          description: 'Page content in Confluence storage format (HTML-like)',
        },
        parentId: {
          type: 'string',
          description: 'Parent page ID (optional)',
        },
      },
      required: ['spaceId', 'title', 'body'],
    },
  },
  {
    name: 'confluence_update_page',
    description: 'Update an existing Confluence page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'The page ID to update',
        },
        title: {
          type: 'string',
          description: 'New page title (optional)',
        },
        body: {
          type: 'string',
          description: 'New page content in storage format (optional)',
        },
        version: {
          type: 'number',
          description: 'Current version number of the page (required for updates)',
        },
      },
      required: ['pageId', 'version'],
    },
  },
  {
    name: 'confluence_get_space',
    description: 'Get information about a specific Confluence space by its key',
    inputSchema: {
      type: 'object',
      properties: {
        spaceKey: {
          type: 'string',
          description: 'The space key (e.g., DEV, PROJ)',
        },
      },
      required: ['spaceKey'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'jira-confluence-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [{ type: 'text', text: 'Error: No arguments provided' }],
      isError: true,
    };
  }

  try {
    switch (name) {
      // JIRA tool handlers
      case 'jira_search_issues': {
        const result = await jiraClient.searchIssues(args.jql as string, args.maxResults as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'jira_get_issue': {
        const result = await jiraClient.getIssue(args.issueKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'jira_create_issue': {
        const result = await jiraClient.createIssue(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'jira_add_comment': {
        const result = await jiraClient.addComment(args.issueKey as string, args.comment as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'jira_get_transitions': {
        const result = await jiraClient.getTransitions(args.issueKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'jira_transition_issue': {
        await jiraClient.transitionIssue(args.issueKey as string, args.transitionId as string);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully transitioned issue ${args.issueKey}`,
            },
          ],
        };
      }

      // Confluence tool handlers
      case 'confluence_list_spaces': {
        const result = await confluenceClient.listSpaces(args.limit as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_search_pages': {
        const result = await confluenceClient.searchPages(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_get_page': {
        const result = await confluenceClient.getPage(args.pageId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_create_page': {
        const result = await confluenceClient.createPage(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_update_page': {
        const result = await confluenceClient.updatePage(args.pageId as string, args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'confluence_get_space': {
        const result = await confluenceClient.getSpace(args.spaceKey as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error executing tool ${name}:`, errorMessage);
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

// Start server
async function main() {
  logger.info('Starting JIRA/Confluence MCP Server...');

  // Test connections
  const jiraTest = await jiraClient.testConnection();
  if (jiraTest.success) {
    logger.info('JIRA connection successful');
  } else {
    logger.error(`JIRA connection failed: ${jiraTest.error}`);
  }

  const confluenceTest = await confluenceClient.testConnection();
  if (confluenceTest.success) {
    logger.info('Confluence connection successful');
  } else {
    logger.error(`Confluence connection failed: ${confluenceTest.error}`);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('MCP Server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
