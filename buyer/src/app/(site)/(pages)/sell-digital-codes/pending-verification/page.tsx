import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageContainer from "@/components/Common/PageContainer";

export const metadata: Metadata = {
  title: "KYC Verification Pending | Digital Codes Marketplace",
  description:
    "Your KYC verification is being processed. We'll notify you once it's complete.",
};

export default function PendingVerificationPage() {
  return (
    <PageContainer>
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="bg-white rounded-xl shadow-1 px-4 py-10 sm:py-15 lg:py-20">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <Image
                  src="/images/verification-pending.svg"
                  alt="Verification Pending"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Verification in Progress
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Thank you for submitting your verification documents. Our team
                is reviewing your information and will process it as soon as
                possible.
              </p>
              <div className="bg-blue/5 rounded-lg p-4 mb-8">
                <p className="text-sm text-gray-600">
                  Average processing time:{" "}
                  <span className="font-semibold">24-48 hours</span>
                </p>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">
                  {"We'll"} notify you via email once your verification is
                  complete.
                </p>
                <p className="text-gray-600">
                  In the meantime, you can explore our marketplace or check out
                  our seller guidelines.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-blue bg-blue/5 hover:bg-blue/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue"
              >
                Return to Homepage
              </Link>
              <Link
                href="/help/seller-guidelines"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue"
              >
                View Seller Guidelines
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
