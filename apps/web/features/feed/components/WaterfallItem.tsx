import { memo, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import type { WaterfallItem } from "@/features/feed/types";
import { generateUserData } from "@/features/feed/utils/generateUserData";
import { useAuth } from "@/features/auth";

interface WaterfallCardProps {
  item: WaterfallItem;
  width: number;
}

export const WaterfallCard = memo<WaterfallCardProps>(({ item, width }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const imageHeight = (width * item.height) / item.width;
  const [imageLoaded, setImageLoaded] = useState(false);

  // 优先使用真实的作者信息，如果没有则使用生成的假数据作为后备
  const author = item.author as
    | { id: string; name: string; username: string; image: string | null }
    | undefined;
  const fallbackUserData = useMemo(() => generateUserData(item.id), [item.id]);

  // 使用真实的作者信息或后备数据
  const userName =
    author?.name || author?.username || fallbackUserData.userName;
  const avatarColor = author?.image ? undefined : fallbackUserData.avatarColor;

  const handleClick = useCallback(() => {
    // 检查用户是否登录
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    router.push(`/explore/${item.id}`);
  }, [isAuthenticated, router, item.id]);

  return (
    <div
      className="waterfall-card bg-card text-card-foreground cursor-pointer overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-md"
      onClick={handleClick}
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
          placeholder="empty"
          className={`image-fade-in h-full w-full object-cover ${
            imageLoaded ? "image-loaded" : ""
          }`}
          priority
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      <section className="px-3 pt-3 pb-2">
        <p className="text-card-foreground line-clamp-2 text-sm break-all">
          {item.text}
        </p>
      </section>

      {/* 用户信息 */}
      <section className="flex items-center gap-2 px-3 pb-3">
        {/* 用户头像 */}
        {author?.image ? (
          <Image
            src={author.image}
            alt={userName}
            width={24}
            height={24}
            className="h-6 w-6 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className="h-6 w-6 flex-shrink-0 rounded-full"
            style={{ backgroundColor: avatarColor }}
          />
        )}

        {/* 用户名 */}
        <span className="text-muted-foreground flex-1 truncate text-xs">
          {userName}
        </span>

        {/* 点赞数 */}
        <div className="flex flex-shrink-0 items-center gap-1">
          <Heart className="text-muted-foreground fill-muted-foreground h-3.5 w-3.5" />
          <span className="text-muted-foreground text-xs">
            {typeof item.likes === "number"
              ? item.likes
              : fallbackUserData.likes}
          </span>
        </div>
      </section>
    </div>
  );
});

WaterfallCard.displayName = "WaterfallCard";
