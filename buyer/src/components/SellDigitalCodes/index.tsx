import PageContainer from "../Common/PageContainer";
import HeroSection from "./sections/HeroSection";
import StatsSection from "./sections/StatsSection";
import FeaturesSection from "./sections/FeaturesSection";
import CTASection from "./sections/CTASection";

interface SellDigitalCodesProps {
  appName: string;
}

const SellDigitalCodes = ({ appName }: SellDigitalCodesProps) => {
  return (
    <PageContainer>
      <HeroSection appName={appName} />
      <StatsSection />
      <FeaturesSection appName={appName} />
      <CTASection appName={appName} />
    </PageContainer>
  );
};

export default SellDigitalCodes;
