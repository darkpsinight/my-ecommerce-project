import { FacebookIcon, GoogleIcon, XIcon } from "@/components/Common/Icons";
import Link from "next/link";
import React from "react";
import PasswordInput from "../PasswordInput";

const Signup = () => {
  return (
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
            <div className="text-center mb-11">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Create an Account
              </h2>
              <p>Its quick and safe.</p>
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
              <span className="inline-block px-3 bg-white">Or</span>
            </span>

            <div className="mt-5.5">
              <form>
                <div className="mb-5">
                  <label htmlFor="name" className="block mb-2.5">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Enter your full name"
                    required
                    className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="email" className="block mb-2.5">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Enter your email address"
                    required
                    autoComplete="email"
                    className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                  />
                </div>

                <PasswordInput
                  id="password"
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  isRequired={true}
                />

                <PasswordInput
                  id="re-type-password"
                  name="re-type-password"
                  label="Re-type Password"
                  placeholder="Re-type your password"
                  isRequired={true}
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

                <button
                  type="submit"
                  className="w-full flex justify-center font-medium text-white bg-dark py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue mt-7.5"
                >
                  Create Account
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
