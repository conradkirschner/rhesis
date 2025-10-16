export function validateName(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return { isValid: false, message: `${label} is required` };
  if (trimmed.length < 2) return { isValid: false, message: `${label} must be at least 2 characters` };
  return { isValid: true as const, message: '' as const };
}

export function validateOrganizationName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { isValid: false, message: 'Organization name is required' };
  if (trimmed.length < 2) return { isValid: false, message: 'Organization name must be at least 2 characters' };
  return { isValid: true as const, message: '' as const };
}

export function normalizeUrl(input: string) {
  const v = input.trim();
  if (!v) return '';
  try {
    const hasProtocol = /^https?:\/\//i.test(v);
    const url = new URL(hasProtocol ? v : `https://${v}`);
    return url.toString().replace(/\/$/, '');
  } catch {
    return v;
  }
}

export function validateUrl(value: string, opts: { required?: boolean } = {}) {
  const v = value.trim();
  if (!v) return { isValid: !opts.required, message: opts.required ? 'Website is required' : '' };
  try {
    const hasProtocol = /^https?:\/\//i.test(v);
    // eslint-disable-next-line no-new
    new URL(hasProtocol ? v : `https://${v}`);
    return { isValid: true as const, message: '' as const };
  } catch {
    return { isValid: false, message: 'Please enter a valid URL' };
  }
}