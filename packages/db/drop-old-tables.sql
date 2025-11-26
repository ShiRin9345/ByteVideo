-- 删除 better-auth 相关的旧表（如果存在）
-- 注意：执行前请备份数据库

-- 删除外键约束（如果存在）
ALTER TABLE IF EXISTS "session" DROP CONSTRAINT IF EXISTS "session_user_id_user_id_fk";
ALTER TABLE IF EXISTS "account" DROP CONSTRAINT IF EXISTS "account_user_id_user_id_fk";

-- 删除表
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "verification" CASCADE;

