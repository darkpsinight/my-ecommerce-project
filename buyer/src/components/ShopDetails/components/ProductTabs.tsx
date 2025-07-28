"use client";
import React from 'react';
import { Product } from '@/types/product';

interface Tab {
  id: string;
  title: string;
}

interface ProductTabsProps {
  product: Product;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: Tab[];
}

const ProductTabs: React.FC<ProductTabsProps> = ({
  product,
  activeTab,
  setActiveTab,
  tabs
}) => {
  return (
    <div className="mt-12">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-blue text-blue"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {activeTab === "tabOne" && (
          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Product Description
            </h3>
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: product.description || "No description available.",
              }}
            />
          </div>
        )}

        {activeTab === "tabTwo" && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Platform:</span>
                  <span className="text-gray-700">{product.platform || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Region:</span>
                  <span className="text-gray-700">{product.region || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Category:</span>
                  <span className="text-gray-700">{product.categoryName || "N/A"}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Auto Delivery:</span>
                  <span className="text-gray-700">
                    {product.autoDelivery ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Stock:</span>
                  <span className="text-gray-700">
                    {product.quantityOfActiveCodes} available
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;