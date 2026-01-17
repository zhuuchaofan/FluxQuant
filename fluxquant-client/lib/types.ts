import { z } from "zod";

// ============ Auth DTOs ============

export const registerSchema = z.object({
  username: z.string().min(3, "用户名至少3个字符").max(50, "用户名最多50个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符").max(100, "密码最多100个字符"),
  displayName: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "请输入用户名或邮箱"),
  password: z.string().min(1, "请输入密码"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export interface UserDto {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  role: "Employee" | "Manager" | "Admin";
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserDto;
}

// ============ Allocation DTOs ============

export interface AllocationDto {
  id: number;
  taskPoolId: number;
  taskPoolName: string;
  stageName: string;
  targetQuota: number;
  currentValid: number;
  currentExcluded: number;
}

// ============ Report DTOs ============

export const reportSchema = z.object({
  allocationId: z.number(),
  logDate: z.string(), // YYYY-MM-DD
  validQty: z.number().min(0, "有效量不能为负数"),
  excludedQty: z.number().min(0, "除外量不能为负数"),
  exclusionReason: z.string().optional(),
  comment: z.string().optional(),
});

export type ReportRequest = z.infer<typeof reportSchema>;

export interface ProductionLogDto {
  id: number;
  logDate: string;
  validQty: number;
  excludedQty: number;
  exclusionReason?: string;
  comment?: string;
  createdAt: string;
}

// ============ Matrix DTOs ============

export interface MatrixCellDto {
  userId: number;
  userName: string;
  targetQuota: number;
  currentValid: number;
  currentExcluded: number;
}

export interface MatrixRowDto {
  taskPoolId: number;
  taskPoolName: string;
  stageName: string;
  totalQuota: number;
  unassigned: number;
  allocations: MatrixCellDto[];
}

export interface MatrixDataDto {
  projectId: number;
  projectName: string;
  rows: MatrixRowDto[];
  users: { id: number; name: string }[];
}
