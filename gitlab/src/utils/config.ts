import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface GitLabConfig {
  token: string;
  apiUrl: string;
  logLevel: string;
}

export interface Config {
  gitlab: GitLabConfig;
  logLevel: string;
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export function loadConfig(): Config {
  const token = getRequiredEnv('GITLAB_TOKEN');
  const apiUrl = getOptionalEnv('GITLAB_API_URL', 'https://gitlab.com/api/v4');
  const logLevel = getOptionalEnv('LOG_LEVEL', 'info');

  return {
    gitlab: {
      token,
      apiUrl,
      logLevel,
    },
    logLevel,
  };
}
