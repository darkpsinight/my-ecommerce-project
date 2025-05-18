import { Category } from "@/types/category";
import React, { useState } from "react";
import Image from "next/image";

const SingleItem = ({ item }: { item: Category }) => {
  const [imgError, setImgError] = useState(false);
  const fallbackImage = "/images/categories/categories-01.png";

  return (
    <a href="#" className="group flex flex-col items-center">
      <div className="max-w-[130px] w-full bg-[#F2F3F8] h-32.5 rounded-full flex items-center justify-center mb-4 overflow-hidden">
        <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden flex items-center justify-center">
          <Image
            src={imgError ? fallbackImage : item.img}
            alt={item.title || "Category"}
            fill
            sizes="100px"
            className="object-cover rounded-full"
            onError={() => setImgError(true)}
            priority
          />
        </div>
      </div>

      <div className="flex justify-center">
        <h3 className="inline-block font-medium text-center text-dark bg-gradient-to-r from-blue to-blue bg-[length:0px_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 hover:bg-[length:100%_3px] group-hover:bg-[length:100%_1px] group-hover:text-blue">
          {item.title}
        </h3>
      </div>
    </a>
  );
};

export default SingleItem;
