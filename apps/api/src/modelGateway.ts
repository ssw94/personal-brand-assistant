import { type ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { withIdempotency } from './idempotency.js';
import { estimateCost, loadAIConfig, type AIConfig, type ModelPolicyKey } from './aiConfig.js';
import { AIError, normalizeAIError, type AIErrorCategory } from './aiErrors.js';
import { agentRunService, type AuthenticatedPrincipal, type CreateAgentRunInput, type UsageInput } from './agentRunService.js';
import { resolveModelPolicy } from './modelPolicy.js';
import type { ModelTransport, ModelTransportResponse } from './modelTransport.js';
import { createModelTransport } from './modelTransport.js';
import { PromptRegistry, type PromptDefinition } from './promptRegistry.js';
import type { AgentFailureCategory } from '@prisma/client';

export type GatewayRequest<T> = { principal: AuthenticatedPrincipal; operation: string; prompt: { identifier: string; version: number }; input: unknown; outputSchema: ZodType<T>; schemaName: string; schemaVersion: number; policy?: ModelPolicyKey; correlationId?: string; idempotencyKey?: string; signal?: AbortSignal; maxOutputTokens?: number };
export type GatewayResult<T> = { runId: string; value: T; provider: string; model: string; usage: UsageInput; estimatedCost: number | null; providerRequestId?: string | undefined };

type RunStore = {
  create(input: CreateAgentRunInput): Promise<{ id: string }>;
  start(principal: AuthenticatedPrincipal, id: string): Promise<unknown>;
  complete(principal: AuthenticatedPrincipal, id: string, usage: UsageInput): Promise<unknown>;
  fail(principal: AuthenticatedPrincipal, id: string, category: AgentFailureCategory, message: string, usage?: UsageInput): Promise<unknown>;
  cancel(principal: AuthenticatedPrincipal, id: string): Promise<unknown>;
  recordUsage(principal: AuthenticatedPrincipal, runId: string, provider: string, model: string, usage: UsageInput): Promise<unknown>;
  registerPrompt?(identifier: string, version: number, schemaName: string, schemaVersion: number, templateDigest: string, description?: string): Promise<unknown>;
};

const defaultStore: RunStore = agentRunService;
export type ModelGatewayOptions = { config: AIConfig; transport?: ModelTransport; promptRegistry: PromptRegistry; runStore?: RunStore; sleep?: (milliseconds: number) => Promise<void> };

export class ModelGateway {
  private readonly activeControllers = new Map<string, AbortController>();
  private readonly transport: ModelTransport;
  private readonly store: RunStore;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(private readonly options: ModelGatewayOptions) {
    this.transport = options.transport ?? createModelTransport(options.config);
    this.store = options.runStore ?? defaultStore;
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  }

  async generateStructured<T>(request: GatewayRequest<T>): Promise<GatewayResult<T>> {
    const definition = this.options.promptRegistry.resolve(request.prompt.identifier, request.prompt.version);
    if (definition.schemaName !== request.schemaName || definition.schemaVersion !== request.schemaVersion) throw new AIError('invalid_request', 'The prompt is bound to a different output schema.');
    const payload = { operation: request.operation, prompt: request.prompt, input: request.input, schemaName: request.schemaName, schemaVersion: request.schemaVersion, policy: request.policy ?? 'generic', maxOutputTokens: request.maxOutputTokens ?? null };
    const execute = () => this.executeOnce(request, definition);
    if (!request.idempotencyKey) return execute();
    const result = await withIdempotency(request.principal.userId, request.idempotencyKey, request.operation, payload, async () => ({ status: 200, body: await execute() }));
    if (result.status !== 200) throw new AIError('unknown', 'The idempotent model request previously failed.');
    const stored = result.body as { value?: unknown };
    const parsed = request.outputSchema.safeParse(stored.value);
    if (!parsed.success) throw new AIError('invalid_output', 'The stored model result failed schema validation.');
    return { ...(result.body as Omit<GatewayResult<T>, 'value'>), value: parsed.data };
  }

  private async executeOnce<T>(request: GatewayRequest<T>, definition: PromptDefinition): Promise<GatewayResult<T>> {
    const policy = resolveModelPolicy(this.options.config, request.policy ?? 'generic');
    await this.store.registerPrompt?.(definition.identifier, definition.version, definition.schemaName, definition.schemaVersion, this.options.promptRegistry.digest(definition), definition.description);
    const run = await this.store.create({ principal: request.principal, operation: request.operation, provider: this.transport.provider, model: policy.model, promptIdentifier: definition.identifier, promptVersion: definition.version, schemaName: definition.schemaName, schemaVersion: definition.schemaVersion, correlationId: request.correlationId, idempotencyKey: request.idempotencyKey });
    const controller = new AbortController();
    this.activeControllers.set(run.id, controller);
    const unlink = request.signal ? () => controller.abort() : null;
    request.signal?.addEventListener('abort', unlink!, { once: true });
    try {
      await this.store.start(request.principal, run.id);
      const userInput = JSON.stringify(request.input);
      if (userInput === undefined) throw new AIError('invalid_request', 'Model input must be JSON serializable.');
      const inputTokens = Math.ceil((definition.systemInstruction.length + userInput.length) / 4);
      const maxOutputTokens = Math.min(request.maxOutputTokens ?? this.options.config.maxOutputTokens, this.options.config.maxOutputTokens);
      const pricing = this.options.config.pricing[policy.model];
      const estimatedCost = estimateCost(pricing, inputTokens, maxOutputTokens);
      if (inputTokens > this.options.config.maxInputTokens) throw new AIError('invalid_request', 'Model input exceeds the configured token budget.');
      if (estimatedCost !== null && this.options.config.maxEstimatedCost !== null && estimatedCost > this.options.config.maxEstimatedCost) throw new AIError('invalid_request', 'Model request exceeds the configured cost budget.');
      const response = await this.withRetries({ model: policy.model, systemInstruction: definition.systemInstruction, userInput, schemaName: request.schemaName, jsonSchema: zodToJsonSchema(request.outputSchema, { name: request.schemaName, $refStrategy: 'none' }) as Record<string, unknown>, maxOutputTokens, signal: controller.signal });
      if (controller.signal.aborted) throw new AIError('cancelled', 'Model request cancelled.');
      validateUsage(response.usage);
      const value = parseStructuredOutput(response.outputText, request.outputSchema);
      const usage = { inputTokens: response.usage.inputTokens, outputTokens: response.usage.outputTokens, totalTokens: response.usage.totalTokens, estimatedCost: estimateCost(pricing, response.usage.inputTokens ?? inputTokens, response.usage.outputTokens ?? maxOutputTokens), costCurrency: pricing?.currency ?? null };
      if (usage.estimatedCost !== null && this.options.config.maxEstimatedCost !== null && usage.estimatedCost > this.options.config.maxEstimatedCost) throw new AIError('invalid_request', 'Model response exceeded the configured cost budget.');
      await this.store.recordUsage(request.principal, run.id, this.transport.provider, policy.model, usage);
      await this.store.complete(request.principal, run.id, usage);
      return { runId: run.id, value, provider: this.transport.provider, model: policy.model, usage, estimatedCost: usage.estimatedCost, providerRequestId: response.providerRequestId };
    } catch (error) {
      const normalized = controller.signal.aborted ? new AIError('cancelled', 'Model request cancelled.') : normalizeAIError(error);
      if (normalized.category === 'cancelled') { try { await this.store.cancel(request.principal, run.id); } catch { /* another terminal transition won */ } } else { try { await this.store.fail(request.principal, run.id, toRunFailureCategory(normalized.category), normalized.message); } catch { /* preserve the provider failure */ } }
      throw normalized;
    } finally {
      this.activeControllers.delete(run.id);
      if (unlink) request.signal?.removeEventListener('abort', unlink);
    }
  }

  cancel(principal: AuthenticatedPrincipal, runId: string) { this.activeControllers.get(runId)?.abort(); return this.store.cancel(principal, runId); }

  private async withRetries(request: Parameters<ModelTransport['complete']>[0]): Promise<ModelTransportResponse> {
    let lastError: AIError | undefined;
    for (let attempt = 1; attempt <= this.options.config.maxAttempts; attempt += 1) {
      try { return await this.withTimeout(request); } catch (error) {
        const normalized = normalizeAIError(error);
        if (normalized.category === 'cancelled' || !normalized.retryable || attempt === this.options.config.maxAttempts) throw normalized;
        lastError = normalized;
        await this.sleepWithSignal(this.options.config.backoffMs * 2 ** (attempt - 1), request.signal);
      }
    }
    throw lastError ?? new AIError('unknown', 'The model request failed.');
  }

  private async sleepWithSignal(milliseconds: number, signal: AbortSignal) { if (signal.aborted) throw new AIError('cancelled', 'Model request cancelled.'); let abort!: () => void; const cancelled = new Promise<never>((_, reject) => { abort = () => reject(new AIError('cancelled', 'Model request cancelled.')); signal.addEventListener('abort', abort, { once: true }); }); try { await Promise.race([this.sleep(milliseconds), cancelled]); } finally { signal.removeEventListener('abort', abort); } }
  private async withTimeout(request: Parameters<ModelTransport['complete']>[0]) { const timeoutController = new AbortController(); const timer = setTimeout(() => timeoutController.abort(), this.options.config.timeoutMs); const abort = () => timeoutController.abort(); request.signal.addEventListener('abort', abort, { once: true }); try { return await this.transport.complete({ ...request, signal: timeoutController.signal }); } catch (error) { if (timeoutController.signal.aborted && !request.signal.aborted) throw new AIError('timeout', 'The model request timed out.', { retryable: true }); throw error; } finally { clearTimeout(timer); request.signal.removeEventListener('abort', abort); } }
}

export function createConfiguredModelGateway() { const promptRegistry = new PromptRegistry(); return new ModelGateway({ config: loadAIConfig(), promptRegistry }); }
function parseStructuredOutput<T>(text: string, schema: ZodType<T>): T { let parsed: unknown; try { parsed = JSON.parse(text); } catch { throw new AIError('invalid_output', 'The model returned invalid structured output.'); } const result = schema.safeParse(parsed); if (!result.success) throw new AIError('invalid_output', 'The model returned output that failed schema validation.'); return result.data; }
function validateUsage(usage: ModelTransportResponse['usage']) { for (const value of [usage.inputTokens, usage.outputTokens, usage.totalTokens]) if (value !== undefined && (!Number.isInteger(value) || value < 0)) throw new AIError('invalid_output', 'The provider returned invalid token usage.'); if (usage.totalTokens !== undefined && usage.inputTokens !== undefined && usage.outputTokens !== undefined && usage.totalTokens !== usage.inputTokens + usage.outputTokens) throw new AIError('invalid_output', 'The provider returned inconsistent token usage.'); }
function toRunFailureCategory(category: AIErrorCategory) { return category === 'safety/policy' ? 'SAFETY_POLICY' : category.toUpperCase() as 'CONFIGURATION' | 'AUTHENTICATION' | 'RATE_LIMIT' | 'TIMEOUT' | 'PROVIDER_UNAVAILABLE' | 'INVALID_REQUEST' | 'INVALID_OUTPUT' | 'SAFETY_POLICY' | 'CANCELLED' | 'UNKNOWN'; }
export type { PromptDefinition };
