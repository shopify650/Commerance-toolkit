import React from "react"

interface State {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: "#ef4444", fontFamily: "system-ui, sans-serif", fontSize: 14 }}>
          <strong>Something went wrong.</strong>
          <p style={{ margin: "8px 0 0", color: "#64748b" }}>Reload the plugin to try again.</p>
        </div>
      )
    }
    return this.props.children
  }
}
