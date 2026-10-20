/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/profile/friends', destination: '/friends', permanent: false },
    ];
  },

};

export default nextConfig;
