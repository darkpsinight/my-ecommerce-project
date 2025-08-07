import React, { useState } from "react";
import Image from "next/image";
import { SearchSuggestion } from "../types/SearchTypes";
import { ImageCache } from "../utils/ImageCache";
import { ImageOptimizer } from "../utils/ImageOptimizer";

interface SuggestionImageProps {
  suggestion: SearchSuggestion;
}

const FallbackImage: React.FC<{ suggestion: SearchSuggestion }> = ({ suggestion }) => {
  const getInitials = (text: string): string => {
    return text
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getBackgroundStyle = (type: string) => {
    const styles = {
      title: { backgroundColor: "#3C50E0", color: "#FFFFFF" },
      platform: { backgroundColor: "#22AD5C", color: "#FFFFFF" },
      tag: { backgroundColor: "#8B5CF6", color: "#FFFFFF" },
      seller: { backgroundColor: "#F27430", color: "#FFFFFF" },
      description: { backgroundColor: "#6B7280", color: "#FFFFFF" },
      default: { backgroundColor: "#3C50E0", color: "#FFFFFF" },
    };
    return styles[type as keyof typeof styles] || styles.default;
  };

  return (
    <div
      style={{
        ...getBackgroundStyle(suggestion.type),
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "600",
        minWidth: "40px",
        minHeight: "40px",
      }}
    >
      {getInitials(suggestion.text)}
    </div>
  );
};

export const SuggestionImage: React.FC<SuggestionImageProps> = React.memo(({ suggestion }) => {
  const imageCache = ImageCache.getInstance();
  const optimizedImageUrl = ImageOptimizer.optimizeImageUrl(suggestion.imageUrl);
  const cacheKey = `${suggestion.text}-${optimizedImageUrl}`;

  // Initialize cache entry if it doesn't exist
  if (!imageCache.has(cacheKey)) {
    imageCache.set(cacheKey, { loaded: false, error: false });
  }

  const cachedState = imageCache.get(cacheKey)!;
  const [imageError, setImageError] = useState(cachedState.error);
  const [imageLoaded, setImageLoaded] = useState(cachedState.loaded);

  if (!optimizedImageUrl || imageError) {
    return <FallbackImage suggestion={suggestion} />;
  }

  return (
    <div className="relative w-10 h-10">
      {/* Show fallback while loading */}
      {!imageLoaded && <FallbackImage suggestion={suggestion} />}

      {/* Actual image */}
      <Image
        src={optimizedImageUrl}
        alt={suggestion.text}
        width={40}
        height={40}
        className={`absolute inset-0 object-contain transition-opacity duration-200 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => {
          imageCache.set(cacheKey, { loaded: true, error: false });
          setImageLoaded(true);
        }}
        onError={() => {
          imageCache.set(cacheKey, { loaded: false, error: true });
          setImageError(true);
        }}
        unoptimized={true}
        priority={false}
      />
    </div>
  );
});

SuggestionImage.displayName = "SuggestionImage";