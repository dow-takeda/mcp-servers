/**
 * Generate PRIVATE-TOKEN authorization header for GitLab API
 * This is the recommended authentication method for GitLab API
 * @param token - GitLab Personal Access Token
 * @returns The token value (to be used with PRIVATE-TOKEN header)
 */
export function generatePrivateTokenAuth(token: string): string {
  return token;
}

/**
 * Generate OAuth2 Bearer token authorization header for GitLab API
 * Alternative authentication method using OAuth2
 * @param token - GitLab OAuth2 access token
 * @returns Authorization header value
 */
export function generateBearerAuth(token: string): string {
  return `Bearer ${token}`;
}
