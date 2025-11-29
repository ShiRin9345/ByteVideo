import { OSSCredentials } from "../types";

/**
 * 获取 STS 临时凭证
 */
export async function getSTSCredentials(): Promise<OSSCredentials> {
  const response = await fetch("/api/oss/sts", {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `获取STS令牌失败: ${response.status} ${response.statusText}`,
    );
  }

  const credentials = await response.json();
  return credentials;
}
