import Empty from "./components/Empty";
import React from "react";
export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Empty
        as="main"
        role="alert"
        heading="h1"
        icon={null}
        title="Something went wrong"
        description="Your saved information is still on this device. Return home to keep exploring."
        action="Go home"
        actionClassName="primary"
        onAction={() => {
          window.location.hash = "home";
          this.setState({ failed: false });
        }}
      />
    ) : (
      this.props.children
    );
  }
}
