"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  generateAllVideosData,
  generateSingleVideoData,
  generateVideoList,
} from "@/features/ai";

// 格式化日期显示
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

// 图表配置
const chartConfig = {
  views: {
    label: "播放量",
    color: "var(--chart-1)",
  },
  clicks: {
    label: "点击量",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export default function Dashboard() {
  const [selectedVideoId, setSelectedVideoId] = useState<string>("video-001");
  const videoList = generateVideoList();
  const allVideosData = useMemo(() => generateAllVideosData(30), []);
  const singleVideoData = useMemo(
    () => generateSingleVideoData(selectedVideoId, 30),
    [selectedVideoId],
  );

  // 计算全部视频的统计数据
  const allVideosStats = useMemo(() => {
    const totalViews = allVideosData.reduce((sum, item) => sum + item.views, 0);
    const totalClicks = allVideosData.reduce(
      (sum, item) => sum + item.clicks,
      0,
    );
    const avgViews = Math.floor(totalViews / allVideosData.length);
    const avgClicks = Math.floor(totalClicks / allVideosData.length);
    return { totalViews, totalClicks, avgViews, avgClicks };
  }, [allVideosData]);

  // 计算单个视频的统计数据
  const singleVideoStats = useMemo(() => {
    const selectedVideo = videoList.find((v) => v.id === selectedVideoId);
    const totalViews = singleVideoData.reduce(
      (sum, item) => sum + item.views,
      0,
    );
    const totalClicks = singleVideoData.reduce(
      (sum, item) => sum + item.clicks,
      0,
    );
    const avgViews = Math.floor(totalViews / singleVideoData.length);
    const avgClicks = Math.floor(totalClicks / singleVideoData.length);
    return {
      title: selectedVideo?.title || "",
      totalViews,
      totalClicks,
      avgViews,
      avgClicks,
    };
  }, [singleVideoData, selectedVideoId, videoList]);

  return (
    <div className="bg-background h-full p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              数据可视化看板
            </h1>
            <p className="text-muted-foreground mt-2">
              短视频播放和点击数据的时间维度可视化展示
            </p>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/create"
              className="text-primary text-sm hover:underline"
            >
              AIGC创作 →
            </Link>
            <Link
              href="/explore"
              className="text-primary text-sm hover:underline"
            >
              视频探索 →
            </Link>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">全部视频</TabsTrigger>
            <TabsTrigger value="single">单个视频</TabsTrigger>
          </TabsList>

          {/* 全部视频视图 */}
          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>总播放量</CardDescription>
                  <CardTitle className="text-2xl">
                    {allVideosStats.totalViews.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>总点击量</CardDescription>
                  <CardTitle className="text-2xl">
                    {allVideosStats.totalClicks.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>平均播放量</CardDescription>
                  <CardTitle className="text-2xl">
                    {allVideosStats.avgViews.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>平均点击量</CardDescription>
                  <CardTitle className="text-2xl">
                    {allVideosStats.avgClicks.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>全部视频数据趋势</CardTitle>
                <CardDescription>最近30天的播放量和点击量趋势</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <LineChart
                    accessibilityLayer
                    data={allVideosData}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 12,
                      bottom: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={formatDate}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        if (value >= 10000)
                          return `${(value / 10000).toFixed(1)}万`;
                        return value.toString();
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Line
                      dataKey="views"
                      type="natural"
                      stroke="var(--color-views)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey="clicks"
                      type="natural"
                      stroke="var(--color-clicks)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="single" className="space-y-6">
            <div className="flex items-center gap-4">
              <Select
                value={selectedVideoId}
                onValueChange={setSelectedVideoId}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="选择视频" />
                </SelectTrigger>
                <SelectContent>
                  {videoList.map((video) => (
                    <SelectItem key={video.id} value={video.id}>
                      {video.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>视频标题</CardDescription>
                  <CardTitle className="text-lg">
                    {singleVideoStats.title}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>总播放量</CardDescription>
                  <CardTitle className="text-2xl">
                    {singleVideoStats.totalViews.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>总点击量</CardDescription>
                  <CardTitle className="text-2xl">
                    {singleVideoStats.totalClicks.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>平均播放量</CardDescription>
                  <CardTitle className="text-2xl">
                    {singleVideoStats.avgViews.toLocaleString()}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>单个视频数据趋势</CardTitle>
                <CardDescription>
                  {singleVideoStats.title} - 最近30天的播放量和点击量趋势
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <LineChart
                    accessibilityLayer
                    data={singleVideoData}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 12,
                      bottom: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={formatDate}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => {
                        if (value >= 10000)
                          return `${(value / 10000).toFixed(1)}万`;
                        return value.toString();
                      }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Line
                      dataKey="views"
                      type="natural"
                      stroke="var(--color-views)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      dataKey="clicks"
                      type="natural"
                      stroke="var(--color-clicks)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
