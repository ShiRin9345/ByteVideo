"use client";

import { useRef, useMemo } from "react";
import { WaterfallCard } from "./WaterfallItem";
import type { WaterfallItem, CardPosition } from "@/features/feed/types";

interface WaterfallCardWrapperProps {
  item: WaterfallItem;
  position: CardPosition;
}

export function WaterfallCardWrapper({
  item,
  position,
}: WaterfallCardWrapperProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const cardStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: 0,
      top: 0,
      width: `${position.width}px`,
      willChange: "transform",
      transform: `translate3d(${position.left}px, ${position.top}px, 0)`,
      transition: "transform 0.2s ease-out",
    }),
    [position.left, position.top, position.width],
  );

  return (
    <div ref={cardRef} style={cardStyle}>
      <WaterfallCard item={item} width={position.width} />
    </div>
  );
}
