"use client";
import React, { useState } from "react";
import { useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
import { selectTotalPrice } from "@/redux/features/cart-slice";
import DigitalOrderSummary from "./DigitalOrderSummary";
import DigitalPaymentMethod from "./DigitalPaymentMethod";
import PageContainer from "../Common/PageContainer";

const Checkout = () => {
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const totalPrice = useSelector(selectTotalPrice);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return (
      <PageContainer>
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-gray-900 mb-4">
                Your cart is empty
              </h1>
              <p className="text-gray-600 mb-8">
                Add some digital codes to your cart before proceeding to checkout.
              </p>
              <a
                href="/shop-with-sidebar"
                className="inline-flex justify-center font-medium text-white bg-blue py-3 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark"
              >
                Continue Shopping
              </a>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                Checkout
              </h1>
              <p className="text-gray-600">
                Complete your purchase of digital codes - instant delivery guaranteed
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-11">
              {/* <!-- checkout left --> */}
              <div className="lg:max-w-[670px] w-full">
                {/* <!-- Digital Delivery Notice --> */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-7.5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Digital Delivery
                      </h3>
                      <p className="text-blue-800 text-sm">
                        Your digital codes will be delivered instantly after payment confirmation.
                        No shipping address required - codes will be available in your account immediately.
                      </p>
                    </div>
                  </div>
                </div>

                {/* <!-- Payment Method --> */}
                <DigitalPaymentMethod
                  totalPrice={totalPrice}
                  cartItems={cartItems}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </div>

              {/* <!-- checkout right --> */}
              <div className="lg:max-w-[455px] w-full">
                <DigitalOrderSummary cartItems={cartItems} totalPrice={totalPrice} />
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    </>
  );
};

export default Checkout;
