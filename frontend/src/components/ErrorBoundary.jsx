import React from "react";
export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <main className="empty">
          <h1>Something interrupted this page.</h1>
          <p>Your saved learning progress is safe. Reload to try again.</p>
          <button className="button" onClick={() => window.location.reload()}>
            Reload FinIQ
          </button>
        </main>
      );
    return this.props.children;
  }
}
