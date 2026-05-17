# CLAUDE.md

此文件为 Claude Code（claude.ai/code）在本仓库中工作时提供指引。

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run start    # 启动生产服务器
npm run lint     # ESLint（eslint-config-next + core-web-vitals + TypeScript）
```

没有配置测试套件。

## 架构概览

侨批书信 — 基于 Next.js 16 App Router 的复古书信生成网站，通过 DeepSeek AI 将用户输入改写为侨批风格书信正文，支持下载为 PNG 或通过邮件发送。

### 页面流程（客户端状态机）

`app/page.tsx` 是整个应用的核心，作为 `'use client'` 组件，通过 `PageState` 状态机驱动页面切换：`form` → `loading` → `result` | `error`。所有用户交互均在 `/` 路由完成，不依赖 Next.js 路由系统。

### API 路由（App Router）

| 路由 | 用途 | 外部依赖 |
|---|---|---|
| `app/api/translate/route.ts` | POST — 将用户输入发送至 DeepSeek Chat API，返回 AI 生成的侨批书信正文 | DeepSeek（`DEEPSEEK_API_KEY`） |
| `app/api/send-mail/route.ts` | POST — 通过 nodemailer 将书信 PNG 图片作为附件发送至指定邮箱 | 163 SMTP（`MAIL_AUTH_CODE`） |

两个路由均包含基于内存的 IP 速率限制和输入校验：
- translate：每小时最多 30 次，内容最长 500 字，角色白名单（夫/妻/兄/弟/姐/妹）
- send-mail：每小时最多 10 次，邮箱格式正则校验，图片 data URI 校验，5MB 限制，HTML 转义（`escapeHtml()`）

### 组件（均为 `'use client'`）

- **Form** — 寄信人/收信人角色选择器，根据寄信人角色联动限制收信人选项（`RECEIVER_ROLES` 映射表），包含信件内容和随信附寄输入。导出 `FormData` 类型。
- **Letter** — 将生成的书信以传统竖排（`writing-mode: vertical-rl`）渲染在 CSS 网格上（10 列 × 18 字/列）。落款通过计算 padding 使寄信人姓名和日期对齐到最左列。使用「马善政」+「Noto Serif TC」字体。使用 `forwardRef` 以便 html-to-image 截图。导出 `LetterData` 类型。
- **Loading** — AI 生成期间展示的书法动画场景（毛笔、墨滴、信纸）。
- **SendModal** — 多阶段弹窗：折叠动画 → 邮箱表单 → 发送动画 → 成功/失败。挂载时通过 `html-to-image` 预截取书信元素。
- **Envelope** — 装饰性信封组件，带点击拆信动画。当前未在主流程中使用。

### 路径别名

`@/*` 通过 tsconfig paths 映射到项目根目录（`./*`），导入形式如 `@/components/Form/Form`。

### 样式

每个组件使用 CSS Modules。`globals.css` 中的 `:root` 定义了调色板变量（`--color-bg`、`--color-envelope`、`--color-letter`、`--color-text`、`--color-seal`）。引入 Google Fonts：「马善政」（书法体）、「Noto Serif TC」（正文）。整体为深色纸张纹理风格。

### 环境变量

复制 `.env.example` 为 `.env.local` 并填入：
- `DEEPSEEK_API_KEY` — 从 https://platform.deepseek.com 获取
- `MAIL_AUTH_CODE` — 163 邮箱 SMTP 授权码
