/**
 * Generate Bearer token authorization header for GitHub API
 * @param token - GitHub Personal Access Token
 * @returns Authorization header value
 */
export function generateBearerAuth(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Generate token authorization header for GitHub API (alternative format)
 * @param token - GitHub Personal Access Token
 * @returns Authorization header value
 */
export function generateTokenAuth(token: string): string {
  return `token ${token}`;
}
