/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // Keep the app preview available while its screens move into React.
      beforeFiles: [
        { source: '/app.html', destination: '/showup/app.html' },
      ],
    };
  },
};

export default nextConfig;
