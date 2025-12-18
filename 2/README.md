# 学生管理平台（全栈单体仓库）

本项目实现一个功能完善的学生管理平台，包含前端（React 18 + Vite + Tailwind + Redux Toolkit + React Router）与后端（Node.js + Express + TypeScript + TypeORM + PostgreSQL），并集成 JWT 认证、RBAC 权限控制、Swagger API 文档、文件存储（MinIO）、定时任务与基础数据分析。

## 目录结构

```
apps/
  backend/   后端服务（REST API）
  frontend/  前端应用（React）
docs/        技术文档与设计说明
```

## 快速开始

1) 安装依赖并启动开发环境（首次请先启动 Docker 依赖）

```
docker compose up -d
```

2) 后端开发运行

```
cd apps/backend
npm install
npm run dev
```

后端默认监听 `http://localhost:3001`，Swagger 文档在 `http://localhost:3001/api/docs`。

3) 前端开发运行

```
cd apps/frontend
npm install
npm run dev
```

前端默认在 Vite 提供的本地端口启动。

## 环境变量

复制 `apps/backend/.env.example` 为 `.env` 并按需修改：

```
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=student_mgmt
JWT_SECRET=change_me_in_prod
JWT_REFRESH_SECRET=change_me_too
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=assignments
```

## Docker 与服务

`docker-compose.yml` 会启动：
- PostgreSQL（`student_mgmt` 数据库）
- MinIO（用于文件上传存储）

## 文档

- API 文档：`http://localhost:3001/api/docs`
- 设计说明与ER图：`docs/architecture.md`、`docs/db/er.md`

## 测试

后端使用 Jest：
```
cd apps/backend
npm run test
```

## 许可证

MIT

