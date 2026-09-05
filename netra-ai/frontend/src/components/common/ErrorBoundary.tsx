import React from 'react';

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-4 bg-red-950/30 border border-red-500/50 rounded-xl text-red-400 font-mono text-sm max-w-full overflow-auto">
          <h2 className="text-lg font-bold mb-2">Something went wrong.</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre className="mt-4 text-xs opacity-70">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
