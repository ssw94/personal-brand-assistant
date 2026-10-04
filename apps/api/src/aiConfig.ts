import { z } from 'zod';

const pricingSchema = z.object({ inputPerMillion: z.number().nonnegative(), outputPerMillion: z.number().nonnegative(), currency: z.string().length(3).default('USD') });
export type ModelPricing = z.infer<typeof pricingSchema>;
export type ModelPolicyKey = 'generic' | 'research' | 'topic' | 'writer' | 'critic' | 'revision';

export type AIConfig = {
  provider: 'openai';
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  policyModels: Record<ModelPolicyKey, string>;
  timeoutMs: number;
  maxAttempts: number;
  backoffMs: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxEstimatedCost: number | null;
  pricing: Record<string, ModelPricing>;
};

function numberEnv(name: string, fallback: number) { const value = Number(process.env[name] ?? fallback); if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive number.`); return value; }
function pricingEnv(): Record<string, ModelPricing> {
  const raw = process.env.AI_MODEL_PRICING_JSON;
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  return z.record(pricingSchema).parse(parsed);
}

export function loadAIConfig(): AIConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENAI_API_KEY is required for the OpenAI model provider.');
  const defaultModel = process.env.AI_MODEL_DEFAULT?.trim() || 'gpt-4o-mini';
  const policyModels = Object.fromEntries((['generic', 'research', 'topic', 'writer', 'critic', 'revision'] as const).map((key) => [key, process.env[`AI_MODEL_${key.toUpperCase()}`]?.trim() || defaultModel])) as Record<ModelPolicyKey, string>;
  const maxCostRaw = process.env.AI_MAX_ESTIMATED_COST;
  const maxEstimatedCost = maxCostRaw ? Number(maxCostRaw) : null;
  if (maxEstimatedCost !== null && (!Number.isFinite(maxEstimatedCost) || maxEstimatedCost < 0)) throw new Error('AI_MAX_ESTIMATED_COST must be zero or a positive number.');
  return { provider: 'openai', apiKey, baseUrl: (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, ''), defaultModel, policyModels, timeoutMs: numberEnv('AI_TIMEOUT_MS', 30_000), maxAttempts: Math.min(numberEnv('AI_MAX_ATTEMPTS', 3), 5), backoffMs: numberEnv('AI_RETRY_BACKOFF_MS', 250), maxInputTokens: numberEnv('AI_MAX_INPUT_TOKENS', 32_000), maxOutputTokens: numberEnv('AI_MAX_OUTPUT_TOKENS', 4_000), maxEstimatedCost, pricing: pricingEnv() };
}

export function estimateCost(pricing: ModelPricing | undefined, inputTokens: number, outputTokens: number) { return pricing ? (inputTokens * pricing.inputPerMillion + outputTokens * pricing.outputPerMillion) / 1_000_000 : null; }
