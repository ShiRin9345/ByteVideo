import { NextRequest, NextResponse } from "next/server";
import vod20170321, * as $vod20170321 from "@alicloud/vod20170321";
import Util, * as $Util from "@alicloud/tea-util";
import { createClient } from "../../../../../features/ai/lib/createClient";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json(
      { error: "Video ID is required" },
      { status: 400 },
    );
  }
  const client = createClient();
  const getVideoPlayAuth = new $vod20170321.GetVideoInfoRequest({
    videoId,
  });
  const runtime = new $Util.RuntimeOptions({});
  const res = await client.getPlayInfoWithOptions(getVideoPlayAuth, runtime);

  return NextResponse.json(res);
}
