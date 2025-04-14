import { Feature, Stat, Testimonial } from './types';

export const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Alex Johnson",
    title: "Game Developer",
    avatar: "/static/images/avatars/1.jpg",
    content: "This platform revolutionized how I distribute my indie games. The analytics are comprehensive and the payment processing is seamless."
  },
  {
    id: 2,
    name: "Sarah Chen",
    title: "Software Entrepreneur",
    avatar: "/static/images/avatars/2.jpg",
    content: "After trying multiple platforms, this is the only one that offers the security and ease of use I needed for my digital products."
  }
];

export const stats: Stat[] = [
  { value: "0%", label: "Commission" },
  { value: "1,240+", label: "Products" },
  { value: "24/7", label: "Support" },
  { value: "128+", label: "Countries" }
];

export const features: Omit<Feature, 'icon'>[] = [
  {
    iconKey: 'marketplace',
    title: "Digital Marketplace",
    metric: "1,240+ Products",
    description: "List and manage your digital products with ease. Support for game keys, software licenses, and more."
  },
  {
    iconKey: 'security',
    title: "0% Commission",
    metric: "Always Free",
    description: "Sell your digital products without any commission fees. Keep 100% of your earnings with our platform."
  },
  {
    iconKey: 'analytics',
    title: "Advanced Analytics",
    metric: "30+ Metrics",
    description: "Track your performance with detailed analytics, sales reports, and customer insights."
  },
  {
    iconKey: 'support',
    title: "Priority Support",
    metric: "5 Min Response",
    description: "Our dedicated support team is always here to help you succeed with your digital business."
  }
]; 