export type JsonLike = Record<string, unknown>;

export function parseJsonMap(input?: string): Record<string, unknown> | undefined {
  if (!input || !input.trim()) return undefined;
  try {
    const parsed = JSON.parse(input) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as JsonLike;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function parseStringMap(input?: string): Record<string, string> | undefined {
  if (!input || !input.trim()) return undefined;
  try {
    const parsed = JSON.parse(input) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof v === 'string') out[k] = v;
        else if (v === null || typeof v === 'undefined') {
          // skip nullish
        } else {
          out[k] = JSON.stringify(v);
        }
      }
      return out;
    }
    return undefined;
  } catch {
    return undefined;
  }
}