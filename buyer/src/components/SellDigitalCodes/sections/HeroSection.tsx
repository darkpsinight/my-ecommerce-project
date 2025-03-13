import Image from "next/image";
import Link from "next/link";

interface HeroSectionProps {
  appName: string;
}

const HeroSection = ({ appName }: HeroSectionProps) => {
  return (
    <div className="min-h-[60vh] relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Turn All Your Digital Codes
              <span className="text-blue"> Into Profit</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join {appName} marketplace and start selling your digital codes to
              thousands of buyers worldwide.
            </p>
            <div className="space-y-4 mb-8">
              <BenefitItem text="Quick and secure payments" />
              <BenefitItem text="0% commission fee" />
              <BenefitItem text="24/7 Support available" />
            </div>
            <Link
              href="http://localhost:3002/dashboards/sell-digital-codes"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue rounded-md hover:bg-blue-dark transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Selling Now
            </Link>
          </div>

          {/* Right Column - Image */}
          <div className="relative lg:flex lg:items-center">
            {/* Parent Container for Image and Background Divs */}
            <div className="relative w-full h-[400px] lg:h-[500px] lg:ml-auto max-w-[600px] group">
              {/* Background Divs */}
              <div className="absolute inset-0 bg-blue/5 rounded-2xl transform rotate-3 translate-x group-hover:scale-[1.02] transition-transform duration-300"></div>
              <div className="absolute inset-0 bg-gray-100/50 rounded-2xl transform -rotate-3 translate-x-2 group-hover:scale-[1.02] transition-transform duration-300"></div>

              {/* Image */}
              <div className="relative h-full w-full rounded-xl overflow-hidden shadow-2xl transform rotate-3 transition-transform group-hover:scale-[1.02] duration-300">
                <Image
                  src="/images/giftcards/giftcards-sell.png"
                  alt="Digital Code Marketplace"
                  fill
                  style={{ objectFit: "contain" }}
                  quality={100}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BenefitItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue/10 flex items-center justify-center">
      <svg
        className="w-4 h-4 text-blue"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </div>
    <span className="text-lg text-gray-700">{text}</span>
  </div>
);

export default HeroSection;
