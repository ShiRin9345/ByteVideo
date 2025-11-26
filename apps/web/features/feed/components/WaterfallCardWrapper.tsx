"use client";

import { useRef, useEffect, useMemo } from "react";
import { WaterfallCard } from "./WaterfallItem";
import type { WaterfallItem, CardPosition } from "@/features/feed/types";

interface WaterfallCardWrapperProps {
  item: WaterfallItem;
  position: CardPosition;
  index: number;
  observeItemHeight: (index: number, element: HTMLElement | null) => void;
  onItemClick: (item: WaterfallItem) => void;
}

export function WaterfallCardWrapper({
  item,
  position,
  index,
  observeItemHeight,
  onItemClick,
}: WaterfallCardWrapperProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      observeItemHeight(index, cardRef.current);
    }
  }, [index, observeItemHeight]);

  const cardStyle = useMemo(
    () => ({
      position: "absolute" as const,
      left: 0,
      top: 0,
      width: `${position.width}px`,
      transform: `translate3d(${position.left}px, ${position.top}px, 0)`,
      transition: "transform 0.2s ease-out",
      willChange: "transform",
    }),
    [position.left, position.top, position.width],
  );

  return (
    <div ref={cardRef} style={cardStyle}>
      <WaterfallCard
        item={item}
        width={position.width}
        onClick={onItemClick || (() => {})}
      />
    </div>
  );
}
