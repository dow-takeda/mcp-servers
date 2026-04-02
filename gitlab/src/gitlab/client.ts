import axios, { AxiosInstance, AxiosError } from 'axios';
import { GitLabConfig } from '../utils/config.js';
import { generatePrivateTokenAuth } from '../utils/auth.js';
import { logger } from '../utils/logger.js';

// Types for GitLab API responses
export interface Project {
  id: number;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  description: string | null;
  visibility: 'private' | 'internal' | 'public';
  web_url: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  default_branch: string;
  created_at: string;
  last_activity_at: string;
  star_count: number;
  forks_count: number;
  open_issues_count: number;
}

export interface Issue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: 'opened' | 'closed';
  web_url: string;
  author: GitLabUser;
  labels: string[];
  assignees: GitLabUser[];
  milestone: Milestone | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface MergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: 'opened' | 'closed' | 'merged' | 'locked';
  web_url: string;
  author: GitLabUser;
  source_branch: string;
  target_branch: string;
  source_project_id: number;
  target_project_id: number;
  merge_status: string;
  merged_by: GitLabUser | null;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  labels: string[];
  assignees: GitLabUser[];
}

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
}

export interface Milestone {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string | null;
  state: 'active' | 'closed';
}

export interface Note {
  id: number;
  body: string;
  author: GitLabUser;
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: string;
  noteable_iid: number;
}

export interface TreeItem {
  id: string;
  name: string;
  type: 'tree' | 'blob';
  path: string;
  mode: string;
}

export interface FileContent {
  file_name: string;
  file_path: string;
  size: number;
  encoding: string;
  content: string;
  content_sha256: string;
  ref: string;
  blob_id: string;
  commit_id: string;
  last_commit_id: string;
}

export interface Pipeline {
  id: number;
  iid: number;
  project_id: number;
  status:
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
    | 'scheduled';
  source: string;
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  name: string;
  status:
    | 'created'
    | 'pending'
    | 'running'
    | 'failed'
    | 'success'
    | 'canceled'
    | 'skipped'
    | 'manual';
  stage: string;
  web_url: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration: number | null;
  pipeline: { id: number };
}

export interface Release {
  tag_name: string;
  name: string | null;
  description: string | null;
  created_at: string;
  released_at: string;
  author: GitLabUser;
  commit: { id: string; title: string };
  assets: {
    count: number;
    links: Array<{ id: number; name: string; url: string }>;
  };
}

export interface MRChanges {
  id: number;
  iid: number;
  changes: Array<{
    old_path: string;
    new_path: string;
    a_mode: string;
    b_mode: string;
    new_file: boolean;
    renamed_file: boolean;
    deleted_file: boolean;
    diff: string;
  }>;
}

export class GitLabClient {
  private client: AxiosInstance;

  constructor(config: GitLabConfig) {
    this.client = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'PRIVATE-TOKEN': generatePrivateTokenAuth(config.token),
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((request) => {
      logger.debug('GitLab API Request', {
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

        logger.error('GitLab API Error', {
          status,
          message,
          url: error.config?.url,
        });

        throw error;
      }
    );
  }

  // Helper to encode project path for URL
  private encodeProjectId(projectId: string | number): string {
    if (typeof projectId === 'number') {
      return String(projectId);
    }
    return encodeURIComponent(projectId);
  }

  // ==================== Project Operations ====================

  async listProjects(
    params: {
      membership?: boolean;
      owned?: boolean;
      visibility?: 'public' | 'internal' | 'private';
      order_by?: 'id' | 'name' | 'path' | 'created_at' | 'updated_at' | 'last_activity_at';
      sort?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Project[]> {
    const response = await this.client.get<Project[]>('/projects', { params });
    return response.data;
  }

  async listGroupProjects(
    groupId: string | number,
    params: {
      visibility?: 'public' | 'internal' | 'private';
      order_by?: 'id' | 'name' | 'path' | 'created_at' | 'updated_at' | 'last_activity_at';
      sort?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Project[]> {
    const response = await this.client.get<Project[]>(
      `/groups/${this.encodeProjectId(groupId)}/projects`,
      { params }
    );
    return response.data;
  }

  async getProject(projectId: string | number): Promise<Project> {
    const response = await this.client.get<Project>(`/projects/${this.encodeProjectId(projectId)}`);
    return response.data;
  }

  async createProject(params: {
    name: string;
    path?: string;
    description?: string;
    visibility?: 'private' | 'internal' | 'public';
    initialize_with_readme?: boolean;
    namespace_id?: number;
  }): Promise<Project> {
    const response = await this.client.post<Project>('/projects', params);
    return response.data;
  }

  // ==================== Issue Operations ====================

  async listIssues(
    projectId: string | number,
    params: {
      state?: 'opened' | 'closed' | 'all';
      labels?: string;
      order_by?: 'created_at' | 'updated_at';
      sort?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Issue[]> {
    const response = await this.client.get<Issue[]>(
      `/projects/${this.encodeProjectId(projectId)}/issues`,
      { params }
    );
    return response.data;
  }

  async getIssue(projectId: string | number, issueIid: number): Promise<Issue> {
    const response = await this.client.get<Issue>(
      `/projects/${this.encodeProjectId(projectId)}/issues/${issueIid}`
    );
    return response.data;
  }

  async createIssue(
    projectId: string | number,
    params: {
      title: string;
      description?: string;
      labels?: string;
      assignee_ids?: number[];
      milestone_id?: number;
    }
  ): Promise<Issue> {
    const response = await this.client.post<Issue>(
      `/projects/${this.encodeProjectId(projectId)}/issues`,
      params
    );
    return response.data;
  }

  async updateIssue(
    projectId: string | number,
    issueIid: number,
    params: {
      title?: string;
      description?: string;
      state_event?: 'close' | 'reopen';
      labels?: string;
      assignee_ids?: number[];
      milestone_id?: number;
    }
  ): Promise<Issue> {
    const response = await this.client.put<Issue>(
      `/projects/${this.encodeProjectId(projectId)}/issues/${issueIid}`,
      params
    );
    return response.data;
  }

  async addIssueComment(projectId: string | number, issueIid: number, body: string): Promise<Note> {
    const response = await this.client.post<Note>(
      `/projects/${this.encodeProjectId(projectId)}/issues/${issueIid}/notes`,
      { body }
    );
    return response.data;
  }

  async listIssueNotes(
    projectId: string | number,
    issueIid: number,
    params: {
      sort?: 'asc' | 'desc';
      order_by?: 'created_at' | 'updated_at';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Note[]> {
    const response = await this.client.get<Note[]>(
      `/projects/${this.encodeProjectId(projectId)}/issues/${issueIid}/notes`,
      { params }
    );
    return response.data;
  }

  async getIssueNote(projectId: string | number, issueIid: number, noteId: number): Promise<Note> {
    const response = await this.client.get<Note>(
      `/projects/${this.encodeProjectId(projectId)}/issues/${issueIid}/notes/${noteId}`
    );
    return response.data;
  }

  // ==================== Merge Request Operations ====================

  async listMergeRequests(
    projectId: string | number,
    params: {
      state?: 'opened' | 'closed' | 'merged' | 'all';
      order_by?: 'created_at' | 'updated_at';
      sort?: 'asc' | 'desc';
      source_branch?: string;
      target_branch?: string;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<MergeRequest[]> {
    const response = await this.client.get<MergeRequest[]>(
      `/projects/${this.encodeProjectId(projectId)}/merge_requests`,
      { params }
    );
    return response.data;
  }

  async getMergeRequest(projectId: string | number, mrIid: number): Promise<MergeRequest> {
    const response = await this.client.get<MergeRequest>(
      `/projects/${this.encodeProjectId(projectId)}/merge_requests/${mrIid}`
    );
    return response.data;
  }

  async createMergeRequest(
    projectId: string | number,
    params: {
      source_branch: string;
      target_branch: string;
      title: string;
      description?: string;
      assignee_ids?: number[];
      labels?: string;
      remove_source_branch?: boolean;
    }
  ): Promise<MergeRequest> {
    const response = await this.client.post<MergeRequest>(
      `/projects/${this.encodeProjectId(projectId)}/merge_requests`,
      params
    );
    return response.data;
  }

  async mergeMergeRequest(
    projectId: string | number,
    mrIid: number,
    params: {
      merge_commit_message?: string;
      squash?: boolean;
      should_remove_source_branch?: boolean;
    } = {}
  ): Promise<MergeRequest> {
    const response = await this.client.put<MergeRequest>(
      `/projects/${this.encodeProjectId(projectId)}/merge_requests/${mrIid}/merge`,
      params
    );
    return response.data;
  }

  async listMRChanges(projectId: string | number, mrIid: number): Promise<MRChanges> {
    const response = await this.client.get<MRChanges>(
      `/projects/${this.encodeProjectId(projectId)}/merge_requests/${mrIid}/changes`
    );
    return response.data;
  }

  async addMRComment(projectId: string | number, mrIid: number, body: string): Promise<Note> {
    const response = await this.client.post<Note>(
      `/projects/${this.encodeProjectId(projectId)}/merge_requests/${mrIid}/notes`,
      { body }
    );
    return response.data;
  }

  async listMRNotes(
    projectId: string | number,
    mrIid: number,
    params: {
      sort?: 'asc' | 'desc';
      order_by?: 'created_at' | 'updated_at';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Note[]> {
    const response = await this.client.get<Note[]>(
      `/projects/${this.encodeProjectId(projectId)}/merge_requests/${mrIid}/notes`,
      { params }
    );
    return response.data;
  }

  async getMRNote(projectId: string | number, mrIid: number, noteId: number): Promise<Note> {
    const response = await this.client.get<Note>(
      `/projects/${this.encodeProjectId(projectId)}/merge_requests/${mrIid}/notes/${noteId}`
    );
    return response.data;
  }

  // ==================== Repository File Operations ====================

  async getFile(
    projectId: string | number,
    filePath: string,
    ref: string = 'main'
  ): Promise<FileContent> {
    const response = await this.client.get<FileContent>(
      `/projects/${this.encodeProjectId(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
      { params: { ref } }
    );
    return response.data;
  }

  async createOrUpdateFile(
    projectId: string | number,
    filePath: string,
    params: {
      branch: string;
      content: string; // Base64 encoded content
      commit_message: string;
      start_branch?: string;
      encoding?: 'base64' | 'text';
    }
  ): Promise<{ file_path: string; branch: string }> {
    // Try to get the file first to determine if it exists
    try {
      await this.getFile(projectId, filePath, params.branch);
      // File exists, update it
      const response = await this.client.put<{ file_path: string; branch: string }>(
        `/projects/${this.encodeProjectId(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
        params
      );
      return response.data;
    } catch {
      // File doesn't exist, create it
      const response = await this.client.post<{ file_path: string; branch: string }>(
        `/projects/${this.encodeProjectId(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
        params
      );
      return response.data;
    }
  }

  async listRepositoryTree(
    projectId: string | number,
    params: {
      path?: string;
      ref?: string;
      recursive?: boolean;
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<TreeItem[]> {
    const response = await this.client.get<TreeItem[]>(
      `/projects/${this.encodeProjectId(projectId)}/repository/tree`,
      { params }
    );
    return response.data;
  }

  // ==================== CI/CD Pipeline Operations ====================

  async listPipelines(
    projectId: string | number,
    params: {
      status?:
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
        | 'scheduled';
      ref?: string;
      order_by?: 'id' | 'status' | 'ref' | 'updated_at' | 'user_id';
      sort?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Pipeline[]> {
    const response = await this.client.get<Pipeline[]>(
      `/projects/${this.encodeProjectId(projectId)}/pipelines`,
      { params }
    );
    return response.data;
  }

  async getPipeline(projectId: string | number, pipelineId: number): Promise<Pipeline> {
    const response = await this.client.get<Pipeline>(
      `/projects/${this.encodeProjectId(projectId)}/pipelines/${pipelineId}`
    );
    return response.data;
  }

  async listPipelineJobs(
    projectId: string | number,
    pipelineId: number,
    params: {
      scope?:
        | 'created'
        | 'pending'
        | 'running'
        | 'failed'
        | 'success'
        | 'canceled'
        | 'skipped'
        | 'manual';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Job[]> {
    const response = await this.client.get<Job[]>(
      `/projects/${this.encodeProjectId(projectId)}/pipelines/${pipelineId}/jobs`,
      { params }
    );
    return response.data;
  }

  async triggerPipeline(
    projectId: string | number,
    params: {
      ref: string;
      variables?: Array<{ key: string; value: string }>;
    }
  ): Promise<Pipeline> {
    const response = await this.client.post<Pipeline>(
      `/projects/${this.encodeProjectId(projectId)}/pipeline`,
      params
    );
    return response.data;
  }

  // ==================== Release Operations ====================

  async listReleases(
    projectId: string | number,
    params: {
      order_by?: 'released_at' | 'created_at';
      sort?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<Release[]> {
    const response = await this.client.get<Release[]>(
      `/projects/${this.encodeProjectId(projectId)}/releases`,
      { params }
    );
    return response.data;
  }

  async getRelease(projectId: string | number, tagName: string): Promise<Release> {
    const response = await this.client.get<Release>(
      `/projects/${this.encodeProjectId(projectId)}/releases/${encodeURIComponent(tagName)}`
    );
    return response.data;
  }

  async createRelease(
    projectId: string | number,
    params: {
      tag_name: string;
      name?: string;
      description?: string;
      ref?: string;
      released_at?: string;
    }
  ): Promise<Release> {
    const response = await this.client.post<Release>(
      `/projects/${this.encodeProjectId(projectId)}/releases`,
      params
    );
    return response.data;
  }

  async getLatestRelease(projectId: string | number): Promise<Release | null> {
    const releases = await this.listReleases(projectId, {
      per_page: 1,
      order_by: 'released_at',
      sort: 'desc',
    });
    return releases.length > 0 ? releases[0] : null;
  }
}
