import { Component, type ReactNode } from "react";

interface Props {
  resetKey?: string | number;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class VideoErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error) {
    console.warn("Video failed to load:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="absolute inset-0 flex items-center justify-center text-center p-8">
          <div>
            <p className="font-display text-2xl mb-2">Video unavailable</p>
            <p className="text-muted-foreground text-sm">
              This video couldn't be loaded. You can still read the chapter below.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
