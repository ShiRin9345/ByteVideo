export function generateUserData(id: string | number) {
  const seed = typeof id === "string" ? id.charCodeAt(0) : id;

  // 用户名列表
  const userNames = [
    "小红书用户",
    "生活分享家",
    "美食探索者",
    "时尚达人",
    "旅行日记",
    "摄影爱好者",
    "日常记录",
    "好物推荐",
    "生活小技巧",
    "分享日常",
    "美好生活",
    "记录生活",
  ];

  // 头像颜色列表
  const avatarColors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#F8B739",
    "#E74C3C",
    "#3498DB",
    "#2ECC71",
    "#9B59B6",
    "#E67E22",
    "#1ABC9C",
  ];

  const nameIndex = seed % userNames.length;
  const colorIndex = seed % avatarColors.length;

  // 生成点赞数（100-9999之间）
  const likes = 100 + (seed % 9900);

  return {
    userName: (userNames[nameIndex] || "用户") + (seed % 1000),
    avatarColor: avatarColors[colorIndex] || "#FF6B6B",
    likes: likes,
  };
}
