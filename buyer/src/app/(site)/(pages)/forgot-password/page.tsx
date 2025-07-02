import ForgotPassword from "@/components/Auth/ForgotPassword";
import AuthGuard from "@/components/Auth/AuthGuard";
import React from "react";
import { Metadata } from "next";
import { getPublicConfigs } from "@/services/config";

export async function generateMetadata(): Promise<Metadata> {
  const { configs } = await getPublicConfigs();
  
  return {
    title: `Reset Password | ${configs.APP_NAME}`,
    description: `Reset your password for your ${configs.APP_NAME} account`,
    openGraph: {
      title: `Reset Password | ${configs.APP_NAME}`,
      description: `Reset your password for your ${configs.APP_NAME} account`,
      type: "website",
      url: "/forgot-password",
    },
  };
}

async function ForgotPasswordPage() {
  const { configs } = await getPublicConfigs();
  
  return (
    <main>
      <AuthGuard redirectIfAuthenticated={true} redirectTo="/">
        <ForgotPassword appName={configs.APP_NAME} />
      </AuthGuard>
    </main>
  );
}

export default ForgotPasswordPage;