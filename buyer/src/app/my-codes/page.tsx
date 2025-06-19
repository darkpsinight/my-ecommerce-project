"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { selectAuthToken } from "@/redux/features/auth-slice";

export default function MyCodesPage() {
  const router = useRouter();
  const token = useAppSelector(selectAuthToken);

  useEffect(() => {
    // Check authentication first
    if (!token) {
      // Redirect to signin if not authenticated
      router.replace("/signin?redirect=/my-codes");
      return;
    }
    
    // Redirect to my-account with my-codes tab active
    router.replace("/my-account?tab=my-codes");
  }, [router, token]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
    </div>
  );
}