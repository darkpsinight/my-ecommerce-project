"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import PageContainer from "../Common/PageContainer";
import { AUTH_API } from "@/config/api";

const ConfirmationStatus = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const token = searchParams.get("token");
  const success = searchParams.get("success") === "true";
  const error = searchParams.get("error");
  const message = searchParams.get("message");

  useEffect(() => {
    const confirmEmailWithToken = async () => {
      if (!token) return;

      setIsProcessing(true);
      try {
        const response = await fetch(
          `${AUTH_API.CONFIRM_EMAIL}?token=${token}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        // The backend will handle the redirect to success/error page
        // This is just a fallback in case the redirect doesn't happen
        if (!response.ok) {
          router.push(
            "/confirmation?success=false&error=Invalid Token&message=Failed to confirm email"
          );
        }
      } catch (error) {
        router.push(
          "/confirmation?success=false&error=Server Error&message=Failed to connect to server"
        );
      } finally {
        setIsProcessing(false);
      }
    };

    confirmEmailWithToken();
  }, [token, router]);

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);
    setResendError("");

    try {
      const response = await fetch(
        `${AUTH_API.CONFIRM_EMAIL}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!data.success) {
        if (data.message.includes("already confirmed")) {
          setResendError(
            "This email is already confirmed. Please try logging in."
          );
        } else if (data.message.includes("recently sent")) {
          setResendError(
            "A confirmation email was recently sent. Please check your Spam/Promotions folder and try again later."
          );
        } else {
          setResendError(data.message || "Failed to resend confirmation email");
        }
      } else {
        alert("Confirmation email has been sent! Please check your inbox.");
        setEmail("");
      }
    } catch (error) {
      setResendError(
        "Failed to connect to the server. Please try again later."
      );
    } finally {
      setIsResending(false);
    }
  };

  if (isProcessing) {
    return (
      <PageContainer>
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="bg-white rounded-xl shadow-1 px-4 py-10 sm:py-15 lg:py-20 xl:py-25">
              <div className="text-center">
                <h2 className="font-bold text-blue text-4xl lg:text-[45px] lg:leading-[57px] mb-5">
                  Processing...
                </h2>
                <p className="max-w-[491px] w-full mx-auto mb-7.5">
                  Please wait while we confirm your email address.
                </p>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  return (
    <section className="overflow-hidden py-20 bg-gray-2">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        <div className="bg-white rounded-xl shadow-1 px-4 py-10 sm:py-15 lg:py-20 xl:py-25">
          <div className="text-center">
            {success ? (
              <>
                <h2 className="font-bold text-blue text-4xl lg:text-[45px] lg:leading-[57px] mb-5">
                  Email Confirmed Successfully!
                </h2>
                <h3 className="font-medium text-dark text-xl sm:text-2xl mb-3">
                  Your email has been verified
                </h3>
                <p className="max-w-[491px] w-full mx-auto mb-7.5">
                  Thank you for confirming your email address. You can now
                  access all features of your account.
                </p>
              </>
            ) : (
              <>
                <h2 className="font-bold text-red-600 text-4xl lg:text-[45px] lg:leading-[57px] mb-5">
                  Email Confirmation Failed
                </h2>
                <h3 className="font-medium text-dark text-xl sm:text-2xl mb-3">
                  {error ||
                    "We couldn’t verify your email address. This may be because the confirmation link has expired, is invalid, or has already been used."}
                </h3>
                <p className="max-w-[600px] w-full mx-auto mb-7.5">
                  {message ||
                    "Please enter your email address below to receive a new confirmation link."}
                </p>

                <form
                  onSubmit={handleResendConfirmation}
                  className="max-w-[400px] mx-auto mb-3.5"
                >
                  <div className="mb-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className={`rounded-lg border ${
                        resendError ? "border-red" : "border-gray-3"
                      } bg-gray-1 placeholder:text-dark-5 w-full py-3 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20`}
                      required
                    />
                  </div>
                  {resendError && (
                    <div className="mb-4 text-red-600 text-sm">
                      {resendError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full bg-blue text-white py-2 px-4 rounded-md hover:bg-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending ? "Sending..." : "Resend Confirmation Email"}
                  </button>
                </form>
                <span className="relative z-1 block font-medium text-center">
                  <span className="block absolute -z-1 left-0 top-1/2 h-px w-full bg-gray-3"></span>
                  <span className="inline-block px-3 bg-white">OR</span>
                </span>
              </>
            )}

            <Link
              href="/signin"
              className="inline-flex items-center gap-2 font-medium text-white bg-blue py-3 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark mt-3.5"
            >
              Log In to Your Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConfirmationStatus;
