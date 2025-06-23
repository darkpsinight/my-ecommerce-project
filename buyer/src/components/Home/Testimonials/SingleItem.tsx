import React from "react";
import { Testimonial } from "@/types/testimonial";
import Image from "next/image";

const SingleItem = ({ testimonial }: { testimonial: Testimonial }) => {
  return (
    <div className="group relative bg-gradient-to-br from-white to-blue-light-5 border border-blue-light-3 rounded-2xl py-8 px-6 sm:px-8 m-1 hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2">
      {/* Decorative Quote Icon */}
      <div className="absolute top-4 right-6 text-blue-light-2 opacity-20 text-4xl font-bold">
        &ldquo;
      </div>
      
      {/* Rating Stars */}
      <div className="flex items-center gap-1 mb-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="text-yellow text-lg">
            ⭐
          </div>
        ))}
        <span className="ml-2 text-sm font-medium text-blue bg-blue-light-5 px-2 py-1 rounded-full">
          5.0
        </span>
      </div>

      {/* Review Text */}
      <div className="relative">
        <p className="text-dark-2 mb-8 leading-relaxed text-base italic">
          &ldquo;{testimonial.review}&rdquo;
        </p>
      </div>

      {/* Author Info */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-blue-light-3 group-hover:border-blue transition-colors duration-300">
            <Image
              src={testimonial.authorImg}
              alt="author"
              className="w-full h-full object-cover"
              width={56}
              height={56}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green rounded-full border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-dark text-lg group-hover:text-blue transition-colors duration-300">
            {testimonial.authorName}
          </h3>
          <p className="text-dark-4 text-sm font-medium">{testimonial.authorRole}</p>
          <div className="flex items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-green rounded-full"></div>
            <span className="text-green text-xs font-medium">Verified Buyer</span>
          </div>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-light-2 transition-colors duration-300 pointer-events-none"></div>
    </div>
  );
};

export default SingleItem;
