"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Seller } from "@/types/seller";

interface SingleSellerListItemProps {
  seller: Seller;
}

const SingleSellerListItem: React.FC<SingleSellerListItemProps> = ({ seller }) => {
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
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
      <div className="flex gap-6 p-6">
        {/* Left Section - Profile Image */}
        <div className="flex-shrink-0">
          <div className="relative flex flex-col items-center">
            {/* Banner Background */}
            <div className="w-24 h-12 rounded-lg bg-gradient-to-r from-green-light-5 to-blue-light-6 overflow-hidden mb-3">
              {seller.bannerImageUrl ? (
                <Image
                  src={seller.bannerImageUrl}
                  alt={`${getDisplayName()} banner`}
                  width={96}
                  height={48}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-green/10 to-blue/10" />
              )}
            </div>
            
            {/* Profile Image - Positioned below banner with proper spacing */}
            <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-1 overflow-hidden relative">
              {seller.profileImageUrl ? (
                <Image
                  src={seller.profileImageUrl}
                  alt={`${getDisplayName()} profile`}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green to-blue flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Verified Badge */}
              {seller.badges && seller.badges.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-green text-white p-1 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Section - Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-bold text-xl text-dark mb-1 group-hover:text-green transition-colors duration-200">
                {getDisplayName()}
              </h3>
              <p className="text-sm text-dark-3 mb-2">
                {getCompanyName()}
              </p>
              
              {/* Badges */}
              {seller.badges && seller.badges.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 bg-green-light-5 text-green-dark px-2 py-1 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.719c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Verified Seller
                  </div>
                  <span className="text-xs text-dark-3">
                    {seller.badges.length} Badge{seller.badges.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Join Date */}
            <div className="text-right text-xs text-dark-3">
              <div className="flex items-center gap-1 mb-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span>Joined</span>
              </div>
              <div className="font-medium text-dark">
                {formatJoinDate(seller.createdAt)}
              </div>
            </div>
          </div>

          {/* About Description */}
          {seller.about && (
            <p className="text-dark-4 mb-4 line-clamp-2 leading-relaxed">
              {seller.about}
            </p>
          )}

          {/* Company Details */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {seller.enterpriseDetails?.website && (
              <a
                href={seller.enterpriseDetails.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue hover:text-blue-dark transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                </svg>
                Website
              </a>
            )}

            {/* Social Media Links */}
            {seller.enterpriseDetails?.socialMedia && seller.enterpriseDetails.socialMedia.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-dark-3">Social:</span>
                {seller.enterpriseDetails.socialMedia.slice(0, 4).map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-gray-1 hover:bg-green hover:text-white transition-colors duration-200 flex items-center justify-center text-xs font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {social.platform.charAt(0).toUpperCase()}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>


        </div>
      </div>
    </Link>
  );
};

export default SingleSellerListItem;