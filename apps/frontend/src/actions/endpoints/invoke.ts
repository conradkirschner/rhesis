'use server';

import { auth } from '@/auth';
import { invokeEndpointEndpointsEndpointIdInvokePost } from '@/api-client/sdk.gen';
import type { JsonInput } from '@/api-client/types.gen';

export interface InvokeEndpointResult<TOutput = unknown> {
  success: boolean;
  data?: TOutput;
  error?: string;
}

/**
 * Invoke a server-side Endpoint using the generated SDK.
 *
 * TInput must be a JSON-serializable object: Record<string, JsonInput>
 *
 * Example:
 *   type MyInput = { query: JsonInput; topK?: JsonInput };
 *   type MyOutput = { results: Array<{ id: string; score: number }> };
 *   const res = await invokeEndpoint<MyInput, MyOutput>(endpointId, { query: 'hello', topK: 5 });
 */
export async function invokeEndpoint<
    TInput extends Record<string, JsonInput>,
    TOutput = unknown
>(
    endpointId: string,
    inputData: TInput
): Promise<InvokeEndpointResult<TOutput>> {
  try {
    const session = await auth();
    if (!session?.session_token) {
      return { success: false, error: 'No session token available' };
    }

    const { data } = await invokeEndpointEndpointsEndpointIdInvokePost({
      path: { endpoint_id: endpointId },
      body: inputData,
      headers: { Authorization: `Bearer ${session.session_token}` },
      baseUrl: process.env.BACKEND_URL,
      throwOnError: true,
    });

    return { success: true, data: data as TOutput };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to invoke endpoint:', err);
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { success: false, error: message };
  }
}
