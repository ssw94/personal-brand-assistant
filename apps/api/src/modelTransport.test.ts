import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAIResponsesTransport } from './modelTransport.js';

const request = { model: 'configured-model', systemInstruction: 'Return JSON.', userInput: '{"value":"safe"}', schemaName: 'TestOutput', jsonSchema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false }, maxOutputTokens: 100, signal: new AbortController().signal };

describe('OpenAI Responses transport', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the Responses API with structured JSON schema output', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => { capturedInit = init; return new Response(JSON.stringify({ id: 'resp-1', output_text: '{"ok":true}', usage: { input_tokens: 4, output_tokens: 3, total_tokens: 7 } }), { status: 200, headers: { 'content-type': 'application/json' } }); });
    vi.stubGlobal('fetch', fetchMock);
    const result = await new OpenAIResponsesTransport({ apiKey: 'server-only', baseUrl: 'https://api.openai.com/v1' }).complete(request);
    expect(result.outputText).toBe('{"ok":true}');
    expect(result.usage.totalTokens).toBe(7);
    expect(fetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/responses', expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer server-only' }) }));
    const body = JSON.parse(capturedInit?.body as string) as { text: { format: { type: string } }; store: boolean };
    expect(body.text.format.type).toBe('json_schema');
    expect(body.store).toBe(false);
  });

  it('normalizes provider status failures without exposing response bodies', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: { message: 'secret provider detail' } }), { status: 429 })));
    await expect(new OpenAIResponsesTransport({ apiKey: 'server-only', baseUrl: 'https://api.openai.com/v1' }).complete(request)).rejects.toMatchObject({ category: 'rate_limit', retryable: true, message: 'The model provider rejected the request.' });
  });

  it('classifies successful responses without structured output as invalid output', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ id: 'resp-2', output: [] }), { status: 200 })));
    await expect(new OpenAIResponsesTransport({ apiKey: 'server-only', baseUrl: 'https://api.openai.com/v1' }).complete(request)).rejects.toMatchObject({ category: 'invalid_output', retryable: false });
  });
});
