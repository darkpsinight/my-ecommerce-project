"use client";

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
