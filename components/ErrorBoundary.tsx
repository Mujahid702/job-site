'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside ErrorBoundary:', error, errorInfo)
    Sentry.captureException(error, { extra: { errorInfo } })
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
          <div className="max-w-md space-y-6">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 font-display">Something went wrong.</h3>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                An unexpected error occurred in this view. Please try refreshing or submit the request again.
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="px-6 py-3.5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-colors flex items-center gap-2 mx-auto cursor-pointer shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Page</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
