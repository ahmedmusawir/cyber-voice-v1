import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [ 
      {
        protocol: 'https', // Specify the protocol (e.g., 'https')
        hostname: 'res.cloudinary.com', // Your image domain
        // You can add pathname if you want to restrict to specific paths on Cloudinary
        // pathname: '/image/upload/**', // Example: only allow images from /image/upload/
      },
    ],
  },
};

export default nextConfig;