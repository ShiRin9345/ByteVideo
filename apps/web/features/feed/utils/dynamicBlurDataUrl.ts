/**
 * 动态生成 blurDataURL 用于 Next.js Image 组件的占位符
 */

/**
 * 获取基础 URL
 */
function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // 客户端：使用当前页面的 origin
    return window.location.origin;
  }
  // 服务器端：优先使用环境变量，否则使用默认值
  return process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000";
}

/**
 * 为动态图片生成模糊占位符
 * @param url 图片 URL
 * @returns Promise<string> base64 编码的 SVG 模糊占位符
 */
export async function dynamicBlurDataUrl(url: string): Promise<string> {
  try {
    const baseUrl = getBaseUrl();
    // 使用 Next.js Image Optimization API 获取小尺寸图片
    const imageUrl = `${baseUrl}/_next/image?url=${encodeURIComponent(
      url,
    )}&w=16&q=75`;

    const res = await fetch(imageUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.statusText}`);
    }

    // 将响应转换为 base64
    const arrayBuffer = await res.arrayBuffer();
    const base64str =
      typeof window === "undefined"
        ? Buffer.from(arrayBuffer).toString("base64")
        : btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // 创建 SVG 模糊占位符
    const blurSvg = `
      <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 5'>
        <filter id='b' color-interpolation-filters='sRGB'>
          <feGaussianBlur stdDeviation='1' />
        </filter>
        <image preserveAspectRatio='none' filter='url(#b)' x='0' y='0' height='100%' width='100%' 
        href='data:image/avif;base64,${base64str}' />
      </svg>
    `;

    // 转换为 base64
    const toBase64 = (str: string): string => {
      if (typeof window === "undefined") {
        return Buffer.from(str).toString("base64");
      }
      return window.btoa(str);
    };

    return `data:image/svg+xml;base64,${toBase64(blurSvg)}`;
  } catch (error) {
    console.warn("Failed to generate blurDataURL:", error);
    // 返回一个简单的灰色占位符作为降级方案
    return "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
  }
}
