/**
 * Runtime config for Hey API Next.js client.
 * Used by client.gen.ts at runtime (both server & client).
 * Avoid server-only imports here.
 */
import type { CreateClientConfig } from './client.gen';

let currentToken: string | undefined;
export function setHeyApiAuthToken(token?: string) {
  currentToken = token;
}

export const createClientConfig: CreateClientConfig = (config) => {
  const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      process.env.API_BASE_URL ??
      '';

  return {
    ...config,
    baseUrl,
    // Hey API attaches this token only to endpoints that require auth
    // (you can also override later via client.setConfig).
    auth: () => currentToken,
  };
};
