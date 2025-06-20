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
  const token = useAppSelector((state) => state.authReducer.token);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not authenticated
  if (!token) {
    return (
      <PageContainer>
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-gray-900 mb-4">
                Please Sign In
              </h1>
              <p className="text-gray-600 mb-8">
                You need to be signed in to complete your purchase.
              </p>
              <a
                href="/signin"
                className="inline-flex justify-center font-medium text-white bg-blue py-3 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark"
              >
                Sign In
              </a>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

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
    <PageContainer>
      <section className="py-15 sm:py-12 lg:py-20">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            Checkout
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Complete your purchase of digital codes - instant delivery guaranteed
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-11">
          {/* Checkout Left */}
          <div className="lg:max-w-[670px] w-full">
            {/* Digital Delivery Notice */}
            

            {/* Wallet Balance */}
            <DigitalPaymentMethod
              totalPrice={totalPrice}
              cartItems={cartItems}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </div>

          {/* Checkout Right */}
          <div className="lg:max-w-[455px] w-full">
            <DigitalOrderSummary cartItems={cartItems} totalPrice={totalPrice} />
          </div>
        </div>
      </section>
    </PageContainer>
  );
};

export default Checkout;
