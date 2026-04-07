'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
          <div className="bg-red-50 rounded-full p-4 mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Algo deu errado</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte se o problema persistir.
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
