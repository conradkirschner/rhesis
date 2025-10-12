'use server';

import { auth } from '@/auth';
import type { Endpoint } from '@/api-client/types.gen';
import { createEndpointEndpointsPost } from '@/api-client/sdk.gen';

export interface CreateEndpointResult {
  success: boolean;
  data?: Endpoint;
  error?: string;
}

export async function createEndpoint(
    payload: Omit<Endpoint, 'id'>
): Promise<CreateEndpointResult> {
  try {
    const session = await auth();
    if (!session?.session_token) {
      return { success: false, error: 'No session token available' };
    }

    const { data } = await createEndpointEndpointsPost({
      body: payload,
      headers: { Authorization: `Bearer ${session.session_token}` },
      baseUrl: process.env.BACKEND_URL,
      throwOnError: true,
    });

    return { success: true, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to create endpoint:', err);
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { success: false, error: message };
  }
}
