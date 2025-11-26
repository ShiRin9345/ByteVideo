// 全局类型声明

declare global {
  interface Window {
    OSS?: any;
    AliyunUpload?: {
      Vod: new (options: any) => any;
      [key: string]: any;
    };
  }
}

export {};
