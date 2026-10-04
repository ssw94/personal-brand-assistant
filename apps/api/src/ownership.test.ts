import { describe, expect, it } from 'vitest';
import { assertOwned, OwnedResourceNotFoundError, ownedWhere, requireOwned } from './ownership.js';

describe('ownership foundations', () => {
  it('adds the authenticated owner to a query predicate', () => {
    expect(ownedWhere('user-1', { id: 'draft-1' })).toEqual({ id: 'draft-1', userId: 'user-1' });
  });

  it('rejects missing and cross-user records', () => {
    expect(() => assertOwned(null, 'user-1')).toThrow(OwnedResourceNotFoundError);
    expect(() => assertOwned({ userId: 'user-2' }, 'user-1')).toThrow(OwnedResourceNotFoundError);
    expect(() => assertOwned({ userId: 'user-1' }, 'user-1')).not.toThrow();
  });

  it('requires the loader to return an owned record', async () => {
    await expect(requireOwned('user-1', async () => ({ id: 'draft-1' }))).resolves.toEqual({ id: 'draft-1' });
    await expect(requireOwned('user-1', async () => null)).rejects.toThrow(OwnedResourceNotFoundError);
  });
});
