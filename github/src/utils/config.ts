import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export interface GitHubConfig {
  token: string;
  apiUrl: string;
  logLevel: string;
}

export interface Config {
  github: GitHubConfig;
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
  const token = getRequiredEnv('GITHUB_TOKEN');
  const apiUrl = getOptionalEnv('GITHUB_API_URL', 'https://api.github.com');
  const logLevel = getOptionalEnv('LOG_LEVEL', 'info');

  return {
    github: {
      token,
      apiUrl,
      logLevel,
    },
    logLevel,
  };
}
