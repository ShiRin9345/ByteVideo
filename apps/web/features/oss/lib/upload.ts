import {
  OSSCredentials,
  OSSConfig,
  UploadFileType,
  UploadProgressCallback,
} from "../types";
import { getSTSCredentials } from "./sts";
import { isCredentialsExpired } from "../utils/credentials";

/**
 * 上传文件到 OSS
 * @param file 要上传的文件
 * @param type 文件类型（video 或 cover）
 * @param config OSS 配置（bucket 和 region）
 * @param credentials 当前 STS 凭证（如果提供，会检查是否过期）
 * @param onCredentialsUpdate 凭证更新回调（用于更新状态）
 * @param onProgress 上传进度回调
 * @returns 上传成功后的文件 URL
 */
export async function uploadFileToOSS(
  file: File,
  type: UploadFileType,
  config: OSSConfig,
  credentials: OSSCredentials | null,
  onCredentialsUpdate?: (credentials: OSSCredentials) => void,
  onProgress?: UploadProgressCallback,
): Promise<string> {
  // 临时凭证过期时，才重新获取，减少对STS服务的调用
  let currentCredentials = credentials;
  if (isCredentialsExpired(currentCredentials)) {
    currentCredentials = await getSTSCredentials();
    if (onCredentialsUpdate) {
      onCredentialsUpdate(currentCredentials);
    }
  }

  if (!currentCredentials) {
    throw new Error("无法获取有效的 STS 凭证");
  }

  if (!window.OSS) {
    throw new Error("OSS SDK 尚未加载");
  }

  const client = new window.OSS({
    bucket: config.bucket,
    region: config.region,
    accessKeyId: currentCredentials.AccessKeyId,
    accessKeySecret: currentCredentials.AccessKeySecret,
    stsToken: currentCredentials.SecurityToken,
  });

  // 生成文件路径（添加时间戳避免重名）
  const timestamp = Date.now();
  const fileName = `${type}/${timestamp}_${file.name}`;

  // 上传文件，支持进度回调
  return new Promise((resolve, reject) => {
    client
      .put(fileName, file, {
        progress: (p: number) => {
          const progress = Math.ceil(p * 100);
          if (onProgress) {
            onProgress(progress);
          }
        },
      })
      .then((result: { url?: string }) => {
        const url =
          result.url ||
          `https://${config.bucket}.${config.region.replace("oss-", "")}.aliyuncs.com/${fileName}`;
        resolve(url);
      })
      .catch(reject);
  });
}
