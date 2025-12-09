import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
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
    coverWidth: integer("cover_width"), // 封面图宽度
    coverHeight: integer("cover_height"), // 封面图高度
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
