"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyCodesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to my-account with my-codes tab active
    router.replace("/my-account?tab=my-codes");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
    </div>
  );
}