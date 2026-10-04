import { AIError } from './aiErrors.js';
import type { ModelPricing } from './aiConfig.js';

export type ModelTransportRequest = { model: string; systemInstruction: string; userInput: string; schemaName: string; jsonSchema: Record<string, unknown>; maxOutputTokens: number; signal: AbortSignal };
export type ModelTransportResponse = { outputText: string; usage: { inputTokens?: number | undefined; outputTokens?: number | undefined; totalTokens?: number | undefined }; providerRequestId?: string | undefined };
export interface ModelTransport { readonly provider: string; complete(request: ModelTransportRequest): Promise<ModelTransportResponse>; }

export class OpenAIResponsesTransport implements ModelTransport {
  readonly provider = 'openai';
  constructor(private readonly config: { apiKey: string; baseUrl: string }) {}

  async complete(request: ModelTransportRequest): Promise<ModelTransportResponse> {
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/responses`, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.config.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: request.model, store: false, input: [{ role: 'system', content: [{ type: 'input_text', text: request.systemInstruction }] }, { role: 'user', content: [{ type: 'input_text', text: request.userInput }] }], text: { format: { type: 'json_schema', name: request.schemaName, strict: true, schema: request.jsonSchema } }, max_output_tokens: request.maxOutputTokens }),
        signal: request.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw new AIError('cancelled', 'Model request cancelled.');
      throw new AIError('provider_unavailable', 'The model provider could not be reached.', { retryable: true });
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const status = response.status;
      const category = status === 401 || status === 403 ? 'authentication' : status === 429 ? 'rate_limit' : status >= 500 ? 'provider_unavailable' : 'invalid_request';
      throw new AIError(category, 'The model provider rejected the request.', { retryable: category === 'rate_limit' || category === 'provider_unavailable' });
    }
    const outputText = extractOutputText(body);
    if (!outputText) throw new AIError('safety/policy', 'The model provider returned no usable output.');
    const usage = typeof body === 'object' && body !== null && 'usage' in body && typeof body.usage === 'object' && body.usage !== null ? body.usage as Record<string, unknown> : {};
    return { outputText, usage: { inputTokens: numberValue(usage.input_tokens), outputTokens: numberValue(usage.output_tokens), totalTokens: numberValue(usage.total_tokens) }, providerRequestId: typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string' ? body.id : undefined };
  }
}

function numberValue(value: unknown) { return typeof value === 'number' && Number.isInteger(value) ? value : undefined; }
function extractOutputText(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  if ('output_text' in body && typeof body.output_text === 'string') return body.output_text;
  if (!('output' in body) || !Array.isArray(body.output)) return null;
  const text = body.output.flatMap((item) => typeof item === 'object' && item !== null && 'content' in item && Array.isArray(item.content) ? item.content : []).find((item) => typeof item === 'object' && item !== null && 'type' in item && item.type === 'output_text' && 'text' in item && typeof item.text === 'string');
  return text && typeof text === 'object' && 'text' in text && typeof text.text === 'string' ? text.text : null;
}

export type FakeTransportResponse = ModelTransportResponse | AIError;
export class FakeModelTransport implements ModelTransport {
  readonly provider = 'fake';
  private readonly responses: FakeTransportResponse[] = [];
  constructor(private readonly defaultResponse: ModelTransportResponse = { outputText: '{}', usage: {} }) {}
  enqueue(response: FakeTransportResponse) { this.responses.push(response); }
  async complete(request: ModelTransportRequest) { if (request.signal.aborted) throw new AIError('cancelled', 'Model request cancelled.'); const response = this.responses.shift() ?? this.defaultResponse; if (response instanceof AIError) throw response; return response; }
}

export function pricingForModel(pricing: Record<string, ModelPricing>, model: string) { return pricing[model]; }
