import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare state: State;
  declare props: Props;
  declare setState: (state: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl my-4 text-center space-y-3 animate-fadeIn">
          <div className="flex justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="font-brand font-bold text-lg text-red-900">
            {this.props.fallbackTitle || 'Ocurrió un error inesperado en este módulo.'}
          </h3>
          <p className="text-xs text-red-700 font-mono max-w-md mx-auto overflow-auto p-2 bg-red-100 rounded">
            {this.state.error?.message || 'Error de renderizado.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-brand font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar y Recuperar Pantalla</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
