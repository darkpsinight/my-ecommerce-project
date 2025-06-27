import { Metadata } from "next";
import ReviewPageClient from "./ReviewPageClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Leave a Review - Share Your Purchase Experience | Digital Codes Marketplace",
    description: "Leave a review for your recent digital code purchase. Share your experience to help other buyers make informed decisions in our secure marketplace.",
    keywords: "leave review, purchase feedback, digital codes review, marketplace review, customer experience",
    openGraph: {
      title: "Leave a Review - Share Your Experience", 
      description: "Leave a review for your recent digital code purchase and help other buyers.",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: "Leave a Review - Share Your Experience",
      description: "Leave a review for your recent digital code purchase.",
    },
    robots: {
      index: false, // Don't index review pages for privacy
      follow: true,
    },
  };
}

const ReviewPage = () => {
  return <ReviewPageClient />;
};

export default ReviewPage;