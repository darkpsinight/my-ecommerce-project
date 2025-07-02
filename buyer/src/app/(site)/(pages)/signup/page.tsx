import Signup from "@/components/Auth/Signup";
import AuthGuard from "@/components/Auth/AuthGuard";
import React from "react";
import { Metadata } from "next";
import { getPublicConfigs } from "@/services/config";

export async function generateMetadata(): Promise<Metadata> {
  const { configs } = await getPublicConfigs();
  
  return {
    title: `Sign Up | ${configs.APP_NAME}`,
    description: `Create your ${configs.APP_NAME} account`,
    openGraph: {
      title: `Sign Up | ${configs.APP_NAME}`,
      description: `Create your ${configs.APP_NAME} account`,
      type: "website",
      url: "/signup",
    },
  };
}

async function SignupPage() {
  const { configs } = await getPublicConfigs();
  
  return (
    <main>
      <AuthGuard redirectIfAuthenticated={true} redirectTo="/">
        <Signup appName={configs.APP_NAME} />
      </AuthGuard>
    </main>
  );
}

export default SignupPage;
