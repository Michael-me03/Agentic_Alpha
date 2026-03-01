// ============================================================================
// SECTION: Error Boundary — Catches React render crashes
// ============================================================================

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('React render error:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-[#08080d] flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-white font-mono font-bold text-lg mb-3">
              Something went wrong
            </h2>
            <p className="text-gray-500 text-sm font-mono mb-4">
              {this.state.error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold rounded-xl text-sm transition-all"
            >
              RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
