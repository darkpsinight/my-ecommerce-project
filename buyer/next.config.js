/** @type {import('next').NextConfig} */

// Default image domains
const imageDomains = [
  'example.com',
  'localhost',
  'images.unsplash.com',
  'via.placeholder.com',
  'picsum.photos',
  'cloudinary.com',
  'res.cloudinary.com',
  'placehold.co',
  'placeholdit.imgix.net',
  'placeholder.com',
  'ik.imagekit.io'
];

// Add any domains from environment variables
if (process.env.NEXT_PUBLIC_IMAGE_DOMAINS) {
  const envDomains = process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(',').map(domain => domain.trim());
  imageDomains.push(...envDomains);
}

const nextConfig = {
  images: {
    domains: imageDomains,
  },
};

module.exports = nextConfig;
