'use server';

import { auth } from '@/auth';
import {
  updateEndpointEndpointsEndpointIdPut,
} from '@/api-client/sdk.gen';
import type {
  EndpointDetail,
  UpdateEndpointEndpointsEndpointIdPutData,
} from '@/api-client/types.gen';

export interface UpdateEndpointResult {
  success: boolean;
  data?: EndpointDetail;
  error?: string;
}

/**
 * Update an Endpoint using the generated SDK (server-side).
 * The `data` type is derived from the SDK’s request shape to stay strictly typed.
 */
export async function updateEndpoint(
    endpointId: string,
    data: UpdateEndpointEndpointsEndpointIdPutData['body']
): Promise<UpdateEndpointResult> {
  try {
    const session = await auth();
    if (!session?.session_token) {
      return { success: false, error: 'No session token available' };
    }

    const { data: updated } = await updateEndpointEndpointsEndpointIdPut({
      path: { endpoint_id: endpointId },
      body: data,
      headers: { Authorization: `Bearer ${session.session_token}` },
      baseUrl: process.env.BACKEND_URL,
      throwOnError: true,
    });

    return { success: true, data: updated as EndpointDetail };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update endpoint:', error);
    const message =
        error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, error: message };
  }
}
