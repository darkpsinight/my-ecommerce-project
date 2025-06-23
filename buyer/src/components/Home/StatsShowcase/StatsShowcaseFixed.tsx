"use client";
import { useEffect, useState } from "react";

const StatsShowcase = () => {
  const [mounted, setMounted] = useState(false);
  const [counters, setCounters] = useState({
    users: 0,
    orders: 0,
    regions: 0,
    satisfaction: 0
  });

  useEffect(() => {
    setMounted(true);
    
    // Animate counters on mount
    const targets = {
      users: 25000,
      orders: 150000,
      regions: 120,
      satisfaction: 98
    };

    const duration = 2000; // 2 seconds
    const interval = 50; // update every 50ms
    const steps = duration / interval;

    const increments = {
      users: targets.users / steps,
      orders: targets.orders / steps,
      regions: targets.regions / steps,
      satisfaction: targets.satisfaction / steps
    };

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      
      setCounters(prev => ({
        users: Math.min(Math.floor(increments.users * currentStep), targets.users),
        orders: Math.min(Math.floor(increments.orders * currentStep), targets.orders),
        regions: Math.min(Math.floor(increments.regions * currentStep), targets.regions),
        satisfaction: Math.min(Math.floor(increments.satisfaction * currentStep), targets.satisfaction)
      }));

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounters(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  const stats = [
    {
      icon: "👥",
      value: formatNumber(counters.users),
      suffix: "+",
      label: "Active Users",
      color: "text-blue",
      bgGradient: "from-blue-light-5 to-blue-light-4",
      borderColor: "border-blue-light-3"
    },
    {
      icon: "📦",
      value: formatNumber(counters.orders),
      suffix: "+",
      label: "Orders Completed",
      color: "text-green",
      bgGradient: "from-green-light-6 to-green-light-5",
      borderColor: "border-green-light-4"
    },
    {
      icon: "🌍",
      value: counters.regions.toString(),
      suffix: "+",
      label: "Global Regions",
      color: "text-orange",
      bgGradient: "from-yellow-light-4 to-yellow-light-2",
      borderColor: "border-yellow-light-1"
    },
    {
      icon: "⭐",
      value: counters.satisfaction.toString(),
      suffix: "%",
      label: "Satisfaction Rate",
      color: "text-purple",
      bgGradient: "from-purple-100 to-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  return (
    <section className="py-12 lg:py-16 bg-gradient-to-r from-gray-1 via-white to-gray-1">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-heading-5 font-bold text-dark mb-3">
            Trusted by <span className="text-blue">Thousands</span> Worldwide
          </h2>
          <p className="text-dark-4 text-lg">
            Join our growing community of satisfied digital code traders
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`group relative bg-gradient-to-br ${stat.bgGradient} rounded-xl p-6 border ${stat.borderColor} hover:shadow-2xl transition-all duration-500 hover:scale-105 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Floating background element */}
              <div className="absolute top-0 right-0 w-16 h-16 opacity-10 transform rotate-12 group-hover:rotate-45 transition-transform duration-500">
                <div className={`w-full h-full bg-gradient-to-br ${stat.bgGradient} rounded-lg`}></div>
              </div>

              {/* Icon */}
              <div className="text-4xl mb-4 group-hover:animate-bounce">
                {stat.icon}
              </div>

              {/* Value */}
              <div className="mb-2">
                <span className={`text-3xl lg:text-4xl font-bold ${stat.color} group-hover:scale-110 transition-transform duration-300 inline-block`}>
                  {stat.value}
                </span>
                <span className={`text-2xl lg:text-3xl font-semibold ${stat.color} ml-1`}>
                  {stat.suffix}
                </span>
              </div>

              {/* Label */}
              <p className="text-dark-3 font-medium text-sm lg:text-base group-hover:text-dark-2 transition-colors">
                {stat.label}
              </p>

              {/* Hover effect indicator */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          ))}
        </div>

        {/* Bottom decorative elements */}
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-green rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-orange rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <div className="w-2 h-2 bg-purple rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default StatsShowcase;