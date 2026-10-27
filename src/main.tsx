import React, { Component, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Root Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-300 mb-4">
              The application encountered an unexpected runtime error during startup.
            </p>
            {this.state.error?.message && (
              <pre className="text-xs text-rose-300 bg-slate-950/70 p-3 rounded-lg text-left overflow-x-auto mb-4 border border-rose-900/30 font-mono">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>
  );
}

