"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const FloatingActions = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const actions = [
    {
      icon: "💬",
      label: "Live Chat",
      href: "/support",
      color: "bg-green hover:bg-green-dark",
      action: null
    },
    {
      icon: "🛒",
      label: "Quick Buy",
      href: "/products",
      color: "bg-blue hover:bg-blue-dark",
      action: null
    },
    {
      icon: "📱",
      label: "Mobile App",
      href: "/download-app",
      color: "bg-purple hover:bg-purple-600",
      action: null
    },
    {
      icon: "⬆️",
      label: "Back to Top",
      href: "#",
      color: "bg-orange hover:bg-orange-dark",
      action: scrollToTop
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Action Items */}
      <div className={`flex flex-col gap-3 transition-all duration-500 ${isExpanded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'}`}>
        {actions.map((action, index) => (
          <div
            key={index}
            className="flex items-center gap-3 group"
            style={{ transitionDelay: `${index * 0.1}s` }}
          >
            {/* Label */}
            <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 whitespace-nowrap">
              <span className="text-sm font-medium text-dark">{action.label}</span>
            </div>
            
            {/* Button */}
            {action.action ? (
              <button
                onClick={action.action}
                className={`w-12 h-12 ${action.color} text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl text-lg`}
              >
                {action.icon}
              </button>
            ) : (
              <Link
                href={action.href}
                className={`w-12 h-12 ${action.color} text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl text-lg`}
              >
                {action.icon}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Main FAB Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-14 h-14 bg-gradient-to-r from-blue to-blue-dark text-white rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl border-2 border-white ${isExpanded ? 'rotate-45' : 'rotate-0'}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>

      {/* Pulse Animation */}
      {!isExpanded && (
        <div className="absolute w-14 h-14 bg-blue rounded-full animate-ping opacity-20 pointer-events-none"></div>
      )}
    </div>
  );
};

export default FloatingActions;