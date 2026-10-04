export class OwnedResourceNotFoundError extends Error {
  constructor() {
    super('Resource not found');
    this.name = 'OwnedResourceNotFoundError';
  }
}

export function ownedWhere<T extends Record<string, unknown>>(userId: string, where: T): T & { userId: string } {
  if (!userId.trim()) throw new Error('Authenticated user ID is required.');
  return { ...where, userId } as T & { userId: string };
}

export async function requireOwned<T>(userId: string, load: (userId: string) => Promise<T | null>): Promise<T> {
  const record = await load(userId);
  if (!record) throw new OwnedResourceNotFoundError();
  return record;
}

export function assertOwned(record: { userId: string } | null | undefined, userId: string): asserts record is { userId: string } {
  if (!record || record.userId !== userId) throw new OwnedResourceNotFoundError();
}
