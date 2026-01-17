"use server";

import { apiPost } from "@/lib/api";
import { type LoginRequest, type RegisterRequest, type AuthResponse } from "@/lib/types";

/**
 * 用户注册 Server Action
 */
export async function registerAction(data: RegisterRequest) {
  const response = await apiPost<AuthResponse>("/api/v1/auth/register", data);
  
  if (!response.success) {
    return { success: false, error: response.error };
  }
  
  // TODO: 设置 HttpOnly Cookie
  
  return { success: true, data: response.data };
}

/**
 * 用户登录 Server Action
 */
export async function loginAction(data: LoginRequest) {
  const response = await apiPost<AuthResponse>("/api/v1/auth/login", data);
  
  if (!response.success) {
    return { success: false, error: response.error };
  }
  
  // TODO: 设置 HttpOnly Cookie
  
  return { success: true, data: response.data };
}

/**
 * 用户登出 Server Action
 */
export async function logoutAction() {
  // TODO: 清除 Cookie
  return { success: true };
}
