import SellDigitalCodes from "@/components/SellDigitalCodes";
import { getPublicConfigs } from "@/services/config";

const SellDigitalCodesPage = async () => {
  const { configs } = await getPublicConfigs();
  return <SellDigitalCodes appName={configs.APP_NAME} />;
};

export default SellDigitalCodesPage;
