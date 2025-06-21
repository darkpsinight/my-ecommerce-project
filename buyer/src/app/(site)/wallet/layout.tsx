import { getPublicConfigs } from '@/services/config';
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { configs } = await getPublicConfigs();

  return {
    title: `Digital Wallet | ${configs.APP_NAME} - Secure Fund Management`,
    description: `Manage your digital wallet securely on ${configs.APP_NAME}. Add funds, track transactions, and enjoy seamless payments with bank-level security. Powered by Stripe for secure payment processing.`,
    keywords: [
      'digital wallet',
      'secure payments',
      'add funds online',
      'transaction history',
      'digital payment management',
      'stripe payments',
      'wallet balance',
      'secure fund management',
      'online wallet',
      'digital marketplace wallet'
    ],
    openGraph: {
      title: `Digital Wallet - Secure Fund Management | ${configs.APP_NAME}`,
      description: `Securely manage your funds on ${configs.APP_NAME}. Add money to your digital wallet, track transaction history, and enjoy hassle-free payments with industry-standard security.`,
      type: "website",
      url: "/wallet",
      siteName: configs.APP_NAME,
      images: [
        {
          url: "/images/logo.png",
          width: 800,
          height: 600,
          alt: `${configs.APP_NAME} Digital Wallet`,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Digital Wallet | ${configs.APP_NAME}`,
      description: `Manage your digital wallet securely. Add funds, track transactions, and enjoy seamless payments with bank-level security.`,
      images: ["/images/logo.png"],
    },
    robots: {
      index: false, // Since this is a private/authenticated page
      follow: true,
    },
    alternates: {
      canonical: "/wallet",
    },
  };
}

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}