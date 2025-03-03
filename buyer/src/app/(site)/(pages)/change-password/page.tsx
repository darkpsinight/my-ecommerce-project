import ChangePassword from "@/components/Auth/ChangePassword";
import React from "react";
import { Metadata } from "next";
import { getPublicConfigs } from "@/services/config";

export async function generateMetadata(): Promise<Metadata> {
  const { configs } = await getPublicConfigs();
  
  return {
    title: `Change Password | ${configs.APP_NAME}`,
    description: `Change your password for your ${configs.APP_NAME} account`,
    openGraph: {
      title: `Change Password | ${configs.APP_NAME}`,
      description: `Change your password for your ${configs.APP_NAME} account`,
      type: "website",
      url: "/change-password",
    },
  };
}

async function ChangePasswordPage() {
  const { configs } = await getPublicConfigs();
  
  return (
    <main>
      <ChangePassword appName={configs.APP_NAME} />
    </main>
  );
}

export default ChangePasswordPage;