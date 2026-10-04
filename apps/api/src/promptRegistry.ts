import { createHash } from 'node:crypto';

export type PromptDefinition = { identifier: string; version: number; systemInstruction: string; schemaName?: string; description?: string };

export class PromptRegistry {
  private readonly definitions = new Map<string, PromptDefinition>();

  register(definition: PromptDefinition) {
    if (!definition.identifier.trim() || definition.version < 1 || !definition.systemInstruction.trim()) throw new Error('Invalid prompt definition.');
    const key = `${definition.identifier}:${definition.version}`;
    if (this.definitions.has(key)) throw new Error(`Prompt version already registered: ${key}`);
    this.definitions.set(key, { ...definition });
    return definition;
  }

  resolve(identifier: string, version: number) {
    const definition = this.definitions.get(`${identifier}:${version}`);
    if (!definition) throw new Error(`Prompt version is not registered: ${identifier}:${version}`);
    return definition;
  }

  digest(definition: PromptDefinition) { return createHash('sha256').update(JSON.stringify(definition)).digest('hex'); }
}
