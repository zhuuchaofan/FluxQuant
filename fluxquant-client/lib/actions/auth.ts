"use server";

import { apiPost, apiGet } from "@/lib/api";
import { type LoginRequest, type RegisterRequest, type AuthResponse, type UserDto } from "@/lib/types";

/**
 * 用户注册 Server Action
 */
export async function registerAction(data: RegisterRequest) {
  const response = await apiPost<AuthResponse>("/api/v1/auth/register", data);
  
  if (!response.success) {
    return { success: false, error: response.error };
  }
  
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
  
  return { success: true, data: response.data };
}

/**
 * 用户登出 Server Action
 */
export async function logoutAction() {
  const response = await apiPost<{ message: string }>("/api/v1/auth/logout", {});
  return { success: response.success };
}

/**
 * 获取当前登录用户信息 Server Action
 */
export async function getCurrentUserAction() {
  const response = await apiGet<UserDto>("/api/v1/auth/me");
  
  if (!response.success) {
    return { success: false, error: response.error };
  }
  
  return { success: true, data: response.data };
}
