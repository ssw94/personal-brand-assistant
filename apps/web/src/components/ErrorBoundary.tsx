import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Unexpected frontend error', { name: error.name, message: error.message, componentStack: info.componentStack }); }
  render() { if (!this.state.hasError) return this.props.children; return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><section className="card max-w-md p-8 text-center"><h1 className="text-xl font-bold text-slate-950">Something went wrong</h1><p className="muted mt-2">This page could not be displayed. Your saved data was not changed.</p><button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Reload workspace</button></section></main>; }
}
