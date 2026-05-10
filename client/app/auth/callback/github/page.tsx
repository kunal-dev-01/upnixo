import OAuthCallback from "@/components/auth/OAuthCallback";
import { Suspense } from "react";

export default function GitHubCallbackPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Suspense>
          <OAuthCallback provider="github" />
        </Suspense>
      </div>
    </div>
  );
}
