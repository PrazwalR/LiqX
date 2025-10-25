import React from 'react';
import { AlertTriangle, AlertCircle, XCircle, RefreshCw, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  type?: 'error' | 'warning' | 'critical';
  onRetry?: () => void;
  onDismiss?: () => void;
  details?: string;
  compact?: boolean;
}

export function ErrorAlert({
  message,
  type = 'error',
  onRetry,
  onDismiss,
  details,
  compact = false,
}: ErrorAlertProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  const config = {
    error: {
      icon: AlertCircle,
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
      iconBg: 'bg-red-500/20',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-400',
      iconBg: 'bg-yellow-500/20',
    },
    critical: {
      icon: XCircle,
      bg: 'bg-red-600/10',
      border: 'border-red-600/20',
      text: 'text-red-300',
      iconBg: 'bg-red-600/20',
    },
  };

  const { icon: Icon, bg, border, text, iconBg } = config[type];

  if (compact) {
    return (
      <div className={`${bg} ${border} border rounded-lg p-3 flex items-center gap-3`}>
        <Icon className={`w-4 h-4 ${text} flex-shrink-0`} />
        <p className={`text-sm ${text} flex-1`}>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`${text} hover:opacity-80 transition-opacity`}
            title="Retry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${text} hover:opacity-80 transition-opacity`}
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${bg} ${border} border rounded-lg p-4`}>
      <div className="flex items-start gap-4">
        <div className={`${iconBg} rounded-full p-2 flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-medium ${text} mb-1`}>
            {type === 'critical' ? 'Critical Error' : type === 'warning' ? 'Warning' : 'Error'}
          </h3>
          <p className="text-sm text-gray-400">{message}</p>

          {details && (
            <div className="mt-3">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
              >
                {showDetails ? 'Hide' : 'Show'} details
              </button>
              {showDetails && (
                <pre className="mt-2 text-xs text-gray-500 bg-black/20 p-3 rounded overflow-x-auto">
                  {details}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`${text} hover:opacity-80 transition-opacity`}
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Banner variant for full-width alerts
export function ErrorBanner({
  message,
  type = 'error',
  onRetry,
  onDismiss,
}: Omit<ErrorAlertProps, 'compact' | 'details'>) {
  const config = {
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-400',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-400',
    },
    critical: {
      bg: 'bg-red-600/10',
      border: 'border-red-600/20',
      text: 'text-red-300',
    },
  };

  const { bg, border, text } = config[type];

  return (
    <div className={`${bg} ${border} border-l-4 p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm ${text}`}>{message}</p>
        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className={`${text} hover:opacity-80 transition-opacity text-sm flex items-center gap-1`}
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`${text} hover:opacity-80 transition-opacity`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
