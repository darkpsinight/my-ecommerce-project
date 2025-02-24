"use client";
import { FacebookIcon, GoogleIcon, XIcon } from "@/components/Common/Icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import PasswordInput from "../PasswordInput";
import SuccessAlert from "@/components/Common/SuccessAlert";
import { useSearchParams } from 'next/navigation';

const Signin = () => {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setShowSuccessAlert(true);
      // Auto-hide the success message after 5 seconds
      // const timer = setTimeout(() => setShowSuccessAlert(false), 5000);
      // return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      // TODO: Implement actual signin logic here
      console.log('Form submitted:', formData);
    } catch (err) {
      setError(err.message || 'An error occurred during sign in');
    }
  };

  return (
    
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
            <div className="text-center mb-11">
              <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
                Log Into CodeSale
              </h2>
            </div>

            {showSuccessAlert && (
              <SuccessAlert 
                message="Registration successful!" 
                subMessage="Please check your email to verify your account. Don't forget to check your Spam folder."
              />
            )}

            <div>
              <form onSubmit={handleSubmit}>
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
                    className="rounded-lg border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                  />
                </div>

                <PasswordInput
                  id="password"
                  name="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  isRequired
                  showStrengthIndicator={false}
                />

                {error && (
                  <div className="text-red text-sm mt-2 mb-4">
                    {error}
                  </div>
                )}

                <p className="text-dark-4 text-sm mt-4 mb-6">
                  By continuing, you agree to CodeSale&apos;s{" "}
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
                  Log In
                </button>

                <a
                  href="#"
                  className="block text-center text-dark-4 mt-4.5 ease-out duration-200 hover:text-dark"
                >
                  Forgot Password?
                </a>

                <span className="relative z-1 block font-medium text-center mt-4.5">
                  <span className="block absolute -z-1 left-0 top-1/2 h-px w-full bg-gray-3"></span>
                  <span className="inline-block px-3 bg-white">OR</span>
                </span>

                <div className="flex flex-col gap-4.5 mt-7.5">
                  <button className="flex justify-center items-center gap-3.5 rounded-lg border border-gray-3 bg-gray-1 p-3 ease-out duration-200 hover:bg-gray-2">
                    <GoogleIcon />
                    Sign In with Google
                  </button>

                  <button className="flex justify-center items-center gap-3.5 rounded-lg border border-gray-3 bg-gray-1 p-3 ease-out duration-200 hover:bg-gray-2">
                    <FacebookIcon />
                    Sign In with Facebook
                  </button>

                  <button className="flex justify-center items-center gap-3.5 rounded-lg border border-gray-3 bg-gray-1 p-3 ease-out duration-200 hover:bg-gray-2">
                    <XIcon />
                    Sign In with X
                  </button>
                </div>

                <p className="text-center mt-6">
                  New to CodeSale?
                  <Link
                    href="/signup"
                    className="text-dark ease-out duration-200 hover:text-blue pl-2"
                  >
                    Create new account
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    
  );
};

export default Signin;
