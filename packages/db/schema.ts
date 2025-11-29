import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const refreshToken = pgTable(
  "refresh_token",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    revoked: boolean("revoked").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("refresh_token_user_id_idx").on(table.userId),
    index("refresh_token_expires_at_idx").on(table.expiresAt),
  ],
);

export const video = pgTable(
  "video",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(), // 视频名称
    theme: text("theme").array().notNull(), // 主题（用户自定义标签数组）
    description: text("description"), // 描述
    tags: text("tags").array(), // 标签数组
    videoId: text("video_id").notNull(), // 视频ID
    coverUrl: text("cover_url"), // 封面图URL
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }), // 作者ID
    views: integer("views").notNull().default(0), // 播放量
    likes: integer("likes").notNull().default(0), // 点赞数
    comments: integer("comments").notNull().default(0), // 评论数
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("video_user_id_idx").on(table.userId),
    index("video_theme_idx").on(table.theme),
  ],
);

// 评论表
export const commentTable = pgTable(
  "comment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => video.id, { onDelete: "cascade" }),
    content: text("content").notNull(), // 评论内容
    likes: integer("likes").notNull().default(0), // 评论点赞数
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("comment_user_id_idx").on(table.userId),
    index("comment_video_id_idx").on(table.videoId),
  ],
);

// 视频统计数据表（用于数据可视化）
export const videoStat = pgTable(
  "video_stat",
  {
    id: text("id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => video.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(), // 日期（按天统计）
    views: integer("views").notNull().default(0), // 当日播放量
    clicks: integer("clicks").notNull().default(0), // 当日点击数
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("video_stat_video_id_idx").on(table.videoId),
    index("video_stat_date_idx").on(table.date),
    // 唯一约束：确保每个视频每天只有一条统计记录
    unique("video_stat_video_id_date_unique").on(table.videoId, table.date),
  ],
);

// ==================== 关系定义 ====================

export const userRelations = relations(user, ({ many }) => ({
  videos: many(video),
  comments: many(commentTable),
  refreshTokens: many(refreshToken),
}));

export const refreshTokenRelations = relations(refreshToken, ({ one }) => ({
  user: one(user, {
    fields: [refreshToken.userId],
    references: [user.id],
  }),
}));

export const videoRelations = relations(video, ({ one, many }) => ({
  author: one(user, {
    fields: [video.userId],
    references: [user.id],
  }),
  comments: many(commentTable),
  stats: many(videoStat),
}));

export const commentRelations = relations(commentTable, ({ one }) => ({
  user: one(user, {
    fields: [commentTable.userId],
    references: [user.id],
  }),
  video: one(video, {
    fields: [commentTable.videoId],
    references: [video.id],
  }),
}));

export const videoStatRelations = relations(videoStat, ({ one }) => ({
  video: one(video, {
    fields: [videoStat.videoId],
    references: [video.id],
  }),
}));
