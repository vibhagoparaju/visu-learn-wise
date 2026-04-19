import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AIErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("AI component error:", error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-3">
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {this.props.label ? `${this.props.label} unavailable` : "Something went wrong"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We couldn't load this content. Please try again.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.reset} className="rounded-full">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AIErrorBoundary;
