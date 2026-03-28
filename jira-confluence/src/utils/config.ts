import dotenv from 'dotenv';

dotenv.config();

export interface JiraConfig {
  baseUrl: string;
  userEmail: string;
  apiToken: string;
}

export interface ConfluenceConfig {
  baseUrl: string;
  userEmail: string;
  apiToken: string;
}

export interface Config {
  jira: JiraConfig;
  confluence: ConfluenceConfig;
  logLevel: string;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export function loadConfig(): Config {
  return {
    jira: {
      baseUrl: getRequiredEnv('JIRA_BASE_URL'),
      userEmail: getRequiredEnv('JIRA_USER_EMAIL'),
      apiToken: getRequiredEnv('JIRA_API_TOKEN'),
    },
    confluence: {
      baseUrl: getRequiredEnv('CONFLUENCE_BASE_URL'),
      userEmail: getRequiredEnv('CONFLUENCE_USER_EMAIL'),
      apiToken: getRequiredEnv('CONFLUENCE_API_TOKEN'),
    },
    logLevel: getOptionalEnv('LOG_LEVEL', 'info'),
  };
}
