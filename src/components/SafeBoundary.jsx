import { Component } from 'react';

// Keeps a failed subtree (e.g. a 3D scene or a CDN-loaded HDR environment)
// from crashing the whole page. Renders an optional fallback instead.
class SafeBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (import.meta.env && import.meta.env.DEV) {
      console.warn('SafeBoundary caught an error:', error);
    }
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

export default SafeBoundary;
