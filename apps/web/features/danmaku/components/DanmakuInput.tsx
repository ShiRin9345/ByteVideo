"use client";

import { useState, type KeyboardEvent } from "react";

interface DanmakuInputProps {
  isConnected: boolean;
  onSend: (text: string) => void;
}

export function DanmakuInput({ isConnected, onSend }: DanmakuInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSend = () => {
    if (!inputValue.trim() || !isConnected) return;
    onSend(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入弹幕内容..."
          className="flex-1 rounded-xl border border-zinc-200 px-4 py-3 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!isConnected || !inputValue.trim()}
          className="rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white shadow hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          发送弹幕
        </button>
      </div>
      <p className="text-sm text-zinc-500">
        服务状态：
        <span className={isConnected ? "text-green-500" : "text-red-500"}>
          {isConnected ? " 已连接" : " 未连接"}
        </span>
      </p>
    </div>
  );
}
