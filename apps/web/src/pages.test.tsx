import { describe, expect, it } from 'vitest';
import { pageCopy } from './testExports';
describe('foundation page copy', () => { it('does not seed fictional career data', () => { expect(pageCopy.Profile[1]).toContain('experience'); expect(pageCopy.Jobs[1]).toContain('opportunities'); }); });
