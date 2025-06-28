import React from "react";
import NewHero from "./NewHero";
import CategoryGrid from "./CategoryGrid";
import FeaturedCarousel from "./FeaturedCarousel";

import DynamicInventory from "./DynamicInventory";
import Testimonials from "./Testimonials";
import Newsletter from "../Common/Newsletter";

import DigitalPromoBanner from "./PromoBanner/DigitalPromoBannerFixed";
import FeatureHighlights from "./FeatureHighlights";
import FloatingActions from "./FloatingActions";
import ScrollIndicator from "./ScrollIndicator";
import RecentlyViewedProducts from "../ViewedProducts/RecentlyViewedProducts";

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
      <CategoryGrid />
      <FeaturedCarousel />
      <DigitalPromoBanner />
      <RecentlyViewedProducts 
        className="my-12 mx-4 lg:mx-8" 
        maxItems={6}
        compact={false}
        onProductClick={(product) => {
          // Track homepage clicks
          if (typeof window !== 'undefined') {
            window.location.href = `/shop-details?id=${product.id}`;
          }
        }}
      />
      <PricingShowcase />
      <FeatureHighlights />
      <DynamicInventory totalProducts={totalProducts} />
      <Testimonials />
      <Newsletter />
      <FloatingActions />
    </main>
  );
};

export default Home;
