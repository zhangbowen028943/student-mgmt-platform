# 架构设计说明

## 总览

前端采用 React 18 + Vite + Tailwind + Redux Toolkit + React Router。后端采用 Node.js + Express + TypeScript + TypeORM + PostgreSQL，认证使用 JWT，权限基于 RBAC。文件存储使用 MinIO。API 文档通过 Swagger 提供。定时任务通过 node-schedule 配置。

## 模块

- 认证与权限：JWT 访问与刷新令牌、注销黑名单、角色控制
- 学生信息：学生档案表与变更历史记录
- 课程管理：课程与选课关系，容量与候补
- 成绩与考勤：成绩记录与考勤记录
- 作业管理：文件上传与下载
- 数据分析：图表展示与报表导出

## 安全

- CSRF 防护
- XSS 过滤
- HTTPS 部署建议
- 操作日志审计与敏感数据脱敏

## 部署

- Docker Compose 启动 Postgres 与 MinIO
- 后端与前端分别构建镜像
- 可扩展到 Kubernetes 与高可用

