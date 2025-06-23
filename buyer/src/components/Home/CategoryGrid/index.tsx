"use client";
import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";

const CategoryGrid = () => {
  const { categories, loading, error } = useCategories();

  // Digital marketplace category mappings
  const digitalCategories = [
    {
      id: 'steam',
      title: 'Steam Keys',
      count: '4+ Titles',
      icon: '🎮',
      description: 'Game Keys & Software',
      gradient: 'from-blue-light-5 to-blue-light-4',
      href: '/shop-without-sidebar?category=steam'
    },
    {
      id: 'playstation',
      title: 'PlayStation',
      count: 'Global Codes',
      icon: '🎯',
      description: 'PSN & Game Codes',
      gradient: 'from-green-light-6 to-green-light-5',
      href: '/shop-without-sidebar?category=playstation'
    },
    {
      id: 'xbox',
      title: 'Xbox',
      count: '3+ Options',
      icon: '🎪',
      description: 'Xbox & Game Pass',
      gradient: 'from-yellow-light-4 to-yellow-light-2',
      href: '/shop-without-sidebar?category=xbox'
    },
    {
      id: 'giftcards',
      title: 'Gift Cards',
      count: '15+ Brands',
      icon: '🎁',
      description: 'All Major Brands',
      gradient: 'from-purple-100 to-purple-50',
      href: '/shop-without-sidebar?category=giftcards'
    }
  ];

  // Get actual categories if available, otherwise use digital categories
  const getDisplayCategories = () => {
    if (categories && categories.length > 0) {
      // Map API categories to our digital format
      return categories.slice(0, 4).map((cat, index) => ({
        ...digitalCategories[index] || digitalCategories[0],
        title: cat.title,
        id: cat.id,
        href: `/shop-without-sidebar?category=${cat.id}`
      }));
    }
    return digitalCategories;
  };

  if (loading) {
    return (
      <section className="py-10 lg:py-12.5 xl:py-15 bg-gray-1">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="bg-white rounded-lg p-6 h-[180px] flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-gray-3 rounded-full"></div>
                    <div className="h-4 bg-gray-3 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-3 rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-gray-3 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 lg:py-12.5 xl:py-15 bg-gray-1">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {getDisplayCategories().map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group block"
            >
              <div className={`bg-gradient-to-br ${category.gradient} rounded-lg p-6 h-[180px] flex flex-col justify-between transition-all duration-300 hover:scale-105 hover:shadow-lg border border-gray-3 hover:border-blue-light-3`}>
                <div className="space-y-3">
                  <div className="text-4xl mb-2 animate-pulse-slow">{category.icon}</div>
                  <h3 className="font-semibold text-lg text-dark group-hover:text-blue transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-dark-4 group-hover:text-dark-3 transition-colors">
                    {category.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue bg-white bg-opacity-70 px-3 py-1.5 rounded-full border">
                      {category.count}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue group-hover:opacity-80 transition-opacity">
                    Explore →
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white bg-opacity-50 flex items-center justify-center group-hover:bg-opacity-70 transition-all">
                    <svg
                      className="w-4 h-4 text-blue"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;