import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center gap-4 px-6"
          style={{ fontFamily: 'var(--font-outfit, system-ui, sans-serif)', background: 'var(--background-alt, #fafafa)' }}
        >
          <p className="text-center text-[var(--foreground,#111)] max-w-md">
            Something went wrong loading this screen. Your study data may still be available after a refresh.
          </p>
          <button
            type="button"
            className="rounded-[var(--radius-button,10px)] px-5 py-2.5 font-medium text-white"
            style={{ background: 'var(--primary, #9718fb)' }}
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
