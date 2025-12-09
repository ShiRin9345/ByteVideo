/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/db"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flowbite.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "http",
        hostname: "shirin-123.oss-cn-beijing.aliyuncs.com",
      },
    ],
  },
};

export default nextConfig;
