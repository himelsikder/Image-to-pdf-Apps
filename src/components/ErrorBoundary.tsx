import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Img to Pdf Uncaught error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                কিছু সমস্যা হয়েছে (Something went wrong)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                অ্যাপটি পুনরায় লোড করতে নিচের বাটনে চাপ দিন।
              </p>
            </div>
            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-700/50 text-[11px] text-rose-300 font-mono text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>পুনরায় চেষ্টা করুন (Reload App)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
