"use server";

import { cookies } from "next/headers";
import { type LoginRequest, type RegisterRequest, type AuthResponse, type UserDto } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5555";

/**
 * 用户注册 Server Action
 */
export async function registerAction(data: RegisterRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || "注册失败" };
    }

    const result: AuthResponse = await response.json();
    
    // 从响应中提取 Set-Cookie 并设置到 Next.js
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      // 解析 cookie
      const match = setCookie.match(/fluxquant_token=([^;]+)/);
      if (match) {
        const cookieStore = await cookies();
        cookieStore.set("fluxquant_token", match[1], {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });
      }
    }
    
    return { success: true, data: result };
  } catch {
    return { success: false, error: "网络错误" };
  }
}

/**
 * 用户登录 Server Action
 */
export async function loginAction(data: LoginRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || "登录失败" };
    }

    const result: AuthResponse = await response.json();
    
    // 从响应中提取 Set-Cookie 并设置到 Next.js
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/fluxquant_token=([^;]+)/);
      if (match) {
        const cookieStore = await cookies();
        cookieStore.set("fluxquant_token", match[1], {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }
    
    return { success: true, data: result };
  } catch {
    return { success: false, error: "网络错误" };
  }
}

/**
 * 用户登出 Server Action
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fluxquant_token")?.value;
    
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    // 删除 Next.js 端的 cookie
    cookieStore.delete("fluxquant_token");
    
    return { success: true };
  } catch {
    return { success: false };
  }
}

/**
 * 获取当前登录用户信息 Server Action
 */
export async function getCurrentUserAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fluxquant_token")?.value;
    
    if (!token) {
      return { success: false, error: "未登录" };
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: false, error: "获取用户信息失败" };
    }

    const user: UserDto = await response.json();
    return { success: true, data: user };
  } catch {
    return { success: false, error: "网络错误" };
  }
}
