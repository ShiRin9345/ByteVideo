// 全局类型声明

declare global {
  interface Window {
    OSS?: new (config: {
      bucket: string;
      region: string;
      accessKeyId: string;
      accessKeySecret: string;
      stsToken: string;
    }) => {
      put: (
        fileName: string,
        file: File,
        options?: {
          progress?: (progress: number) => void;
        },
      ) => Promise<{ url?: string }>;
    };
    AliyunUpload?: {
      Vod: new (options: any) => any;
      [key: string]: any;
    };
  }
}

export {};
