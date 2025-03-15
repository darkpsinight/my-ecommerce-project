import SellDigitalCodes from "@/components/SellDigitalCodes";
import { getPublicConfigs } from "@/services/config";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { configs } = await getPublicConfigs();

  return {
    title: `Sell Digital Codes | ${configs.APP_NAME}`,
    description: `Sell your digital codes to thousands of buyers worldwide in ${configs.APP_NAME} marketplace`,
    openGraph: {
      title: `Sell Digital Codes | ${configs.APP_NAME}`,
      description: `Sell your digital codes to thousands of buyers worldwide in ${configs.APP_NAME} marketplace`,
      type: "website",
      url: "/sell-digital-codes",
    },
  };
}

const SellDigitalCodesPage = async () => {
  const { configs } = await getPublicConfigs();
  return <SellDigitalCodes appName={configs.APP_NAME} />;
};

export default SellDigitalCodesPage;
