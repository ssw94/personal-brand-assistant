import { describe, expect, it } from 'vitest';
import { PromptRegistry } from './promptRegistry.js';

describe('prompt registry', () => {
  it('resolves immutable versioned definitions and produces a digest', () => {
    const registry = new PromptRegistry();
    const definition = registry.register({ identifier: 'test.prompt', version: 1, systemInstruction: 'Return structured data.', schemaName: 'TestOutput', schemaVersion: 1 });
    expect(registry.resolve('test.prompt', 1)).toEqual(definition);
    expect(registry.digest(definition)).toHaveLength(64);
    expect(() => registry.register(definition)).toThrow('already registered');
  });

  it('fails closed for unknown prompt versions', () => {
    expect(() => new PromptRegistry().resolve('missing.prompt', 1)).toThrow('not registered');
  });
});
