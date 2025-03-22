import { Metadata } from "next";
import { getPublicConfigs } from "@/services/config";

export async function generateMetadata(): Promise<Metadata> {
  const { configs } = await getPublicConfigs();

  return {
    title: `Seller Verification - KYC | ${configs.APP_NAME}`,
    description: `Complete your KYC verification to start selling digital codes on our marketplace.`,
    openGraph: {
      title: `Seller Verification - KYC | ${configs.APP_NAME}`,
      description: `Complete your KYC verification to start selling digital codes on our marketplace.`,
      type: "website",
      url: "/sell-digital-codes/KYC",
    },
  };
}

export default function KYCLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 