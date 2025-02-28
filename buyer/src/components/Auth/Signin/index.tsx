"use client";
import { FacebookIcon, GoogleIcon, XIcon } from "@/components/Common/Icons";
import Link from "next/link";
import React from "react";
import PasswordInput from "../PasswordInput";
import SuccessAlert from "@/components/Common/SuccessAlert";
import { useSearchParams } from "next/navigation";
import { useSignin } from "@/hooks/useSignin";
import { Spinner } from "@/components/Common/Spinner/index";
import ErrorAlert from "@/components/Common/ErrorAlert";
import { useRouter } from "next/navigation";

interface SigninProps {
  appName: string;
}

const Signin = ({ appName }: SigninProps) => {
  const searchParams = useSearchParams();
  const {
    formData,
    loading,
    emailError,
    passwordError,
    apiError,
    handleChange,
    handleSubmit,
  } = useSignin();
  const showSuccessAlert = searchParams.get("registered") === "true";
  const router = useRouter();

  const handleGoogleLogin = () => {
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    const params = {
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'email profile openid',
    };
    Object.entries(params).forEach(([key, value]) => 
      googleAuthUrl.searchParams.append(key, value as string)
    );
    window.location.href = googleAuthUrl.toString();
  };

  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="max-w-[570px] w-full mx-auto rounded-xl bg-white shadow-1 p-4 sm:p-7.5 xl:p-11">
          <div className="text-center mb-11">
            <h2 className="font-semibold text-xl sm:text-2xl xl:text-heading-5 text-dark mb-1.5">
              Log Into {appName}
            </h2>
          </div>

          {showSuccessAlert && (
            <SuccessAlert
              message="Registration successful!"
              subMessage="Please check your email to verify your account. Don't forget to check your Spam folder."
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

              <PasswordInput
                id="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                isRequired
                error={passwordError}
                showStrengthIndicator={false}
              />

              {apiError && (
                <ErrorAlert
                  message={apiError.message}
                  hint={apiError.hint}
                  links={apiError.links}
                />
              )}

              <p className="text-dark-4 text-sm mt-4 mb-6">
                By continuing, you agree to {appName}&apos;s{" "}
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
                disabled={loading}
                className="w-full flex justify-center items-center font-medium text-white bg-dark py-3 px-6 rounded-lg ease-out duration-200 hover:bg-blue mt-7.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Spinner className="w-5 h-5 mr-2" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <Link
                href="/forgot-password"
                className="block text-center text-dark-4 mt-4.5 ease-out duration-200 hover:text-dark"
              >
                Forgot Password?
              </Link>

              <span className="relative z-1 block font-medium text-center mt-4.5">
                <span className="block absolute -z-1 left-0 top-1/2 h-px w-full bg-gray-3"></span>
                <span className="inline-block px-3 bg-white">OR</span>
              </span>

              <div className="flex flex-col gap-4.5 mt-7.5">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex justify-start items-center gap-3.5 rounded-lg border border-gray-3 bg-gray-1 p-3 ease-out duration-200 hover:bg-gray-2 relative"
                >
                  <GoogleIcon />
                  <span className="flex-grow text-center">Sign In with Google</span>
                </button>

                <button
                  type="button"
                  className="flex justify-start items-center gap-3.5 rounded-lg border border-gray-3 bg-gray-1 p-3 ease-out duration-200 hover:bg-gray-2 relative"
                >
                  <FacebookIcon />
                  <span className="flex-grow text-center">Sign In with Facebook</span>
                </button>

                <button
                  type="button"
                  className="flex justify-start items-center gap-3.5 rounded-lg border border-gray-3 bg-gray-1 p-3 ease-out duration-200 hover:bg-gray-2 relative"
                >
                  <XIcon />
                  <span className="flex-grow text-center">Sign In with X</span>
                </button>
              </div>

              <p className="text-center mt-6">
                New to {appName}?{" "}
                <Link
                  href="/signup"
                  className="text-dark ease-out duration-200 hover:text-blue"
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
