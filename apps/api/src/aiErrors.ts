export type AIErrorCategory = 'configuration' | 'authentication' | 'rate_limit' | 'timeout' | 'provider_unavailable' | 'invalid_request' | 'invalid_output' | 'safety/policy' | 'cancelled' | 'unknown';

export class AIError extends Error {
  readonly category: AIErrorCategory;
  readonly retryable: boolean;
  readonly providerCode: string | undefined;

  constructor(category: AIErrorCategory, message: string, options: { retryable?: boolean; providerCode?: string } = {}) {
    super(message);
    this.name = 'AIError';
    this.category = category;
    this.retryable = options.retryable ?? false;
    this.providerCode = options.providerCode;
  }
}

export function normalizeAIError(error: unknown): AIError {
  if (error instanceof AIError) return error;
  if (error instanceof DOMException && error.name === 'AbortError') return new AIError('cancelled', 'Model request cancelled.');
  return new AIError('unknown', 'The model request failed.');
}
