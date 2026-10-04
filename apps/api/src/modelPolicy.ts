import type { AIConfig, ModelPolicyKey } from './aiConfig.js';

export type ModelPolicy = { key: ModelPolicyKey; model: string };

export function resolveModelPolicy(config: AIConfig, key: ModelPolicyKey = 'generic'): ModelPolicy {
  return { key, model: config.policyModels[key] };
}
