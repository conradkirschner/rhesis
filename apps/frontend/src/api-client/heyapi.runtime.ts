/**
 * Runtime config for Hey API Next.js client.
 * Used by client.gen.ts at runtime (both server & client).
 * Avoid server-only imports here.
 */
import type { CreateClientConfig } from './client.gen';

export const createClientConfig: CreateClientConfig = (config) => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    '';

  return {
    ...config,
    baseUrl,
    // Example: add default headers
    // headers: new Headers({ 'X-App': 'rhesis-frontend' }),
  };
};
