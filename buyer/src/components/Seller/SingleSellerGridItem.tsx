"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Seller } from "@/types/seller";

interface SingleSellerGridItemProps {
  seller: Seller;
}

const SingleSellerGridItem: React.FC<SingleSellerGridItemProps> = ({ seller }) => {
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const getDisplayName = () => {
    return seller.marketName || seller.nickname;
  };

  const getCompanyName = () => {
    return seller.enterpriseDetails?.companyName || seller.nickname;
  };

  return (
    <Link href={`/marketplace/${seller.externalId || seller._id}`} className="block">
      <div className="group relative overflow-hidden rounded-xl bg-white shadow-1 hover:shadow-2 transition-all duration-300 border-2 border-green/20 hover:border-green cursor-pointer">
      {/* Banner Image */}
      <div className="relative h-24 bg-gradient-to-r from-green-light-5 to-blue-light-6 overflow-hidden">
        {seller.bannerImageUrl ? (
          <Image
            src={seller.bannerImageUrl}
            alt={`${getDisplayName()} banner`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-green/10 to-blue/10" />
        )}
        
        {/* Profile Image */}
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-1 overflow-hidden">
            {seller.profileImageUrl ? (
              <Image
                src={seller.profileImageUrl}
                alt={`${getDisplayName()} profile`}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green to-blue flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {getDisplayName().charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Verified Badge */}
        {seller.badges && seller.badges.length > 0 && (
          <div className="absolute top-2 right-2 bg-green text-white px-2 py-1 rounded-full text-xs font-medium">
            <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 pt-10">
        {/* Seller Name */}
        <h3 className="font-bold text-lg text-dark mb-1 line-clamp-1 group-hover:text-green transition-colors duration-200">
          {getDisplayName()}
        </h3>

        {/* Company Name */}
        <p className="text-sm text-dark-3 mb-2 line-clamp-1">
          {getCompanyName()}
        </p>

        {/* About */}
        {seller.about && (
          <p className="text-sm text-dark-4 mb-3 line-clamp-2">
            {seller.about}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-dark-3 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>Joined {formatJoinDate(seller.createdAt)}</span>
          </div>
          
          {seller.badges && seller.badges.length > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{seller.badges.length} Badge{seller.badges.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Social Media */}
        {seller.enterpriseDetails?.socialMedia && seller.enterpriseDetails.socialMedia.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {seller.enterpriseDetails.socialMedia.slice(0, 3).map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 rounded-full bg-gray-1 hover:bg-green hover:text-white transition-colors duration-200 flex items-center justify-center text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {social.platform.charAt(0).toUpperCase()}
              </a>
            ))}
          </div>
        )}


        </div>
      </div>
    </Link>
  );
};

export default SingleSellerGridItem;