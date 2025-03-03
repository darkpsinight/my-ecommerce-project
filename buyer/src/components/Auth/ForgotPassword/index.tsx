"use client";

import { Spinner } from "@/components/Common/Spinner";
import ErrorAlert from "@/components/Common/ErrorAlert";
import SuccessAlert from "@/components/Common/SuccessAlert";
import { useForgotPassword } from "@/hooks/useForgotPassword";
import Link from "next/link";
import React from "react";

interface ForgotPasswordProps {
  appName: string;
}

const ForgotPassword = ({ appName }: ForgotPasswordProps) => {
  const {
    formData,
    loading,
    emailError,
    apiError,
    success,
    handleChange,
    handleSubmit,
  } = useForgotPassword();

  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
          <div className="text-center mb-11">
            <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
              Reset Your Password
            </h2>
            <p className="text-dark-4">
              Enter your email address and we’ll send you instructions to reset your password.
            </p>
          </div>

          {success && (
            <SuccessAlert
              message="Password reset email sent!"
              subMessage="If this email is registered, you’ll receive instructions to reset your password shortly."
            />
          )}

          <div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label htmlFor="email" className="block mb-2.5">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  className={`rounded-lg border ${
                    emailError ? "border-red" : "border-gray-3"
                  } bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20`}
                />
                {emailError && (
                  <div className="text-[#e53e3e] text-sm mt-1">
                    {emailError}
                  </div>
                )}
              </div>

              {apiError && (
                <ErrorAlert
                  message={apiError.message}
                  hint={apiError.hint}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center font-medium text-white bg-dark py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue mt-7.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Spinner className="w-5 h-5 mr-2" />
                    Sending Reset Instructions...
                  </>
                ) : (
                  "Send Reset Instructions"
                )}
              </button>

              <p className="text-center mt-6">
                <Link
                  href="/signin"
                  className="text-dark ease-out duration-200 hover:text-blue"
                >
                  Back to Sign In
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;