/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/profile/friends', destination: '/friends', permanent: false },
    ];
  },
  async rewrites() {
    return { beforeFiles: [{ source: '/app.html', destination: '/showup/app.html' }] };
  },
};

export default nextConfig;
