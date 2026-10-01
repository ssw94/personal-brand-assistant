type EmptyStateProps = { title: string; description: string; action?: string | undefined };
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return <div className="card flex flex-col items-center justify-center px-6 py-16 text-center"><div className="mb-4 rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">Coming next</div><h2 className="text-lg font-semibold">{title}</h2><p className="muted mt-2 max-w-md">{description}</p>{action && <button className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{action}</button>}</div>;
}
