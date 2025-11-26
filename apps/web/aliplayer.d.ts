declare module "aliyun-aliplayer" {
  interface AliplayerOptions {
    id: string;
    license?: {
      key: string;
      domain: string;
    };
    source?: string;
    vid?: string;
    playauth?: string;
    width?: string | number;
    height?: string | number;
    useH5Prism?: boolean;
    autoplay?: boolean;
    clickPause?: boolean;
    encryptType?: string;
    skinLayout?: any[];
    [key: string]: any;
  }

  class Aliplayer {
    constructor(
      options: AliplayerOptions,
      callback?: (player: Aliplayer) => void,
    );
    play(): void;
    pause(): void;
    getStatus(): string;
    getCurrentTime(): number;
    seek(time: number): void;
    dispose(): void;
    [key: string]: any;
  }

  export default Aliplayer;
}
