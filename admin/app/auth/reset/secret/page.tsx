"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import ResetKeyForm from "@/components/auth/ResetKey";
import { toast } from "sonner";
import { Loader } from "@/common/Loader";

function ResetKeyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  if (!token) {
    toast.error("Invalid or missing reset token");
    router.replace("/auth/login");
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <ResetKeyForm token={token} />
    </div>
  );
}

export default function ResetKeyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-10 h-10" />
      </div>
    }>
      <ResetKeyContent />
    </Suspense>
  );
}
