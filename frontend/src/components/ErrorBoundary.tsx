import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production this would go to a logging service (Sentry, etc.)
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-5 text-center">
          <div>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <p className="font-mono text-sm text-gray-400 mb-2 uppercase tracking-widest">500 — Application Error</p>
            <h1 className="font-serif text-3xl text-brand-dark mb-3">Something went wrong</h1>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              An unexpected error occurred. Please try refreshing the page or return to the home page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
                className="btn-primary px-6 py-2.5"
              >
                Refresh Page
              </button>
              <Link to="/" className="btn-secondary px-6 py-2.5">Back to Home</Link>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-8 text-left text-xs bg-gray-100 p-4 overflow-x-auto max-w-2xl mx-auto text-red-700">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
