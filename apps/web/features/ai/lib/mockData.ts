// 简单的种子随机数生成器（确保服务器和客户端生成相同的数据）
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// 生成日期范围
function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]!);
  }

  return dates;
}

// 生成随机数（带波动，使用种子确保一致性）
function randomValue(
  base: number,
  variance: number = 0.3,
  rng: SeededRandom,
): number {
  const min = base * (1 - variance);
  const max = base * (1 + variance);
  return Math.floor(rng.next() * (max - min) + min);
}

import type { VideoDataPoint, VideoInfo } from "../types";

// 生成全部视频的聚合数据（最近30天）
export function generateAllVideosData(days: number = 30): VideoDataPoint[] {
  const dates = generateDateRange(days);
  const baseViews = 50000; // 基础播放量
  const baseClicks = 5000; // 基础点击量
  // 使用固定种子确保服务器和客户端生成相同数据
  const rng = new SeededRandom(12345);

  return dates.map((date, index) => {
    // 添加一些趋势和波动
    const trend = Math.sin((index / days) * Math.PI * 2) * 0.2;
    const views = randomValue(baseViews * (1 + trend), 0.25, rng);
    const clicks = randomValue(baseClicks * (1 + trend), 0.3, rng);

    return {
      date,
      views,
      clicks,
    };
  });
}

// 生成单个视频的数据
export function generateSingleVideoData(
  videoId: string,
  days: number = 30,
): VideoDataPoint[] {
  const dates = generateDateRange(days);
  // 根据视频ID生成不同的基础值
  const seed = parseInt(videoId.replace(/\D/g, "")) || 1;
  const baseViews = 10000 + (seed % 5) * 5000;
  const baseClicks = 1000 + (seed % 5) * 500;
  // 使用视频ID作为种子的一部分，确保每个视频的数据是确定性的
  const rng = new SeededRandom(seed * 1000 + 54321);

  return dates.map((date, index) => {
    // 添加一些趋势和波动
    const trend = Math.sin((index / days) * Math.PI * 2 + seed) * 0.3;
    const views = randomValue(baseViews * (1 + trend), 0.3, rng);
    const clicks = randomValue(baseClicks * (1 + trend), 0.35, rng);

    return {
      date,
      views,
      clicks,
    };
  });
}

// 生成视频列表
export function generateVideoList(): VideoInfo[] {
  return [
    {
      id: "video-001",
      title: "春日樱花盛开时",
      totalViews: 125000,
      totalClicks: 12500,
    },
    {
      id: "video-002",
      title: "城市夜景延时摄影",
      totalViews: 98000,
      totalClicks: 9800,
    },
    {
      id: "video-003",
      title: "美食制作教程",
      totalViews: 156000,
      totalClicks: 15600,
    },
    {
      id: "video-004",
      title: "旅行vlog - 云南",
      totalViews: 89000,
      totalClicks: 8900,
    },
    {
      id: "video-005",
      title: "宠物日常",
      totalViews: 112000,
      totalClicks: 11200,
    },
  ];
}
