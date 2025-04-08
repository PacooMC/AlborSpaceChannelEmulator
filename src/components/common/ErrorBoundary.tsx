import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise render default error message
      return this.props.fallback || (
        <div className="p-6 bg-albor-bg-dark/80 backdrop-blur-sm rounded border border-albor-orange/50 text-albor-light-gray">
          <h3 className="text-lg font-semibold text-albor-orange mb-2">Component Error</h3>
          <p className="mb-2">There was an error loading this component.</p>
          <details className="text-xs text-albor-dark-gray mt-2">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 p-2 bg-albor-deep-space/50 rounded overflow-x-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
