export type RuntimeConfigStatus = {
  name: string;
  configured: boolean;
  required: boolean;
  reason: string | null;
};

function present(name: string) {
  return Boolean(process.env[name]?.trim());
}
export function getRuntimeConfigStatus(): RuntimeConfigStatus[] {
  const production = process.env.NODE_ENV === 'production';
  return [
    {
      name: 'authentication',
      configured:
        !production ||
        (present('AUTH_JWT_SECRET') && process.env.AUTH_ALLOW_IDENTITY_HEADERS !== 'true'),
      required: production,
      reason:
        !production ||
        (present('AUTH_JWT_SECRET') && process.env.AUTH_ALLOW_IDENTITY_HEADERS !== 'true')
          ? null
          : 'Production authentication requires AUTH_JWT_SECRET and disabled identity headers.',
    },
    {
      name: 'ai',
      configured: present('OPENAI_API_KEY'),
      required: production,
      reason: present('OPENAI_API_KEY') ? null : 'OPENAI_API_KEY is not configured.',
    },
    {
      name: 'linkedin',
      configured:
        present('LINKEDIN_CLIENT_ID') &&
        present('LINKEDIN_CLIENT_SECRET') &&
        present('LINKEDIN_REDIRECT_URI') &&
        present('LINKEDIN_TOKEN_ENCRYPTION_KEY'),
      required: false,
      reason:
        present('LINKEDIN_CLIENT_ID') &&
        present('LINKEDIN_CLIENT_SECRET') &&
        present('LINKEDIN_REDIRECT_URI') &&
        present('LINKEDIN_TOKEN_ENCRYPTION_KEY')
          ? null
          : 'LinkedIn OAuth is unavailable until all server-side credentials are configured.',
    },
    {
      name: 'stripe',
      configured: present('STRIPE_SECRET_KEY') && present('STRIPE_WEBHOOK_SECRET'),
      required: false,
      reason:
        present('STRIPE_SECRET_KEY') && present('STRIPE_WEBHOOK_SECRET')
          ? null
          : 'Stripe billing is unavailable until server-side keys are configured.',
    },
    {
      name: 'research',
      configured: present('RESEARCH_ALLOWED_HOSTS'),
      required: false,
      reason: present('RESEARCH_ALLOWED_HOSTS')
        ? null
        : 'Research fetches are unavailable until an approved host allowlist is configured.',
    },
  ];
}
export function isRuntimeReady(databaseReady: boolean) {
  const statuses = getRuntimeConfigStatus();
  return (
    databaseReady &&
    statuses.filter((status) => status.required).every((status) => status.configured)
  );
}
