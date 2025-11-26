import Credential from "@alicloud/credentials";
import OpenApi, * as $OpenApi from "@alicloud/openapi-client";
import vod20170321, * as $vod20170321 from "@alicloud/vod20170321";

export function createClient() {
  const credential = new Credential();
  const config = new $OpenApi.Config({
    credential: credential,
  });
  config.endpoint = `vod.cn-beijing.aliyuncs.com`;
  return new vod20170321(config);
}
