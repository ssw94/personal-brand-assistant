import { describe, expect, it } from 'vitest';
import { classifyExistingIdempotency, requestHash } from './idempotency.js';

describe('idempotency request hashing', () => {
  it('treats object key ordering as equivalent', () => {
    expect(requestHash({ topic: 'AI', options: { tone: 'direct', length: 500 } })).toBe(requestHash({ options: { length: 500, tone: 'direct' }, topic: 'AI' }));
  });

  it('distinguishes different request payloads', () => {
    expect(requestHash({ topic: 'AI' })).not.toBe(requestHash({ topic: 'security' }));
  });

  it('classifies first, duplicate, conflict, and failed requests safely', () => {
    const hash = requestHash({ topic: 'AI' });
    expect(classifyExistingIdempotency(null, hash)).toBe('new');
    expect(classifyExistingIdempotency({ id: '1', requestHash: hash, status: 'IN_PROGRESS', responseStatus: null, responseBody: null, resourceId: null, errorCode: null }, hash)).toBe('in_progress');
    expect(classifyExistingIdempotency({ id: '1', requestHash: hash, status: 'COMPLETED', responseStatus: 201, responseBody: { id: 'draft-1' }, resourceId: 'draft-1', errorCode: null }, hash)).toBe('replay');
    expect(classifyExistingIdempotency({ id: '1', requestHash: hash, status: 'FAILED', responseStatus: 500, responseBody: null, resourceId: null, errorCode: 'FAILED' }, hash)).toBe('replay');
    expect(classifyExistingIdempotency({ id: '1', requestHash: hash, status: 'COMPLETED', responseStatus: 201, responseBody: null, resourceId: null, errorCode: null }, requestHash({ topic: 'security' }))).toBe('conflict');
  });
});
