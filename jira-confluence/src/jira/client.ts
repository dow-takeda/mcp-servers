import axios, { AxiosInstance, AxiosError } from 'axios';
import { JiraConfig } from '../utils/config.js';
import { generateBasicAuth } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

export class JiraClient {
  private client: AxiosInstance;

  constructor(config: JiraConfig) {
    const authHeader = generateBasicAuth(config.userEmail, config.apiToken);

    this.client = axios.create({
      baseURL: `${config.baseUrl}/rest/api/3`,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleError(error);
        throw error;
      }
    );
  }

  private handleError(error: AxiosError): void {
    if (error.response) {
      logger.error(`JIRA API Error: ${error.response.status}`, {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      logger.error('JIRA Network Error: No response received', error.message);
    } else {
      logger.error('JIRA Request Error:', error.message);
    }
  }

  /**
   * Test connection to JIRA by fetching current user info
   */
  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      logger.info('Testing JIRA connection...');
      const response = await this.client.get('/myself');
      logger.info('JIRA connection successful', { user: response.data.emailAddress });
      return {
        success: true,
        user: {
          accountId: response.data.accountId,
          emailAddress: response.data.emailAddress,
          displayName: response.data.displayName,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('JIRA connection failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Search for issues using JQL (JIRA Query Language)
   */
  async searchIssues(jql: string, maxResults: number = 50, fields?: string[]): Promise<any> {
    try {
      logger.debug(`Searching JIRA issues with JQL: ${jql}`);
      const params: any = {
        jql,
        maxResults,
      };
      if (fields && fields.length > 0) {
        params.fields = fields.join(',');
      }

      const response = await this.client.get('/search', { params });
      logger.info(`Found ${response.data.total} issues`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get issue details by issue key
   */
  async getIssue(issueKey: string, fields?: string[], expand?: string[]): Promise<any> {
    try {
      logger.debug(`Fetching JIRA issue: ${issueKey}`);
      const params: any = {};
      if (fields && fields.length > 0) {
        params.fields = fields.join(',');
      }
      if (expand && expand.length > 0) {
        params.expand = expand.join(',');
      }

      const response = await this.client.get(`/issue/${issueKey}`, { params });
      logger.info(`Successfully fetched issue: ${issueKey}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new issue
   */
  async createIssue(issueData: {
    projectKey: string;
    summary: string;
    issueType: string;
    description?: string;
    priority?: string;
    assignee?: string;
    labels?: string[];
    [key: string]: any;
  }): Promise<any> {
    try {
      logger.debug(`Creating JIRA issue in project: ${issueData.projectKey}`);

      const fields: any = {
        project: { key: issueData.projectKey },
        summary: issueData.summary,
        issuetype: { name: issueData.issueType },
      };

      if (issueData.description) {
        fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: issueData.description,
                },
              ],
            },
          ],
        };
      }

      if (issueData.priority) {
        fields.priority = { name: issueData.priority };
      }

      if (issueData.assignee) {
        fields.assignee = { id: issueData.assignee };
      }

      if (issueData.labels && issueData.labels.length > 0) {
        fields.labels = issueData.labels;
      }

      const response = await this.client.post('/issue', { fields });
      logger.info(`Successfully created issue: ${response.data.key}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing issue
   */
  async updateIssue(issueKey: string, fields: any): Promise<void> {
    try {
      logger.debug(`Updating JIRA issue: ${issueKey}`);
      await this.client.put(`/issue/${issueKey}`, { fields });
      logger.info(`Successfully updated issue: ${issueKey}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a comment to an issue
   */
  async addComment(issueKey: string, comment: string): Promise<any> {
    try {
      logger.debug(`Adding comment to issue: ${issueKey}`);

      const body = {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        },
      };

      const response = await this.client.post(`/issue/${issueKey}/comment`, body);
      logger.info(`Successfully added comment to issue: ${issueKey}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get available transitions for an issue
   */
  async getTransitions(issueKey: string): Promise<any> {
    try {
      logger.debug(`Fetching transitions for issue: ${issueKey}`);
      const response = await this.client.get(`/issue/${issueKey}/transitions`);
      return response.data.transitions;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transition an issue to a new status
   */
  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    try {
      logger.debug(`Transitioning issue ${issueKey} to transition: ${transitionId}`);
      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: { id: transitionId },
      });
      logger.info(`Successfully transitioned issue: ${issueKey}`);
    } catch (error) {
      throw error;
    }
  }
}
