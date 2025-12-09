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
        protocol: "https",
        hostname: "shirin-123.oss-cn-beijing.aliyuncs.com",
      },
      {
        protocol: "http",
        hostname: "shirin-123.oss-cn-beijing.aliyuncs.com",
      },
      // 支持 OSS 生成的 URL 格式（bucket.region.aliyuncs.com，不带 oss- 前缀）
      {
        protocol: "https",
        hostname: "shirin-123.cn-beijing.aliyuncs.com",
      },
      {
        protocol: "http",
        hostname: "shirin-123.cn-beijing.aliyuncs.com",
      },
    ],
  },
};

export default nextConfig;
