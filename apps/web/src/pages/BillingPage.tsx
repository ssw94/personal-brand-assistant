import { Link } from 'react-router-dom';
import { planCatalog } from '@pba/shared';
import { useQuery } from '@tanstack/react-query';
import { getBillingStatus, getUsageSummary } from '../lib/api';
import { createBillingPortal, createCheckoutSession } from '../lib/api';
import { useMutation } from '@tanstack/react-query';
import { getSessionUser } from '../lib/session';
export function BillingPage() {
  const user = getSessionUser();
  const usage = useQuery({ queryKey: ['usage-summary'], queryFn: getUsageSummary, retry: false });
  const billing = useQuery({
    queryKey: ['billing-status'],
    queryFn: getBillingStatus,
    retry: false,
  });
  const plan =
    planCatalog.find((item) => item.id === (usage.data?.plan ?? user?.plan)) ?? planCatalog[0];
  const price = plan.price === null ? 'Custom' : `₹${plan.price}`;
  const remaining =
    usage.data?.remaining === null
      ? 'Custom usage'
      : usage.data
        ? String(usage.data.remaining)
        : 'Loading…';
  const checkout = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: ({ url }) => window.location.assign(url),
  });
  const portal = useMutation({
    mutationFn: createBillingPortal,
    onSuccess: ({ url }) => window.location.assign(url),
  });
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Billing</h1>
        <p className="muted mt-2">
          Plan and usage are read from the server-side entitlement system.
        </p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
            Current plan
          </p>
          <h2 className="mt-4 text-3xl font-bold">{plan.name}</h2>
          <p className="mt-2 text-slate-600">
            {price}/{plan.period}
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {plan.features.map((feature) => (
              <li key={feature}>✓ {feature}</li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/pricing"
              className="inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              Compare plans
            </Link>
            {plan.price !== 0 && (
              <button
                type="button"
                onClick={() => portal.mutate()}
                disabled={portal.isPending}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold"
              >
                {portal.isPending ? 'Opening…' : 'Manage subscription'}
              </button>
            )}
          </div>
          {(checkout.isError || portal.isError) && (
            <p role="alert" className="mt-3 text-sm text-rose-600">
              {(checkout.error ?? portal.error)?.message}
            </p>
          )}
        </section>
        <section className="card p-6">
          <h2 className="font-semibold">Usage and renewal</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Subscription status</span>
              <span className="font-medium">
                {billing.data?.subscription?.status ?? 'Not subscribed'}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Included posting usage</span>
              <span className="font-medium">
                {plan.monthlyPostLimit === null ? 'Custom' : `${plan.monthlyPostLimit} posts/month`}
              </span>
            </div>
            {billing.data?.subscription?.cancelAtPeriodEnd && (
              <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
                Cancellation is scheduled at the end of the current provider period.
              </p>
            )}
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Remaining this period</span>
              <span className="font-medium">{remaining}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500">Period ends</span>
              <span className="font-medium">
                {usage.data?.periodEnd
                  ? new Date(usage.data.periodEnd).toLocaleDateString()
                  : 'Loading…'}
              </span>
            </div>
            <p className="rounded-lg bg-slate-50 p-4 text-slate-600">
              Paid checkout and subscription changes are handled by signed server-side Stripe
              events. This page cannot grant entitlements.
            </p>
          </div>
        </section>
      </div>
      <section className="mt-5 card p-6">
        <h2 className="font-semibold">Choose a plan</h2>
        <p className="muted mt-1">
          Checkout uses the centralized plan catalog; Team is configured separately for custom
          usage.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {planCatalog
            .filter((item) => item.price !== 0 && item.price !== null)
            .map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex justify-between">
                  <span className="font-semibold">{item.name}</span>
                  <span>₹{item.price}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.monthlyPostLimit} posts/month</p>
                <button
                  type="button"
                  onClick={() => checkout.mutate(item.id)}
                  disabled={checkout.isPending || item.id === plan.id}
                  className="mt-4 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {item.id === plan.id
                    ? 'Current plan'
                    : checkout.isPending
                      ? 'Starting…'
                      : 'Choose plan'}
                </button>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
