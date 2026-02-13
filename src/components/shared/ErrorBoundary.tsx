import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh] space-y-4 glass-card border-destructive/20 m-4">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-2 animate-pulse">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Creating Stability Field... Failed</h2>
                    <p className="text-muted-foreground text-sm max-w-md bg-muted/50 p-4 rounded-lg font-mono text-xs break-all">
                        {this.state.error?.message || "Quantum entanglement error in component rendering."}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="mt-4 gap-2 rounded-xl"
                    >
                        <RefreshCcw className="h-4 w-4" /> Reboot System
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
