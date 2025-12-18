# 数据库ER概要

## 表

- users：用户基础信息，关联角色
- roles：角色定义
- students：学生档案与基本信息
- courses：课程基础信息与安排
- enrollments：选课关系与状态
- grades：成绩记录
- attendance：考勤记录
- assignments：作业与文件键值
- token_blacklist：注销令牌黑名单
- audit_logs：操作审计日志
- change_history：学生信息变更记录

## 索引建议

- students.studentNumber 唯一索引
- users.username 唯一索引
- courses.name 普通索引

