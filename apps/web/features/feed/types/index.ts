// 瀑布流数据项接口
export interface WaterfallItem {
  id: string | number;
  image: string; // 图片 URL
  width: number; // 图片原始宽度
  height: number; // 图片原始高度
  text: string;
  blurDataURL?: string; // 模糊占位符 URL（可选）
  [key: string]: unknown; // 允许其他自定义字段
}

// 卡片位置信息
export interface CardPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  columnIndex: number;
}

// 瀑布流组件 Props
export interface XiaohongshuWaterfallProps {
  items: WaterfallItem[];
  columnGap?: number; // 列间距，默认 16
  rowGap?: number; // 行间距，默认 16
  columns?: number; // 固定列数，如果不提供则自动计算
  onLoadMore?: () => void; // 触底加载更多回调
  loading?: boolean; // 是否正在加载
  onItemClick?: (item: WaterfallItem) => void; // 点击卡片回调
  className?: string; // 容器类名
}

// 布局配置
export interface LayoutConfig {
  columnGap: number;
  rowGap: number;
  columns: number;
  containerWidth: number;
  columnWidth: number;
}
