import { Metadata } from "next";
import SellerVerificationWizard from "@/components/SellDigitalCodes/KYC/SellerVerificationWizard";
import PageContainer from "@/components/Common/PageContainer";
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

export default function KYCPage() {
  return (
    <PageContainer>
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="bg-white rounded-xl shadow-1 px-4 py-10 sm:py-15 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-4">
                Seller Verification
              </h1>
              <p className="text-lg text-dark">
                Complete your verification to start selling digital codes on our
                marketplace. This helps us maintain a safe and trusted
                environment for all users.
              </p>
            </div>

            <SellerVerificationWizard />
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
