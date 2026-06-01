import { Component, ErrorInfo, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-cream-200 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">🍳</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              The app hit an unexpected error. Refreshing the page usually fixes it.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-400 font-mono mb-6 bg-gray-50 p-3 rounded-lg text-left overflow-auto max-h-24">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-terracotta-500 text-white rounded-xl font-semibold hover:bg-terracotta-600 transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
