'use client';

import { Component, type ReactNode } from 'react';
import { reportError } from '../../lib/errorReporter';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError(error, `ErrorBoundary (${errorInfo.componentStack?.slice(0, 100)})`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#f5f2eb' }}>
          <div className="max-w-md text-center">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.1)' }}
            >
              <svg className="w-10 h-10" style={{ color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="headline-font text-2xl mb-3" style={{ color: '#2a2f1e' }}>
              Something went wrong
            </h2>
            <p className="text-sm mb-2" style={{ color: '#6b7266' }}>
              An unexpected error occurred. Please try reloading the page.
            </p>
            {this.state.error && (
              <p className="text-xs mb-6 font-mono" style={{ color: '#999' }}>
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: '#6b7a3d' }}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
