"use client";
import { FacebookIcon, GoogleIcon, XIcon } from "@/components/Common/Icons";
import Link from "next/link";
import React from "react";
import PasswordInput from "../PasswordInput";
import { useSignup } from "@/hooks/useSignup";
import { Spinner } from '@/components/Common/Spinner/index';
import ErrorAlert from '@/components/Common/ErrorAlert';

const Signup = () => {
  const { formData, loading, nameError, emailError, passwordError, confirmPasswordError, apiError, handleChange, handleSubmit } = useSignup();

  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
          <div className="text-center mb-11">
            <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
              Create Your Account
            </h2>
          </div>

          <div className="flex flex-col gap-4.5">
            <button className="flex justify-center items-center gap-3.5 rounded-lg border border-gray-3 bg-gray-1 p-3 ease-out duration-200 hover:bg-gray-2">
              <GoogleIcon />
              Sign Up with Google
            </button>

            <button className="flex justify-center items-center gap-3.5 rounded-lg border border-gray-3 bg-gray-1 p-3 ease-out duration-200 hover:bg-gray-2">
              <FacebookIcon />
              Sign Up with Facebook
            </button>

            <button className="flex justify-center items-center gap-3.5 rounded-lg border border-gray-3 bg-gray-1 p-3 ease-out duration-200 hover:bg-gray-2">
              <XIcon />
              Sign Up with X
            </button>
          </div>

          <span className="relative z-1 block font-medium text-center mt-4.5">
                  <span className="block absolute -z-1 left-0 top-1/2 h-px w-full bg-gray-3"></span>
                  <span className="inline-block px-3 bg-white">OR</span>
                </span>

          <div className="mt-5.5">
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label htmlFor="name" className="block mb-2.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className={`rounded-lg border ${nameError ? 'border-red' : 'border-gray-3'} bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20`}
                />
                {nameError && <div className="text-[#e53e3e] text-sm mt-1">{nameError}</div>}
              </div>

              <div className="mb-5">
                <label htmlFor="email" className="block mb-2.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                  className={`rounded-lg border ${emailError ? 'border-red' : 'border-gray-3'} bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20`}
                />
                {emailError && <div className="text-[#e53e3e] text-sm mt-1">{emailError}</div>}
              </div>

              <PasswordInput
                id="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                isRequired={true}
                error={passwordError}
              />

              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Re-type Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-type your password"
                isRequired={true}
                error={confirmPasswordError}
                showStrengthIndicator={false}
              />

              <p className="text-dark-4 text-sm mt-4 mb-6">
                By creating an account, you agree to CodeSale&apos;s{" "}
                <Link href="/conditions" className="text-blue hover:underline">
                  Conditions of Use & Sale
                </Link>
                . Please see our{" "}
                <Link href="/privacy" className="text-blue hover:underline">
                  Privacy Notice
                </Link>
                , our{" "}
                <Link href="/cookies" className="text-blue hover:underline">
                  Cookies Notice
                </Link>{" "}
                and our{" "}
                <Link href="/ads" className="text-blue hover:underline">
                  Interest-Based Ads Notice
                </Link>
                .
              </p>

              {apiError && (
                <ErrorAlert
                  message={apiError.message}
                  hint={apiError.hint}
                  links={apiError.links}
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
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <p className="text-center mt-6">
                <Link
                  href="/signin"
                  className="text-dark ease-out duration-200 hover:text-blue pl-2"
                >
                  Already have an account?
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
