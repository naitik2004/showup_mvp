/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      // Serve the original document directly so global React styles and layout
      // cannot change the reference's appearance or hash-based navigation.
      beforeFiles: [
        { source: '/', destination: '/showup/index.html' },
        { source: '/app.html', destination: '/showup/app.html' },
      ],
    };
  },
};

export default nextConfig;
