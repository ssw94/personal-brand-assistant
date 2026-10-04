const sensitiveKey = /(api.?key|token|secret|password|authorization|credential|private.?key|cookie)/i;
const MAX_REDACTED_STRING = 512;

export function redactSensitive(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[TRUNCATED]';
  if (typeof value === 'string') return value.length > MAX_REDACTED_STRING ? `${value.slice(0, MAX_REDACTED_STRING)}…` : value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redactSensitive(item, depth + 1));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, item]) => [key, sensitiveKey.test(key) ? '[REDACTED]' : redactSensitive(item, depth + 1)]));
}

export function redactedError(error: unknown) {
  if (error instanceof Error) return { name: error.name, message: 'Operation failed.' };
  return { name: 'UnknownError', message: 'Unknown error.' };
}
