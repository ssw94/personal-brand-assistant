import type { JobInput } from '@pba/shared';

export interface JobSourceProvider { readonly name: string; search(query: string): Promise<ReadonlyArray<Partial<JobInput>>>; }

/** Local provider intentionally performs no scraping or third-party automation. */
export class ManualJobSourceProvider implements JobSourceProvider {
  readonly name = 'manual';
  async search(_query: string) { return []; }
}

export function createJobSourceProvider(): JobSourceProvider { return new ManualJobSourceProvider(); }
