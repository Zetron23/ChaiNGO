// next.config.mjs (or next.config.js)

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true, // Or your preferred setting
    images: {
      // Configure allowed remote image domains
      remotePatterns: [
        {
          protocol: 'https', // Protocol used by placehold.co
          hostname: 'placehold.co', // The hostname to allow
          port: '', // Default port (usually empty for https)
          pathname: '/**', // Allow any path on this hostname
        },
        {
          protocol: 'http', // Protocol for your local backend uploads
          hostname: 'localhost', // Allow images served from localhost
          port: '5000', // The port your backend runs on
          pathname: '/uploads/**', // Allow images specifically from the /uploads path
        },
        // Add other hostnames if needed, e.g., for your cloud storage later
      ],
    },
    // Add other Next.js configurations here if you have them
  };
  
  export default nextConfig; // Or module.exports = nextConfig; for .js files
  