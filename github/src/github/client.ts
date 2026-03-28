import axios, { AxiosInstance, AxiosError } from 'axios';
import { GitHubConfig } from '../utils/config.js';
import { generateBearerAuth } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

// Types for GitHub API responses
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  labels: Label[];
  assignees: GitHubUser[];
  milestone: Milestone | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  merged: boolean;
  mergeable: boolean | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface Milestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: 'open' | 'closed';
}

export interface Comment {
  id: number;
  body: string;
  user: GitHubUser;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface FileContent {
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  name: string;
  path: string;
  sha: string;
  size: number;
  html_url: string;
  content?: string;
  encoding?: string;
}

export interface Workflow {
  id: number;
  name: string;
  path: string;
  state: 'active' | 'disabled_manually' | 'disabled_inactivity';
  html_url: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: number;
  name: string;
  workflow_id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null;
  html_url: string;
  run_number: number;
  created_at: string;
  updated_at: string;
  head_branch: string;
  head_sha: string;
}

export interface Release {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  html_url: string;
  created_at: string;
  published_at: string | null;
  author: GitHubUser;
}

export interface PRFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export class GitHubClient {
  private client: AxiosInstance;

  constructor(config: GitHubConfig) {
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        Authorization: generateBearerAuth(config.token),
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((request) => {
      logger.debug('GitHub API Request', {
        method: request.method,
        url: request.url,
      });
      return request;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const status = error.response?.status;
        const message = (error.response?.data as { message?: string })?.message || error.message;

        logger.error('GitHub API Error', {
          status,
          message,
          url: error.config?.url,
        });

        throw error;
      }
    );
  }

  // ==================== Repository Operations ====================

  async listRepos(
    params: {
      type?: 'all' | 'owner' | 'public' | 'private' | 'member';
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Repository[]> {
    const response = await this.client.get<Repository[]>('/user/repos', { params });
    return response.data;
  }

  async listOrgRepos(
    org: string,
    params: {
      type?: 'all' | 'public' | 'private' | 'forks' | 'sources' | 'member';
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Repository[]> {
    const response = await this.client.get<Repository[]>(`/orgs/${org}/repos`, { params });
    return response.data;
  }

  async getRepo(owner: string, repo: string): Promise<Repository> {
    const response = await this.client.get<Repository>(`/repos/${owner}/${repo}`);
    return response.data;
  }

  async createRepo(params: {
    name: string;
    description?: string;
    private?: boolean;
    auto_init?: boolean;
  }): Promise<Repository> {
    const response = await this.client.post<Repository>('/user/repos', params);
    return response.data;
  }

  // ==================== Issue Operations ====================

  async listIssues(
    owner: string,
    repo: string,
    params: {
      state?: 'open' | 'closed' | 'all';
      labels?: string;
      sort?: 'created' | 'updated' | 'comments';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Issue[]> {
    const response = await this.client.get<Issue[]>(`/repos/${owner}/${repo}/issues`, { params });
    return response.data;
  }

  async getIssue(owner: string, repo: string, issueNumber: number): Promise<Issue> {
    const response = await this.client.get<Issue>(`/repos/${owner}/${repo}/issues/${issueNumber}`);
    return response.data;
  }

  async createIssue(
    owner: string,
    repo: string,
    params: {
      title: string;
      body?: string;
      labels?: string[];
      assignees?: string[];
      milestone?: number;
    }
  ): Promise<Issue> {
    const response = await this.client.post<Issue>(`/repos/${owner}/${repo}/issues`, params);
    return response.data;
  }

  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    params: {
      title?: string;
      body?: string;
      state?: 'open' | 'closed';
      labels?: string[];
      assignees?: string[];
      milestone?: number | null;
    }
  ): Promise<Issue> {
    const response = await this.client.patch<Issue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      params
    );
    return response.data;
  }

  async addIssueComment(
    owner: string,
    repo: string,
    issueNumber: number,
    body: string
  ): Promise<Comment> {
    const response = await this.client.post<Comment>(
      `/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      { body }
    );
    return response.data;
  }

  // ==================== Pull Request Operations ====================

  async listPullRequests(
    owner: string,
    repo: string,
    params: {
      state?: 'open' | 'closed' | 'all';
      head?: string;
      base?: string;
      sort?: 'created' | 'updated' | 'popularity' | 'long-running';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<PullRequest[]> {
    const response = await this.client.get<PullRequest[]>(`/repos/${owner}/${repo}/pulls`, {
      params,
    });
    return response.data;
  }

  async getPullRequest(owner: string, repo: string, pullNumber: number): Promise<PullRequest> {
    const response = await this.client.get<PullRequest>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}`
    );
    return response.data;
  }

  async createPullRequest(
    owner: string,
    repo: string,
    params: {
      title: string;
      head: string;
      base: string;
      body?: string;
      draft?: boolean;
    }
  ): Promise<PullRequest> {
    const response = await this.client.post<PullRequest>(`/repos/${owner}/${repo}/pulls`, params);
    return response.data;
  }

  async mergePullRequest(
    owner: string,
    repo: string,
    pullNumber: number,
    params: {
      commit_title?: string;
      commit_message?: string;
      merge_method?: 'merge' | 'squash' | 'rebase';
    } = {}
  ): Promise<{ merged: boolean; message: string }> {
    const response = await this.client.put<{ merged: boolean; message: string }>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
      params
    );
    return response.data;
  }

  async listPRFiles(
    owner: string,
    repo: string,
    pullNumber: number,
    params: { per_page?: number; page?: number } = {}
  ): Promise<PRFile[]> {
    const response = await this.client.get<PRFile[]>(
      `/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
      { params }
    );
    return response.data;
  }

  async addPRComment(
    owner: string,
    repo: string,
    pullNumber: number,
    body: string
  ): Promise<Comment> {
    // PR comments use the issues endpoint
    return this.addIssueComment(owner, repo, pullNumber, body);
  }

  // ==================== File Operations ====================

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<FileContent> {
    const params = ref ? { ref } : {};
    const response = await this.client.get<FileContent>(
      `/repos/${owner}/${repo}/contents/${path}`,
      {
        params,
      }
    );
    return response.data;
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    params: {
      message: string;
      content: string; // Base64 encoded content
      sha?: string; // Required for update
      branch?: string;
    }
  ): Promise<{ content: FileContent; commit: { sha: string; html_url: string } }> {
    const response = await this.client.put<{
      content: FileContent;
      commit: { sha: string; html_url: string };
    }>(`/repos/${owner}/${repo}/contents/${path}`, params);
    return response.data;
  }

  async listDirectory(
    owner: string,
    repo: string,
    path: string = '',
    ref?: string
  ): Promise<FileContent[]> {
    const params = ref ? { ref } : {};
    const response = await this.client.get<FileContent[]>(
      `/repos/${owner}/${repo}/contents/${path}`,
      { params }
    );
    return response.data;
  }

  // ==================== GitHub Actions ====================

  async listWorkflows(
    owner: string,
    repo: string,
    params: { per_page?: number; page?: number } = {}
  ): Promise<{ total_count: number; workflows: Workflow[] }> {
    const response = await this.client.get<{ total_count: number; workflows: Workflow[] }>(
      `/repos/${owner}/${repo}/actions/workflows`,
      { params }
    );
    return response.data;
  }

  async listWorkflowRuns(
    owner: string,
    repo: string,
    workflowId: number | string,
    params: {
      branch?: string;
      status?: 'queued' | 'in_progress' | 'completed';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<{ total_count: number; workflow_runs: WorkflowRun[] }> {
    const response = await this.client.get<{ total_count: number; workflow_runs: WorkflowRun[] }>(
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/runs`,
      { params }
    );
    return response.data;
  }

  async triggerWorkflow(
    owner: string,
    repo: string,
    workflowId: number | string,
    params: {
      ref: string;
      inputs?: Record<string, string>;
    }
  ): Promise<void> {
    await this.client.post(
      `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
      params
    );
  }

  // ==================== Releases ====================

  async listReleases(
    owner: string,
    repo: string,
    params: { per_page?: number; page?: number } = {}
  ): Promise<Release[]> {
    const response = await this.client.get<Release[]>(`/repos/${owner}/${repo}/releases`, {
      params,
    });
    return response.data;
  }

  async getRelease(owner: string, repo: string, releaseId: number): Promise<Release> {
    const response = await this.client.get<Release>(
      `/repos/${owner}/${repo}/releases/${releaseId}`
    );
    return response.data;
  }

  async getLatestRelease(owner: string, repo: string): Promise<Release> {
    const response = await this.client.get<Release>(`/repos/${owner}/${repo}/releases/latest`);
    return response.data;
  }

  async createRelease(
    owner: string,
    repo: string,
    params: {
      tag_name: string;
      name?: string;
      body?: string;
      draft?: boolean;
      prerelease?: boolean;
      target_commitish?: string;
    }
  ): Promise<Release> {
    const response = await this.client.post<Release>(`/repos/${owner}/${repo}/releases`, params);
    return response.data;
  }
}
