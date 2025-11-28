# Byte Short Video Management Platform

一个基于 Next.js 和 TypeScript 的现代化短视频管理平台，采用 Monorepo 架构，支持视频上传、管理、播放、弹幕互动和 AI 智能标签等功能。

## ✨ 特性

- 🎥 **视频管理**: 支持视频上传、编辑、分类和管理
- 💬 **实时弹幕**: 基于 Socket.io 的实时弹幕互动系统
- 🤖 **AI 智能标签**: 集成 OpenAI/DashScope API，自动生成视频标签
- 🎨 **现代化 UI**: 基于 shadcn/ui 和 Tailwind CSS 的响应式设计
- 🔐 **用户认证**: JWT + Refresh Token 的安全认证系统
- 📊 **数据可视化**: 使用 Recharts 展示数据图表
- 🌙 **主题切换**: 支持明暗主题切换
- 🚀 **高性能**: 使用 Turbo 进行构建优化，Next.js 15 和 React 19

## 🏗️ 项目结构

这是一个使用 pnpm workspace 和 Turbo 的 Monorepo 项目：

```
byte-short-video-mono/
├── apps/
│   ├── web/          # Next.js 15 前端应用
│   └── server/       # Express + Socket.io 后端服务
├── packages/
│   ├── db/           # Drizzle ORM 数据库层
│   ├── ui/           # shadcn/ui 组件库
│   ├── eslint-config/      # ESLint 配置
│   └── typescript-config/  # TypeScript 配置
└── turbo.json        # Turbo 构建配置
```

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **UI 库**: React 19, shadcn/ui
- **样式**: Tailwind CSS 4
- **数据请求**: TanStack Query (React Query)
- **表单**: TanStack Form + Zod
- **视频播放**: 阿里云 AliPlayer
- **图表**: Recharts

### 后端
- **运行时**: Node.js 20+
- **框架**: Express.js
- **实时通信**: Socket.io
- **数据库**: PostgreSQL + Drizzle ORM
- **认证**: JWT + bcryptjs

### 开发工具
- **包管理**: pnpm 10.4.1
- **构建工具**: Turbo
- **代码质量**: ESLint, Prettier, Husky, Commitlint
- **类型检查**: TypeScript 5.9+

### 第三方服务
- **视频存储**: 阿里云 VOD (Video on Demand)
- **AI 服务**: OpenAI / DashScope API

## 📦 安装

### 前置要求

- Node.js >= 20
- pnpm >= 10.4.1
- PostgreSQL 数据库

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd byte-short-video-mono
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**

在web项目创建 `.env` 文件，并配置以下变量：

```env
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT 密钥
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# 阿里云配置
ALIYUN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_REGION=cn-shanghai
ALIYUN_VOD_REGION=cn-shanghai

# AI API
DASHSCOPE_API_KEY=your-dashscope-api-key

```

4. **初始化数据库**

```bash
cd packages/db
pnpm db:push
# 或使用迁移
pnpm db:migrate
```

5. **启动开发服务器**

```bash
# 启动所有应用
pnpm dev

# 或分别启动
cd apps/web && pnpm dev      # 前端 (默认 http://localhost:3000)
cd apps/server && pnpm dev   # 后端服务
```

## 🚀 开发

### 常用命令

```bash
# 开发模式（启动所有应用）
pnpm dev

# 构建所有应用
pnpm build

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
cd apps/web && pnpm typecheck
```

### 添加 UI 组件

项目使用 shadcn/ui，添加组件到 `apps/web` 目录：

```bash
cd apps/web
pnpm dlx shadcn@latest add button
```

组件会自动添加到 `packages/ui/src/components` 目录。

### 数据库操作

```bash
cd packages/db

# 生成迁移文件
pnpm db:generate

# 执行迁移
pnpm db:migrate

# 推送 schema 变更（开发环境）
pnpm db:push

# 打开 Drizzle Studio
pnpm db:studio
```

## 📁 核心功能模块

### 认证系统 (`apps/web/features/auth`)
- 用户注册/登录
- JWT Token 管理
- Refresh Token 刷新机制
- 密码加密存储

### 视频管理 (`apps/web/app/(main)/manage`)
- 视频列表展示
- 视频上传（支持阿里云 OSS）
- 视频编辑和删除
- 视频分类管理

### AI 相关 (`apps/web/features/ai`)
- 视频内容分析
- 自动标签生成
- 任务状态追踪

### 瀑布流 (`apps/web/features/feed`)
- 瀑布流布局
- 虚拟滚动优化
- 响应式列数适配

### 视频播放器 (`apps/web/features/player`)
- 阿里云 AliPlayer 集成
- 播放控制
- 全屏支持

## 🔧 配置说明

### Turbo 配置

项目使用 Turbo 进行构建优化，配置文件位于 `turbo.json`。主要任务包括：
- `build`: 构建任务，支持依赖关系和缓存
- `dev`: 开发模式，持久化运行
- `lint`: 代码检查

### ESLint 配置

项目使用统一的 ESLint 配置，位于 `packages/eslint-config`。支持：
- Next.js 项目配置
- React 内部配置
- TypeScript 类型检查

### TypeScript 配置

TypeScript 配置位于 `packages/typescript-config`，包含：
- `base.json`: 基础配置
- `nextjs.json`: Next.js 项目配置
- `react-library.json`: React 库配置

## 🧪 代码规范

项目使用以下工具保证代码质量：

- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Husky**: Git hooks
- **Commitlint**: 提交信息规范
- **lint-staged**: 提交前检查

提交代码时，请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

## 📝 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | ✅ |
| `JWT_REFRESH_SECRET` | Refresh Token 签名密钥 | ✅ |
| `ALIYUN_ACCESS_KEY_ID` | 阿里云 Access Key ID | ✅ |
| `ALIYUN_ACCESS_KEY_SECRET` | 阿里云 Access Key Secret | ✅ |
| `DASHSCOPE_API_KEY` | DashScope API 密钥 | ⚠️ |
| `PORT` | 应用端口 | ❌ |

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request


## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Turbo](https://turbo.build/)

---

如有问题或建议，欢迎提交 Issue 或 Pull Request。
