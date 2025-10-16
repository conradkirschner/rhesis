/**
 * Runtime config for Hey API Next.js client.
 * Used by client.gen.ts at runtime (both server & client).
 * Avoid server-only imports here.
 */
import type { CreateClientConfig } from './client.gen';
import {getSessionToken} from "@/api-client/auth.server";

let currentToken: string | undefined;
export function setHeyApiAuthToken() {
  getSessionToken().then((token) => {
    currentToken = token;
  })
}
export async function getToken() {
  const token = await getSessionToken()
  console.log("findme", token);
  return token;
}

export const createClientConfig: CreateClientConfig = (config) => {
  const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.FRONTEND_URL ??
      '';

  return {
    ...config,
    baseUrl: baseUrl+ '/api' ,
    // Hey API attaches this token only to endpoints that require auth
    // (you can also override later via client.setConfig).
    auth: () => getToken(),
  };
};

