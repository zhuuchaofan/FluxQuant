/**
 * API 基础 URL
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * 统一的 API 响应类型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 封装的 fetch 函数，自动处理认证和错误
 */
export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // 携带 cookie
    });

    if (!response.ok) {
      // 尝试解析错误信息
      try {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || errorData.message || `请求失败: ${response.status}`,
        };
      } catch {
        return {
          success: false,
          error: `请求失败: ${response.status}`,
        };
      }
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "网络错误",
    };
  }
}

/**
 * GET 请求封装
 */
export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return apiClient<T>(path, { method: "GET" });
}

/**
 * POST 请求封装
 */
export async function apiPost<T, D = unknown>(
  path: string,
  data: D
): Promise<ApiResponse<T>> {
  return apiClient<T>(path, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * PATCH 请求封装
 */
export async function apiPatch<T, D = unknown>(
  path: string,
  data: D
): Promise<ApiResponse<T>> {
  return apiClient<T>(path, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * DELETE 请求封装
 */
export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  return apiClient<T>(path, { method: "DELETE" });
}
