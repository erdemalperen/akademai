import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import Button from './Button';
import { FileText, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundaryClass extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay />;
    }
    return this.props.children;
  }
}

export const ErrorDisplay = () => {
  const error = useRouteError();
  let errorMessage = 'Bir hata oluştu.';
  let statusText = 'Hata';
  let status = null;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data?.message || error.statusText || errorMessage;
    statusText = error.statusText || statusText;
    status = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-[50vh]">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">
        {status ? `${status} - ${statusText}` : 'Beklenmeyen Hata'}
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        {errorMessage}
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Geri Dön
        </Button>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sayfayı Yenile
        </Button>
      </div>
    </div>
  );
};

export default ErrorBoundaryClass; 