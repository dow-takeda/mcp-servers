/**
 * Generate Basic Authentication header value
 * @param email User email
 * @param apiToken API token
 * @returns Base64 encoded auth string
 */
export function generateBasicAuth(email: string, apiToken: string): string {
  const credentials = `${email}:${apiToken}`;
  const encoded = Buffer.from(credentials).toString('base64');
  return `Basic ${encoded}`;
}
