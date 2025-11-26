import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { user, refreshToken, video, commentTable, videoStat } from "./schema";

// User types
export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

// RefreshToken types
export type RefreshToken = InferSelectModel<typeof refreshToken>;
export type NewRefreshToken = InferInsertModel<typeof refreshToken>;

// Video types
export type Video = InferSelectModel<typeof video>;
export type NewVideo = InferInsertModel<typeof video>;

// Comment types
export type Comment = InferSelectModel<typeof commentTable>;
export type NewComment = InferInsertModel<typeof commentTable>;

// VideoStat types
export type VideoStat = InferSelectModel<typeof videoStat>;
export type NewVideoStat = InferInsertModel<typeof videoStat>;
