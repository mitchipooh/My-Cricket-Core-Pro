
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black mb-2 uppercase tracking-widest">System Error</h1>
          <p className="text-slate-400 text-sm mb-6">The application encountered a critical failure.</p>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl max-w-md w-full overflow-auto mb-6 text-left">
            <pre className="text-[10px] font-mono text-red-400 whitespace-pre-wrap break-all">
              {this.state.error?.message || this.state.error?.toString()}
            </pre>
          </div>
          <button 
            onClick={() => {
                localStorage.removeItem('cc_profile'); // Clear potentially corrupted profile
                window.location.reload();
            }} 
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg"
          >
            Reset & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

