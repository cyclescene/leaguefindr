'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, we'd send this to an error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary:', error)
      console.error('Error Info:', errorInfo)
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  retry: () => void
}

function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="min-h-[200px] flex items-center justify-center bg-gray-1 rounded-lg border border-gray-2">
      <div className="text-center p-6 max-w-md">
        <div className="w-12 h-12 bg-alert-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-alert-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="font-dirk font-black text-lg text-gray-5 mb-2">
          Something went wrong
        </h3>
        <p className="text-gray-4 text-sm mb-4">
          {process.env.NODE_ENV === 'development' && error?.message 
            ? `Error: ${error.message}` 
            : 'We encountered an unexpected error. Please try again.'
          }
        </p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-dark-green text-white rounded-lg font-montserrat font-semibold text-sm hover:bg-dark-green/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
} 