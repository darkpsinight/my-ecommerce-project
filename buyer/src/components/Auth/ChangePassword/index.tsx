"use client";

import { Spinner } from "@/components/Common/Spinner";
import ErrorAlert from "@/components/Common/ErrorAlert";
import SuccessAlert from "@/components/Common/SuccessAlert";
import { useChangePassword } from "@/hooks/useChangePassword";
import Link from "next/link";
import React from "react";
import PasswordInput from "../PasswordInput";

interface ChangePasswordProps {
  appName: string;
}

const ChangePassword = ({ appName }: ChangePasswordProps) => {
  const {
    formData,
    loading,
    passwordError,
    confirmPasswordError,
    apiError,
    success,
    handleChange,
    handleSubmit,
  } = useChangePassword();

  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
          <div className="text-center mb-11">
            <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
              Change Your Password
            </h2>
            <p className="text-dark-4">
              Enter your new password below to update your account.
            </p>
          </div>

          {success && (
            <SuccessAlert
              message="Password changed successfully!"
              subMessage="Your password has been updated. You can now sign in with your new password."
            />
          )}

          <div>
            <form onSubmit={handleSubmit} noValidate>
              <PasswordInput
                id="password"
                name="password"
                label="New Password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your new password"
                isRequired={true}
                error={passwordError}
              />

              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                isRequired={true}
                error={confirmPasswordError}
                showStrengthIndicator={false}
              />

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
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
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

export default ChangePassword;