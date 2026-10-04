import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AIError } from './aiErrors.js';
import { FakeModelTransport, type ModelTransport } from './modelTransport.js';
import { ModelGateway } from './modelGateway.js';
import { PromptRegistry } from './promptRegistry.js';
import type { CreateAgentRunInput, UsageInput } from './agentRunService.js';

const config = { provider: 'openai' as const, apiKey: 'test-only', baseUrl: 'https://example.test/v1', defaultModel: 'test-model', policyModels: { generic: 'test-model', research: 'test-model', topic: 'test-model', writer: 'test-model', critic: 'test-model', revision: 'test-model' }, timeoutMs: 50, maxAttempts: 3, backoffMs: 1, maxInputTokens: 1_000, maxOutputTokens: 100, maxEstimatedCost: null, pricing: { 'test-model': { inputPerMillion: 1, outputPerMillion: 1, currency: 'USD' } } };
const schema = { ok: true };
const outputSchema = z.object({ ok: z.boolean() });

function setup() {
  const registry = new PromptRegistry();
  registry.register({ identifier: 'test.prompt', version: 1, systemInstruction: 'Return the requested test object.', schemaName: 'TestOutput', schemaVersion: 1 });
  const transport = new FakeModelTransport({ outputText: JSON.stringify(schema), usage: { inputTokens: 4, outputTokens: 3, totalTokens: 7 } });
  const runs: Array<{ id: string; status: string; failure?: string; usage?: UsageInput }> = [];
  const store = {
    async create(_input: CreateAgentRunInput) { const run = { id: `run-${runs.length + 1}`, status: 'QUEUED' }; runs.push(run); return run; },
    async start(_principal: { userId: string }, id: string) { runs.find((run) => run.id === id)!.status = 'RUNNING'; },
    async complete(_principal: { userId: string }, id: string, usage: UsageInput) { const run = runs.find((candidate) => candidate.id === id)!; run.status = 'COMPLETED'; run.usage = usage; },
    async fail(_principal: { userId: string }, id: string, category: string, _message: string) { const run = runs.find((candidate) => candidate.id === id)!; run.status = 'FAILED'; run.failure = category; },
    async cancel(_principal: { userId: string }, id: string) { runs.find((run) => run.id === id)!.status = 'CANCELLED'; },
    async recordUsage(_principal: { userId: string }, _id: string, _provider: string, _model: string, _usage: UsageInput) {},
  };
  return { gateway: new ModelGateway({ config, transport, promptRegistry: registry, runStore: store, sleep: async () => {} }), transport, runs, store, registry };
}

const request = { principal: { userId: 'user-a' }, operation: 'test.operation', prompt: { identifier: 'test.prompt', version: 1 }, input: { value: 'safe' }, schemaName: 'TestOutput', schemaVersion: 1 };

describe('ModelGateway', () => {
  it('validates structured output and records usage', async () => { const { gateway, runs } = setup(); const result = await gateway.generateStructured({ ...request, outputSchema }); expect(result.value).toEqual(schema); expect(result.usage.totalTokens).toBe(7); expect(runs[0]!.status).toBe('COMPLETED'); });
  it('rejects prompt/schema mismatch before provider execution', async () => { const { gateway, transport } = setup(); await expect(gateway.generateStructured({ ...request, schemaVersion: 2, outputSchema })).rejects.toMatchObject({ category: 'invalid_request' }); expect(transport).toBeDefined(); });
  it('turns invalid structured output into a non-retryable controlled error', async () => { const { gateway, transport, runs } = setup(); transport.enqueue({ outputText: 'not-json', usage: {} }); await expect(gateway.generateStructured({ ...request, outputSchema })).rejects.toMatchObject({ category: 'invalid_output', retryable: false }); expect(runs[0]!.failure).toBe('INVALID_OUTPUT'); });
  it('retries retryable provider failures and stops on non-retryable errors', async () => { const first = setup(); first.transport.enqueue(new AIError('rate_limit', 'Retry me', { retryable: true })); await expect(first.gateway.generateStructured({ ...request, outputSchema })).resolves.toMatchObject({ value: schema }); const second = setup(); second.transport.enqueue(new AIError('authentication', 'Do not retry')); await expect(second.gateway.generateStructured({ ...request, outputSchema })).rejects.toMatchObject({ category: 'authentication' }); expect(second.runs[0]!.failure).toBe('AUTHENTICATION'); });
  it('clamps requested output tokens to the configured maximum', async () => { const { transport } = setup(); const captured: number[] = []; const completing: ModelTransport = { provider: 'fake', complete: async (input) => { captured.push(input.maxOutputTokens); return transport.complete(input); } }; const clamped = new ModelGateway({ config, transport: completing, promptRegistry: setup().registry, runStore: setup().store, sleep: async () => {} }); await clamped.generateStructured({ ...request, maxOutputTokens: 5_000, outputSchema }); expect(captured).toEqual([100]); });
  it('rejects actual usage that exceeds the configured cost budget', async () => { const bounded = setup(); bounded.transport.enqueue({ outputText: JSON.stringify(schema), usage: { inputTokens: 20, outputTokens: 20, totalTokens: 40 } }); const gateway = new ModelGateway({ config: { ...config, maxEstimatedCost: 0.00001 }, transport: bounded.transport, promptRegistry: bounded.registry, runStore: bounded.store, sleep: async () => {} }); await expect(gateway.generateStructured({ ...request, outputSchema })).rejects.toMatchObject({ category: 'invalid_request' }); expect(bounded.runs[0]!.status).toBe('FAILED'); });
  it('cancels during retry backoff without another provider attempt', async () => { let attempts = 0; const retrying: ModelTransport = { provider: 'fake', complete: async () => { attempts += 1; throw new AIError('rate_limit', 'Retry me', { retryable: true }); } }; const registry = setup().registry; const controlled = new ModelGateway({ config, transport: retrying, promptRegistry: registry, runStore: setup().store, sleep: async () => new Promise((resolve) => setTimeout(resolve, 25)) }); const controller = new AbortController(); const pending = controlled.generateStructured({ ...request, signal: controller.signal, outputSchema }); await new Promise((resolve) => setTimeout(resolve, 2)); controller.abort(); await expect(pending).rejects.toMatchObject({ category: 'cancelled' }); expect(attempts).toBe(1); });
  it('propagates cancellation and marks the run cancelled', async () => { const { runs, store, registry } = setup(); const transport: ModelTransport = { provider: 'fake', complete: ({ signal }) => new Promise((_resolve, reject) => { signal.addEventListener('abort', () => reject(new AIError('cancelled', 'cancelled')), { once: true }); }) }; const cancelledGateway = new ModelGateway({ config, transport, promptRegistry: registry, runStore: store }); const pending = cancelledGateway.generateStructured({ ...request, outputSchema }); await new Promise((resolve) => setTimeout(resolve, 1)); await cancelledGateway.cancel({ userId: 'user-a' }, 'run-1'); await expect(pending).rejects.toMatchObject({ category: 'cancelled' }); expect(runs[0]!.status).toBe('CANCELLED'); });
});
