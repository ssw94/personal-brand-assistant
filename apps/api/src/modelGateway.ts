import { type ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { estimateCost, loadAIConfig, type AIConfig, type ModelPolicyKey } from './aiConfig.js';
import { AIError, normalizeAIError, type AIErrorCategory } from './aiErrors.js';
import { agentRunService, type CreateAgentRunInput, type UsageInput } from './agentRunService.js';
import { resolveModelPolicy } from './modelPolicy.js';
import type { ModelTransport, ModelTransportResponse } from './modelTransport.js';
import { OpenAIResponsesTransport } from './modelTransport.js';
import { PromptRegistry, type PromptDefinition } from './promptRegistry.js';
import type { AgentFailureCategory } from '@prisma/client';

export type GatewayRequest<T> = { userId: string; operation: string; prompt: { identifier: string; version: number }; input: unknown; outputSchema: ZodType<T>; schemaName: string; policy?: ModelPolicyKey; correlationId?: string; idempotencyKey?: string; signal?: AbortSignal; maxOutputTokens?: number };
export type GatewayResult<T> = { runId: string; value: T; provider: string; model: string; usage: UsageInput; estimatedCost: number | null; providerRequestId?: string | undefined };

type RunStore = {
  create(input: CreateAgentRunInput): Promise<{ id: string }>;
  start(id: string): Promise<unknown>;
  complete(id: string, usage: UsageInput): Promise<unknown>;
  fail(id: string, category: AgentFailureCategory, message: string, usage?: UsageInput): Promise<unknown>;
  cancel(id: string): Promise<unknown>;
  recordUsage(runId: string, provider: string, model: string, usage: UsageInput): Promise<unknown>;
  registerPrompt?(identifier: string, version: number, schemaName: string, templateDigest: string, description?: string): Promise<unknown>;
};

const defaultStore: RunStore = agentRunService;

export type ModelGatewayOptions = { config: AIConfig; transport?: ModelTransport; promptRegistry: PromptRegistry; runStore?: RunStore; sleep?: (milliseconds: number) => Promise<void> };

export class ModelGateway {
  private readonly activeControllers = new Map<string, AbortController>();
  private readonly transport: ModelTransport;
  private readonly store: RunStore;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(private readonly options: ModelGatewayOptions) {
    this.transport = options.transport ?? new OpenAIResponsesTransport(options.config);
    this.store = options.runStore ?? defaultStore;
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  }

  async generateStructured<T>(request: GatewayRequest<T>): Promise<GatewayResult<T>> {
    const definition = this.options.promptRegistry.resolve(request.prompt.identifier, request.prompt.version);
    const policy = resolveModelPolicy(this.options.config, request.policy ?? 'generic');
    await this.store.registerPrompt?.(definition.identifier, definition.version, request.schemaName, this.options.promptRegistry.digest(definition), definition.description);
    const run = await this.store.create({ userId: request.userId, operation: request.operation, provider: this.transport.provider, model: policy.model, promptIdentifier: definition.identifier, promptVersion: definition.version, correlationId: request.correlationId, idempotencyKey: request.idempotencyKey });
    await this.store.start(run.id);
    const controller = new AbortController();
    this.activeControllers.set(run.id, controller);
    const unlink = request.signal ? () => controller.abort() : null;
    request.signal?.addEventListener('abort', unlink!, { once: true });
    try {
      const userInput = JSON.stringify(request.input);
      if (userInput === undefined) throw new AIError('invalid_request', 'Model input must be JSON serializable.');
      const inputTokens = Math.ceil((definition.systemInstruction.length + userInput.length) / 4);
      const maxOutputTokens = request.maxOutputTokens ?? this.options.config.maxOutputTokens;
      const pricing = this.options.config.pricing[policy.model];
      const estimatedCost = estimateCost(pricing, inputTokens, maxOutputTokens);
      if (inputTokens > this.options.config.maxInputTokens) throw new AIError('invalid_request', 'Model input exceeds the configured token budget.');
      if (estimatedCost !== null && this.options.config.maxEstimatedCost !== null && estimatedCost > this.options.config.maxEstimatedCost) throw new AIError('invalid_request', 'Model request exceeds the configured cost budget.');
      const response = await this.withRetries({ model: policy.model, systemInstruction: definition.systemInstruction, userInput, schemaName: request.schemaName, jsonSchema: zodToJsonSchema(request.outputSchema, { name: request.schemaName, $refStrategy: 'none' }) as Record<string, unknown>, maxOutputTokens, signal: controller.signal });
      const value = parseStructuredOutput(response.outputText, request.outputSchema);
      const usage = { inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens, totalTokens: response.usage.totalTokens, estimatedCost: estimateCost(pricing, response.usage.inputTokens ?? inputTokens, response.usage.outputTokens ?? maxOutputTokens), costCurrency: pricing?.currency ?? null };
      await this.store.recordUsage(run.id, this.transport.provider, policy.model, usage);
      await this.store.complete(run.id, usage);
      return { runId: run.id, value, provider: this.transport.provider, model: policy.model, usage, estimatedCost: usage.estimatedCost, providerRequestId: response.providerRequestId };
    } catch (error) {
      const normalized = normalizeAIError(error);
      if (normalized.category === 'cancelled') await this.store.cancel(run.id);
      else await this.store.fail(run.id, toRunFailureCategory(normalized.category), normalized.message);
      throw normalized;
    } finally {
      this.activeControllers.delete(run.id);
      if (unlink) request.signal?.removeEventListener('abort', unlink);
    }
  }

  cancel(runId: string) { this.activeControllers.get(runId)?.abort(); return this.store.cancel(runId); }

  private async withRetries(request: Parameters<ModelTransport['complete']>[0]): Promise<ModelTransportResponse> {
    let lastError: AIError | undefined;
    for (let attempt = 1; attempt <= this.options.config.maxAttempts; attempt += 1) {
      try { return await this.withTimeout(request); } catch (error) {
        const normalized = normalizeAIError(error);
        if (normalized.category === 'cancelled' || !normalized.retryable || attempt === this.options.config.maxAttempts) throw normalized;
        lastError = normalized;
        await this.sleep(this.options.config.backoffMs * 2 ** (attempt - 1));
      }
    }
    throw lastError ?? new AIError('unknown', 'The model request failed.');
  }

  private async withTimeout(request: Parameters<ModelTransport['complete']>[0]) {
    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort(), this.options.config.timeoutMs);
    const abort = () => timeoutController.abort();
    request.signal.addEventListener('abort', abort, { once: true });
    try {
      return await this.transport.complete({ ...request, signal: timeoutController.signal });
    } catch (error) {
      if (timeoutController.signal.aborted && !request.signal.aborted) throw new AIError('timeout', 'The model request timed out.', { retryable: true });
      throw error;
    } finally {
      clearTimeout(timer);
      request.signal.removeEventListener('abort', abort);
    }
  }
}

export function createConfiguredModelGateway() { const promptRegistry = new PromptRegistry(); return new ModelGateway({ config: loadAIConfig(), promptRegistry }); }

function parseStructuredOutput<T>(text: string, schema: ZodType<T>): T {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new AIError('invalid_output', 'The model returned invalid structured output.'); }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new AIError('invalid_output', 'The model returned output that failed schema validation.');
  return result.data;
}

function toRunFailureCategory(category: AIErrorCategory) {
  return category === 'safety/policy' ? 'SAFETY_POLICY' : category.toUpperCase() as 'CONFIGURATION' | 'AUTHENTICATION' | 'RATE_LIMIT' | 'TIMEOUT' | 'PROVIDER_UNAVAILABLE' | 'INVALID_REQUEST' | 'INVALID_OUTPUT' | 'CANCELLED' | 'UNKNOWN';
}

export type { PromptDefinition };
