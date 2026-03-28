import axios, { AxiosInstance, AxiosError } from 'axios';
import { ConfluenceConfig } from '../utils/config.js';
import { generateBasicAuth } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

export class ConfluenceClient {
  private client: AxiosInstance;

  constructor(config: ConfluenceConfig) {
    const authHeader = generateBasicAuth(config.userEmail, config.apiToken);

    this.client = axios.create({
      baseURL: `${config.baseUrl}/wiki/api/v2`,
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
      logger.error(`Confluence API Error: ${error.response.status}`, {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      logger.error('Confluence Network Error: No response received', error.message);
    } else {
      logger.error('Confluence Request Error:', error.message);
    }
  }

  /**
   * Test connection to Confluence by fetching spaces
   */
  async testConnection(): Promise<{ success: boolean; spaces?: any[]; error?: string }> {
    try {
      logger.info('Testing Confluence connection...');
      const response = await this.client.get('/spaces', { params: { limit: 1 } });
      logger.info('Confluence connection successful');
      return {
        success: true,
        spaces: response.data.results,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Confluence connection failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * List all spaces
   */
  async listSpaces(limit: number = 25): Promise<any> {
    try {
      logger.debug('Fetching Confluence spaces');
      const response = await this.client.get('/spaces', {
        params: { limit },
      });
      logger.info(`Found ${response.data.results.length} spaces`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search for pages
   */
  async searchPages(params: {
    title?: string;
    spaceKey?: string;
    limit?: number;
  }): Promise<any> {
    try {
      logger.debug('Searching Confluence pages', params);
      const queryParams: any = {
        limit: params.limit || 25,
      };

      if (params.title) {
        queryParams.title = params.title;
      }
      if (params.spaceKey) {
        queryParams['space-key'] = params.spaceKey;
      }

      const response = await this.client.get('/pages', { params: queryParams });
      logger.info(`Found ${response.data.results.length} pages`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get page by ID
   */
  async getPage(pageId: string, bodyFormat: 'storage' | 'view' = 'storage'): Promise<any> {
    try {
      logger.debug(`Fetching Confluence page: ${pageId}`);
      const response = await this.client.get(`/pages/${pageId}`, {
        params: {
          'body-format': bodyFormat,
        },
      });
      logger.info(`Successfully fetched page: ${response.data.title}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new page
   */
  async createPage(pageData: {
    spaceId: string;
    title: string;
    body: string;
    parentId?: string;
  }): Promise<any> {
    try {
      logger.debug(`Creating Confluence page: ${pageData.title}`);

      const payload: any = {
        spaceId: pageData.spaceId,
        status: 'current',
        title: pageData.title,
        body: {
          representation: 'storage',
          value: pageData.body,
        },
      };

      if (pageData.parentId) {
        payload.parentId = pageData.parentId;
      }

      const response = await this.client.post('/pages', payload);
      logger.info(`Successfully created page: ${response.data.title}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an existing page
   */
  async updatePage(
    pageId: string,
    updateData: {
      title?: string;
      body?: string;
      version: number;
    }
  ): Promise<any> {
    try {
      logger.debug(`Updating Confluence page: ${pageId}`);

      const payload: any = {
        id: pageId,
        status: 'current',
        version: {
          number: updateData.version,
        },
      };

      if (updateData.title) {
        payload.title = updateData.title;
      }

      if (updateData.body) {
        payload.body = {
          representation: 'storage',
          value: updateData.body,
        };
      }

      const response = await this.client.put(`/pages/${pageId}`, payload);
      logger.info(`Successfully updated page: ${pageId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get child pages of a page
   */
  async getChildPages(pageId: string, limit: number = 25): Promise<any> {
    try {
      logger.debug(`Fetching child pages for: ${pageId}`);
      const response = await this.client.get(`/pages/${pageId}/children`, {
        params: { limit },
      });
      logger.info(`Found ${response.data.results.length} child pages`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get space by key
   */
  async getSpace(spaceKey: string): Promise<any> {
    try {
      logger.debug(`Fetching Confluence space: ${spaceKey}`);
      const response = await this.client.get(`/spaces`, {
        params: { keys: spaceKey },
      });
      if (response.data.results.length === 0) {
        throw new Error(`Space not found: ${spaceKey}`);
      }
      logger.info(`Successfully fetched space: ${spaceKey}`);
      return response.data.results[0];
    } catch (error) {
      throw error;
    }
  }
}
