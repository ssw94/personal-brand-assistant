import { describe, expect, it } from 'vitest';
import { SafeMockContentProvider } from './aiContentProvider.js';

describe('safe content provider', () => {
  it('grounds generated content in supplied facts and returns their ids', async () => {
    const result = await new SafeMockContentProvider().generate({ title: 'Draft', topic: 'platform reliability', audience: 'engineers', voice: 'practical', facts: [{ id: 'experience:1', text: 'Built platform reliability systems.' }, { id: 'skill:1', text: 'TypeScript' }] });
    expect(result.provider).toBe('safe-mock'); expect(result.sourceFactIds).toEqual(['experience:1']); expect(result.body).toContain('Built platform reliability systems.'); expect(result.body).not.toContain('Kubernetes');
  });
  it('labels critique as critique-only material', async () => {
    const result = await new SafeMockContentProvider().critique({ body: 'A draft about learning.', facts: [] });
    expect(result.factStatus).toBe('critique_only'); expect(result.improvements.length).toBeGreaterThan(0);
  });
});
