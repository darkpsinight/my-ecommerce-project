import Signin from "@/components/Auth/Signin";
import React from "react";
import { Metadata } from "next";
import { getPublicConfigs } from "@/services/config";

export async function generateMetadata(): Promise<Metadata> {
  const { configs } = await getPublicConfigs();
  
  return {
    title: `Sign In | ${configs.APP_NAME}`,
    description: `Sign in to your ${configs.APP_NAME} account to start trading digital codes`,
    openGraph: {
      title: `Sign In | ${configs.APP_NAME}`,
      description: `Sign in to your ${configs.APP_NAME} account to start trading digital codes`,
      type: "website",
      url: "/signin",
    },
  };
}

async function SigninPage() {
  const { configs } = await getPublicConfigs();
  
  return (
    <main>
      <Signin appName={configs.APP_NAME} />
    </main>
  );
}

export default SigninPage;
