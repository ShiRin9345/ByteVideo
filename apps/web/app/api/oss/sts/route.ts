import { NextResponse } from "next/server";
import { STS } from "ali-oss";

export async function GET() {
  try {
    // 验证必需的环境变量
    const {
      ALIBABA_CLOUD_ACCESS_KEY_ID,
      ALIBABA_CLOUD_ACCESS_KEY_SECRET,
      ALI_OSS_ARN,
    } = process.env;

    if (
      !ALIBABA_CLOUD_ACCESS_KEY_ID ||
      !ALIBABA_CLOUD_ACCESS_KEY_SECRET ||
      !ALI_OSS_ARN
    ) {
      console.error("Missing required OSS environment variables");
      return NextResponse.json({ error: "OSS配置错误" }, { status: 500 });
    }

    const sts = new STS({
      accessKeyId: ALIBABA_CLOUD_ACCESS_KEY_ID,
      accessKeySecret: ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    });

    const result = await sts.assumeRole(
      ALI_OSS_ARN,
      "",
      3000, // Token有效期3000秒
      "teset",
    );

    return NextResponse.json({
      AccessKeyId: result.credentials.AccessKeyId,
      AccessKeySecret: result.credentials.AccessKeySecret,
      SecurityToken: result.credentials.SecurityToken,
      Expiration: result.credentials.Expiration,
    });
  } catch (err) {
    console.error("STS Token获取失败:", err);
    return NextResponse.json(
      {
        error: "无法获取上传凭证",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
