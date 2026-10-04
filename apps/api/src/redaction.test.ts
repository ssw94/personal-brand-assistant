import { describe, expect, it } from 'vitest';
import { redactSensitive, redactedError } from './redaction.js';

describe('AI redaction', () => {
  it('redacts nested provider credentials and bounds strings', () => {
    const value = redactSensitive({ provider: { accessToken: 'secret' }, prompt: 'x'.repeat(700) }) as { provider: { accessToken: string }; prompt: string };
    expect(value.provider.accessToken).toBe('[REDACTED]');
    expect(value.prompt.length).toBeLessThan(700);
  });

  it('does not expose arbitrary error contents', () => {
    expect(redactedError(new Error('request failed with key=secret'))).toEqual({ name: 'Error', message: 'Operation failed.' });
    expect(redactedError({ apiKey: 'secret' })).toEqual({ name: 'UnknownError', message: 'Unknown error.' });
  });
});
