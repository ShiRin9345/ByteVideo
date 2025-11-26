import { NextRequest, NextResponse } from "next/server";
import * as $vod20170321 from "@alicloud/vod20170321";
import * as $Util from "@alicloud/tea-util";
import { createClient } from "../../../../../features/ai/lib/createClient";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title");
  const fileName = searchParams.get("fileName");
  const videoId = searchParams.get("videoId");

  if (!title || !fileName) {
    return NextResponse.json(
      { error: "Title and fileName are required" },
      { status: 400 },
    );
  }

  const client = createClient();
  const runtime = new $Util.RuntimeOptions({});

  if (videoId) {
    const refreshUploadVideoRequest =
      new $vod20170321.RefreshUploadVideoRequest({
        videoId,
      });
    const res = await client.refreshUploadVideoWithOptions(
      refreshUploadVideoRequest,
      runtime,
    );
    return NextResponse.json(res);
  }

  const createUploadVideoRequest = new $vod20170321.CreateUploadVideoRequest({
    title,
    fileName,
  });
  const res = await client.createUploadVideoWithOptions(
    createUploadVideoRequest,
    runtime,
  );
  return NextResponse.json(res);
}
