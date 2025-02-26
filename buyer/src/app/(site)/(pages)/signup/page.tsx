import Signup from "@/components/Auth/Signup";
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
      <Signup appName={configs.APP_NAME} />
    </main>
  );
}

export default SignupPage;
