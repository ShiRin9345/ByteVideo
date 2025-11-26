// Components
export { DanmakuInput } from "./components/DanmakuInput";

// Hooks
export { useDanmaku } from "./hooks/useDanmaku";
export { useDanmakuData } from "./hooks/useDanmakuData";
export { useDanmakuEngine } from "./hooks/useDanmakuEngine";
export { useSocketConnection } from "./hooks/useSocketConnection";

// Lib
export {
  COLOR_POOL,
  VIDEO_DURATION_SECONDS,
  TOTAL_MINUTES,
  fetchDanmakuChunk,
  type SeedDanmaku,
} from "./lib/danmakuSeed";
