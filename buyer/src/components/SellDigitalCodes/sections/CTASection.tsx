import Link from "next/link";

interface CTASectionProps {
  appName: string;
}

const CTASection = ({ appName }: CTASectionProps) => {
  return (
    <div className="bg-blue text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of successful sellers on {appName}
        </p>
        <Link
          href="http://localhost:3002/dashboards/sell-digital-codes"
          className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium bg-white text-blue rounded-md hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Create Seller Account
        </Link>
      </div>
    </div>
  );
};

export default CTASection; 