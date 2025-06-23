import React from "react";
import NewHero from "./NewHero";
import CategoryGrid from "./CategoryGrid";
import FeaturedCarousel from "./FeaturedCarousel";
import TrustMatrix from "./TrustMatrix";
import DynamicInventory from "./DynamicInventory";
import Testimonials from "./Testimonials";
import Newsletter from "../Common/Newsletter";
import StatsShowcase from "./StatsShowcase/StatsShowcaseFixed";
import DigitalPromoBanner from "./PromoBanner/DigitalPromoBannerFixed";
import FeatureHighlights from "./FeatureHighlights";
import FloatingActions from "./FloatingActions";
import ScrollIndicator from "./ScrollIndicator";
import InteractiveStats from "./InteractiveStats";
import PricingShowcase from "./PricingShowcase";


const Home = () => {
  // Mock total products count - in real app, this would come from props or API
  // Change this to < 15 to see the "Coming Soon" section
  // Change this to >= 15 to see the "Deal of the Day" banner
  const totalProducts = 25; 

  return (
    <main className="overflow-hidden">
      <ScrollIndicator />
      <NewHero />
      <StatsShowcase />
      <CategoryGrid />
      <FeaturedCarousel />
      <DigitalPromoBanner />
      <TrustMatrix />
      <FeatureHighlights />
      <InteractiveStats />
      <PricingShowcase />
      <DynamicInventory totalProducts={totalProducts} />
      <Testimonials />
      <Newsletter />
      <FloatingActions />
    </main>
  );
};

export default Home;
