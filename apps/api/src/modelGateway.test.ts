import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AIError } from './aiErrors.js';
import { FakeModelTransport, type ModelTransport } from './modelTransport.js';
import { ModelGateway } from './modelGateway.js';
import { PromptRegistry } from './promptRegistry.js';
import type { CreateAgentRunInput, UsageInput } from './agentRunService.js';

const config = { provider: 'openai' as const, apiKey: 'test-only', baseUrl: 'https://example.test/v1', defaultModel: 'test-model', policyModels: { generic: 'test-model', research: 'test-model', topic: 'test-model', writer: 'test-model', critic: 'test-model', revision: 'test-model' }, timeoutMs: 50, maxAttempts: 3, backoffMs: 1, maxInputTokens: 1_000, maxOutputTokens: 100, maxEstimatedCost: null, pricing: {} };
const schema = { ok: true };

function setup() {
  const registry = new PromptRegistry();
  registry.register({ identifier: 'test.prompt', version: 1, systemInstruction: 'Return the requested test object.' });
  const transport = new FakeModelTransport({ outputText: JSON.stringify(schema), usage: { inputTokens: 4, outputTokens: 3, totalTokens: 7 } });
  const runs: Array<{ id: string; status: string; failure?: string; usage?: UsageInput }> = [];
  const store = {
    async create(_input: CreateAgentRunInput) { const run = { id: `run-${runs.length + 1}`, status: 'QUEUED' }; runs.push(run); return run; },
    async start(id: string) { runs.find((run) => run.id === id)!.status = 'RUNNING'; },
    async complete(id: string, usage: UsageInput) { const run = runs.find((candidate) => candidate.id === id)!; run.status = 'COMPLETED'; run.usage = usage; },
    async fail(id: string, category: string, _message: string) { const run = runs.find((candidate) => candidate.id === id)!; run.status = 'FAILED'; run.failure = category; },
    async cancel(id: string) { runs.find((run) => run.id === id)!.status = 'CANCELLED'; },
    async recordUsage(_id: string, _provider: string, _model: string, _usage: UsageInput) {},
  };
  return { gateway: new ModelGateway({ config, transport, promptRegistry: registry, runStore: store, sleep: async () => {} }), transport, runs, store, registry };
}

const request = { userId: 'user-a', operation: 'test.operation', prompt: { identifier: 'test.prompt', version: 1 }, input: { value: 'safe' }, schemaName: 'TestOutput' };

describe('ModelGateway', () => {
  it('validates structured output and records usage', async () => {
    const { gateway, runs } = setup();
    const result = await gateway.generateStructured({ ...request, outputSchema: z.object({ ok: z.boolean() }) });
    expect(result.value).toEqual(schema);
    expect(result.usage.totalTokens).toBe(7);
    expect(runs[0]!.status).toBe('COMPLETED');
  });

  it('turns invalid structured output into a non-retryable controlled error', async () => {
    const { gateway, transport, runs } = setup();
    transport.enqueue({ outputText: 'not-json', usage: {} });
    await expect(gateway.generateStructured({ ...request, outputSchema: z.object({ ok: z.boolean() }) })).rejects.toMatchObject({ category: 'invalid_output', retryable: false });
    expect(runs[0]!.failure).toBe('INVALID_OUTPUT');
  });

  it('retries retryable provider failures and stops on non-retryable errors', async () => {
    const first = setup();
    first.transport.enqueue(new AIError('rate_limit', 'Retry me', { retryable: true }));
    await expect(first.gateway.generateStructured({ ...request, outputSchema: z.object({ ok: z.boolean() }) })).resolves.toMatchObject({ value: schema });
    const second = setup();
    second.transport.enqueue(new AIError('authentication', 'Do not retry'));
    await expect(second.gateway.generateStructured({ ...request, outputSchema: z.object({ ok: z.boolean() }) })).rejects.toMatchObject({ category: 'authentication' });
    expect(second.runs[0]!.failure).toBe('AUTHENTICATION');
  });

  it('enforces budgets before calling the transport', async () => {
    const { gateway, transport, runs } = setup();
    const result = await gateway.generateStructured({ ...request, input: 'x'.repeat(10_000), outputSchema: z.object({ ok: z.boolean() }) }).catch((error: unknown) => error);
    expect(result).toMatchObject({ category: 'invalid_request' });
    expect(runs[0]!.failure).toBe('INVALID_REQUEST');
    expect(transport).toBeDefined();
  });

  it('propagates cancellation and marks the run cancelled', async () => {
    const { runs, store, registry } = setup();
    const transport: ModelTransport = { provider: 'fake', complete: ({ signal }) => new Promise((_resolve, reject) => { signal.addEventListener('abort', () => reject(new AIError('cancelled', 'cancelled')), { once: true }); }) };
    const cancelledGateway = new ModelGateway({ config, transport, promptRegistry: registry, runStore: store });
    const pending = cancelledGateway.generateStructured({ ...request, outputSchema: z.object({ ok: z.boolean() }) });
    await new Promise((resolve) => setTimeout(resolve, 1));
    await cancelledGateway.cancel('run-1');
    await expect(pending).rejects.toMatchObject({ category: 'cancelled' });
    expect(runs[0]!.status).toBe('CANCELLED');
  });
});
