"use client";
import Marquee from "react-fast-marquee";
import Image from "next/image";

const TrustedBrands = () => {
  // Brand logos data - using actual brand images
  const brands = [
    {
      name: "Netflix",
      image: "/images/brands-Hero/brand-logo-netflix.png",
    },
    {
      name: "Amazon",
      image: "/images/brands-Hero/brand-logo-amazon.png",
    },
    {
      name: "eBay",
      image: "/images/brands-Hero/brand-logo-ebay.png",
    },
    {
      name: "iTunes",
      image: "/images/brands-Hero/brand-logo-itunes.png",
    },
    {
      name: "Steam",
      image: "/images/brands-Hero/brand-logo-steam.png",
    },
    {
      name: "Spotify",
      image: "/images/brands-Hero/brand-logo-spotify.png",
    },
    {
      name: "PlayStation",
      image: "/images/brands-Hero/brand-logo-playstation.png",
    },
    {
      name: "Xbox",
      image: "/images/brands-Hero/brand-logo-xbox.png",
    },
    {
      name: "Google Play",
      image: "/images/brands-Hero/brand-logo-google-play.png.png",
    },
    {
      name: "Hulu",
      image: "/images/brands-Hero/brand-logo-hulu.png",
    },
    {
      name: "Paramount",
      image: "/images/brands-Hero/brand-logo-paramount.png",
    },
  ];

  return (
    <section className="bg-gray">
      {/* Marquee */}
      <Marquee
        pauseOnHover={false}
        speed={150}
        gradient={true}
        gradientWidth={50}
        className="overflow-hidden"
      >
        {brands.map((brand, index) => (
          <div
            key={`${brand.name}-${index}`}
            className="group flex items-center justify-center mx-8 lg:mx-12 xl:mx-16 opacity-70 hover:opacity-100 transition-opacity duration-300"
          >
            <div className="flex items-center justify-center h-16 grayscale hover:grayscale-0 transition-all duration-300">
              <Image
                src={brand.image}
                alt={brand.name}
                width={120}
                height={40}
                className="object-contain max-h-10 w-auto"
                priority={index < 6}
              />
            </div>
          </div>
        ))}
      </Marquee>
    </section>
  );
};

export default TrustedBrands;
