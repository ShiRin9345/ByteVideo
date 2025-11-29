import { OSSCredentials } from "../types";

/**
 * 判断临时凭证是否到期
 * @param credentials STS 凭证
 * @returns 如果凭证过期或不存在返回 true，否则返回 false
 */
export function isCredentialsExpired(
  credentials: OSSCredentials | null,
): boolean {
  if (!credentials) {
    return true;
  }
  const expireDate = new Date(credentials.Expiration);
  const now = new Date();
  // 如果有效期不足一分钟，视为过期
  return expireDate.getTime() - now.getTime() <= 60000;
}
