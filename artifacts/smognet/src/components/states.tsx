import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function ErrorState({ error }: { error?: unknown }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-medium text-destructive">Data Retrieval Failed</h3>
        <p className="text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Unable to establish connection to SMOGNET_OS."}
        </p>
      </div>
    </div>
  );
}
