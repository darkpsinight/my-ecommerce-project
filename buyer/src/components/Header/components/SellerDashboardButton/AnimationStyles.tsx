import React from 'react';

const AnimationStyles: React.FC = () => (
  <style jsx global>{`
    @keyframes pulseGlow {
      0% {
        box-shadow: 0 0 0 0 rgba(60, 80, 224, 0.4);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(60, 80, 224, 0.6);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(60, 80, 224, 0);
      }
    }

    @keyframes shimmer {
      0% {
        background-position: -200% center;
      }
      100% {
        background-position: 200% center;
      }
    }

    .flash-animation {
      animation: pulseGlow 1.5s ease-out;
      background: linear-gradient(
        90deg,
        #ffffff 25%,
        #f0f4ff 50%,
        #ffffff 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .hover-animation {
      background: linear-gradient(
        90deg,
        #ffffff 25%,
        #f0f4ff 50%,
        #ffffff 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      box-shadow: 0 0 5px rgba(60, 80, 224, 0.5);
    }

    .fade-out-animation {
      transition: border-color 1s ease-out;
      background: white;
    }
  `}</style>
);

export default AnimationStyles;
