import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  name?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Lightweight boundary for individual cards / sections.
 * Silently catches crashes and hides the broken component
 * instead of taking down the whole page.
 */
export class SafeCard extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(`[SafeCard:${this.props.name ?? "unknown"}] caught:`, error.message, info.componentStack?.slice(0, 200));
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
