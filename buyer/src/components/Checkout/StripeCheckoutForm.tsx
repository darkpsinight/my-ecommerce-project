"use client";
import React, { useState } from "react";
import {
    useStripe,
    useElements,
    PaymentElement,
} from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ordersApi } from "@/services/orders";

interface StripeCheckoutFormProps {
    clientSecrets: string[];
    checkoutGroupId: string;
    orderIds: string[];
}

const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
    clientSecrets,
    checkoutGroupId,
    orderIds,
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        const succeededPaymentIds: string[] = [];

        try {
            // 1. Confirm the first payment intent
            const firstSecret = clientSecrets[0];
            const { error: firstError, paymentIntent: firstPaymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/order-success`,
                },
                redirect: 'if_required',
            });

            if (firstError) {
                setErrorMessage(firstError.message ?? "Payment failed");
                setIsProcessing(false);
                return;
            }

            if (firstPaymentIntent && firstPaymentIntent.status === "succeeded") {
                console.log("First payment succeeded!", firstPaymentIntent.id);
                succeededPaymentIds.push(firstPaymentIntent.id);

                // Verify Immediately
                await ordersApi.confirmPayment(firstPaymentIntent.id);

                // 2. Reuse the PaymentMethod for subsequent intents
                // Only if there are more payments
                if (clientSecrets.length > 1) {
                    const paymentMethodId = firstPaymentIntent.payment_method as string;

                    // Iterate through the rest
                    for (let i = 1; i < clientSecrets.length; i++) {
                        const secret = clientSecrets[i];
                        console.log(`Processing payment ${i + 1}/${clientSecrets.length}`);

                        const { error: nextError, paymentIntent: nextPaymentIntent } = await stripe.confirmCardPayment(secret, {
                            payment_method: paymentMethodId,
                        });

                        if (nextError) {
                            throw new Error(`Payment ${i + 1} failed: ${nextError.message}`);
                        }

                        if (nextPaymentIntent?.status === "succeeded") {
                            console.log(`Payment ${i + 1} succeeded!`);
                            succeededPaymentIds.push(nextPaymentIntent.id);
                            // Verify Immediately
                            await ordersApi.confirmPayment(nextPaymentIntent.id);
                        } else {
                            throw new Error(`Payment ${i + 1} status: ${nextPaymentIntent?.status}`);
                        }
                    }
                }

                // 3. All succeeded
                toast.success("All payments successful!");
                router.push(`/order-success?orderId=${orderIds[0]}`);
            }
        } catch (err: any) {
            console.error("Checkout Loop Error:", err);
            setErrorMessage(err.message || "An error occurred during checkout.");
            toast.error("Payment sequence failed. Please contact support.");

            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4">
            <PaymentElement />
            {errorMessage && (
                <div className="text-red-500 text-sm mt-4">{errorMessage}</div>
            )}
            <button
                disabled={!stripe || isProcessing}
                className="w-full mt-6 bg-blue text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? "Processing..." : "Pay Now"}
            </button>
        </form>
    );
};

export default StripeCheckoutForm;
