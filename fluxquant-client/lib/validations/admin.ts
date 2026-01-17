/**
 * 管理后台 CRUD 操作的 Zod 验证 Schema
 */

import { z } from "zod";

// ==================== 项目管理 ====================

export const createProjectSchema = z.object({
  name: z.string().min(1, "项目名称不能为空").max(100, "项目名称最多100个字符"),
  code: z.string().min(1, "项目代码不能为空").max(50, "项目代码最多50个字符"),
  description: z.string().max(500, "描述最多500个字符").optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "项目名称不能为空").max(100),
  code: z.string().min(1, "项目代码不能为空").max(50),
  description: z.string().max(500).optional(),
  isActive: z.boolean(),
});

// ==================== 阶段管理 ====================

export const createStageSchema = z.object({
  projectId: z.number().positive("项目ID必须为正整数"),
  name: z.string().min(1, "阶段名称不能为空").max(100),
  order: z.number().min(0, "排序值不能为负数"),
  description: z.string().max(500).optional(),
});

export const updateStageSchema = z.object({
  name: z.string().min(1, "阶段名称不能为空").max(100),
  order: z.number().min(0),
  description: z.string().max(500).optional(),
});

// ==================== 任务池管理 ====================

export const createTaskPoolSchema = z.object({
  stageId: z.number().positive("阶段ID必须为正整数"),
  name: z.string().min(1, "任务池名称不能为空").max(100),
  totalQuota: z.number().min(0, "配额不能为负数"),
  description: z.string().max(500).optional(),
});

export const updateTaskPoolSchema = z.object({
  name: z.string().min(1, "任务池名称不能为空").max(100),
  totalQuota: z.number().min(0),
  description: z.string().max(500).optional(),
});

// ==================== 用户管理 ====================

const roleEnum = z.enum(["Admin", "Manager", "Employee"]);

export const createUserSchema = z.object({
  username: z.string().min(3, "用户名至少3个字符").max(50),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符").max(100),
  displayName: z.string().max(100).optional(),
  role: roleEnum,
});

export const updateUserSchema = z.object({
  displayName: z.string().max(100).optional(),
  email: z.string().email("请输入有效的邮箱地址").optional(),
  role: roleEnum,
  isActive: z.boolean(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "密码至少6个字符").max(100),
});

// ==================== ID 参数验证 ====================

export const idParamSchema = z.number().positive("ID必须为正整数");
