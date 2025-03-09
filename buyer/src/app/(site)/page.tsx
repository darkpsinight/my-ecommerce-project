import Home from "@/components/Home";
import { getPublicConfigs } from "@/services/config";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { configs } = await getPublicConfigs();

  return {
    title: `${configs.APP_NAME} | Digital Codes Marketplace`,
    description: `Secure marketplace for instant trading of digital codes. Get competitive deals on gift cards, game keys, software licenses, eBooks & vouchers. Verified sellers, 24/7 support, and instant delivery guaranteed. Start trading on ${configs.APP_NAME} today!`,
    keywords: [
      'digital codes marketplace',
      'buy gift cards',
      'sell game keys',
      'instant code trading',
      'software licenses marketplace',
      'digital vouchers',
      'CodeSale trading platform'
    ],
    openGraph: {
      title: `${configs.APP_NAME} | Buy & Sell Digital Codes - Gift Cards, Game Keys, Software Licenses, eBooks & Vouchers`,
      description: `${configs.APP_NAME} is your secure marketplace to buy, sell, or trade digital codes instantly. Find the best deals on gift cards, game keys, software licenses, eBooks, vouchers, and more. Enjoy fast transactions, verified sellers, and competitive prices. Start trading today!`,
      type: "website",
      url: "/",
      siteName: configs.APP_NAME,
      images: [
        {
          url: "/images/logo.png",
          width: 800,
          height: 600,
          alt: "Digital Codes Marketplace",
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${configs.APP_NAME} | Digital Code Trading Platform`,
      description: 'Your secure marketplace for instant digital code transactions',
      images: ['/images/logo.png'],
      site: '@yourtwitterhandle'
    }
  };
}

export default function HomePage() {
  return (
    <>
      <Home />
    </>
  );
}
