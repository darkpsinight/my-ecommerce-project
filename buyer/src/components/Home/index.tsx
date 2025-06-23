import React from "react";
import NewHero from "./NewHero";
import CategoryGrid from "./CategoryGrid";
import FeaturedCarousel from "./FeaturedCarousel";
import TrustMatrix from "./TrustMatrix";
import DynamicInventory from "./DynamicInventory";
import Testimonials from "./Testimonials";
import Newsletter from "../Common/Newsletter";

const Home = () => {
  // Mock total products count - in real app, this would come from props or API
  // Change this to < 15 to see the "Coming Soon" section
  // Change this to >= 15 to see the "Deal of the Day" banner
  const totalProducts = 25; 

  return (
    <main>
      <NewHero />
      <CategoryGrid />
      <FeaturedCarousel />
      <TrustMatrix />
      <DynamicInventory totalProducts={totalProducts} />
      <Testimonials />
      <Newsletter />
    </main>
  );
};

export default Home;
