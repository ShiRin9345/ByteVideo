import { memo, useState, useMemo } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import type { WaterfallItem } from "@/features/feed/types";
import { generateUserData } from "@/features/feed/utils/generateUserData";

interface WaterfallCardProps {
  item: WaterfallItem;
  width: number;
  onClick: (item: WaterfallItem) => void;
}

export const WaterfallCard = memo<WaterfallCardProps>(
  ({ item, width, onClick }) => {
    const imageHeight = (width * item.height) / item.width;
    const [imageLoaded, setImageLoaded] = useState(false);

    const userData = useMemo(() => generateUserData(item.id), [item.id]);

    return (
      <div
        className="waterfall-card bg-card text-card-foreground cursor-pointer overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-md"
        onClick={() => onClick(item)}
      >
        <div
          className="skeleton-loading relative w-full"
          style={{
            height: `${imageHeight}px`,
            contain: "layout style paint",
          }}
        >
          <Image
            src={item.image}
            alt={item.text || ""}
            width={item.width}
            height={item.height}
            placeholder={item.blurDataURL ? "blur" : "empty"}
            blurDataURL={item.blurDataURL}
            className={`image-fade-in h-full w-full object-cover ${
              imageLoaded ? "image-loaded" : ""
            }`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
          />
        </div>

        {/* 文本内容 */}
        <p className="text-card-foreground line-clamp-3 px-3 pt-3 pb-2 text-sm">
          {item.text}
        </p>

        {/* 用户信息 */}
        <section className="flex items-center gap-2 px-3 pb-3">
          {/* 用户头像 */}
          <div
            className="h-6 w-6 flex-shrink-0 rounded-full"
            style={{ backgroundColor: userData.avatarColor }}
          />

          {/* 用户名 */}
          <span className="text-muted-foreground flex-1 truncate text-xs">
            {userData.userName}
          </span>

          {/* 点赞数 */}
          <div className="flex flex-shrink-0 items-center gap-1">
            <Heart className="text-muted-foreground fill-muted-foreground h-3.5 w-3.5" />
            <span className="text-muted-foreground text-xs">
              {userData.likes}
            </span>
          </div>
        </section>
      </div>
    );
  },
);

WaterfallCard.displayName = "WaterfallCard";
