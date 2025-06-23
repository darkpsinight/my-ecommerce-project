import Home from "@/components/Home";
import { getPublicConfigs } from "@/services/config";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { configs } = await getPublicConfigs();

  return {
    title: `${configs.APP_NAME} | Instant Digital Codes, Any Region - Verified Sellers Worldwide`,
    description: `${configs.APP_NAME} is the leading global marketplace for instant digital codes. Buy Steam keys, PlayStation codes, Xbox Game Pass, gift cards & more from verified sellers across 120+ regions. Get instant delivery under 60 seconds with 24/7 support and secure payments. Start trading digital codes today!`,
    keywords: [
      'instant digital codes',
      'buy steam keys online',
      'global gift cards marketplace',
      'verified sellers platform',
      'instant code delivery',
      'secure digital trading',
      'worldwide digital vouchers',
      'game keys marketplace',
      'playstation codes global',
      'xbox gift cards',
      'digital marketplace worldwide',
      'secure code trading'
    ],
    openGraph: {
      title: `${configs.APP_NAME} | Global Digital Codes Marketplace - Instant Delivery, Any Region`,
      description: `Discover the world's most trusted marketplace for digital codes. Buy & sell Steam keys, gift cards, game codes & more from verified sellers across 120+ regions. Instant delivery under 60 seconds, 24/7 support, and secure payments guaranteed. Join thousands of satisfied traders on ${configs.APP_NAME}!`,
      type: "website",
      url: "/",
      siteName: configs.APP_NAME,
      images: [
        {
          url: "/images/logo.png",
          width: 1200,
          height: 630,
          alt: `${configs.APP_NAME} - Global Digital Codes Marketplace`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${configs.APP_NAME} | Instant Digital Codes Worldwide`,
      description: 'Global marketplace for Steam keys, gift cards & digital codes. Verified sellers, instant delivery, secure payments.',
      images: ['/images/logo.png'],
      site: '@yourtwitterhandle'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: '/',
    },
  };
}

export default function HomePage() {
  return (
    <>
      <Home />
    </>
  );
}
