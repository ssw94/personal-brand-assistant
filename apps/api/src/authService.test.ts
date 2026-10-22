import { describe, expect, it } from 'vitest';
import { signinInput, signupInput } from './authService.js';
describe('account validation', () => {
  it('requires strong passwords and terms acceptance', () => {
    expect(
      signupInput.safeParse({ email: 'person@example.com', password: 'short', acceptTerms: true })
        .success,
    ).toBe(false);
    expect(
      signupInput.safeParse({
        email: 'person@example.com',
        password: 'a secure password',
        acceptTerms: false,
      }).success,
    ).toBe(false);
  });
  it('accepts plan context without making it an entitlement', () => {
    expect(
      signupInput.parse({
        email: 'person@example.com',
        password: 'a secure password',
        acceptTerms: true,
        plan: 'PRO',
      }).plan,
    ).toBe('PRO');
  });
  it('normalizes email addresses', () => {
    const result = signinInput.parse({
      email: 'Person@Example.com',
      password: 'a secure password',
    });
    expect(result.email).toBe('person@example.com');
  });
});
