import React from "react";
export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="empty" role="alert">
        <h1>Something went wrong</h1>
        <p>
          Your saved information is still on this device. Return home to keep
          exploring.
        </p>
        <button
          className="primary"
          onClick={() => {
            window.location.hash = "home";
            this.setState({ failed: false });
          }}
        >
          Go home
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
