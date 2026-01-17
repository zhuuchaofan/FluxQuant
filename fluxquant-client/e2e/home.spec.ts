import { test, expect } from '@playwright/test';

test.describe('首页测试', () => {
  test('应该正确显示首页内容', async ({ page }) => {
    await page.goto('/');

    // 验证标题
    await expect(page).toHaveTitle(/FluxQuant/);

    // 验证 Logo
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();

    // 验证核心特性卡片标题 - 使用精确匹配
    await expect(page.getByText('动态配额', { exact: true })).toBeVisible();
    await expect(page.getByText('异常归因', { exact: true })).toBeVisible();
    await expect(page.getByText('分配矩阵', { exact: true })).toBeVisible();

    // 验证 CTA 按钮（页面有多个，用 first() 匹配第一个）
    await expect(page.getByRole('link', { name: /登录/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /开始使用/i }).first()).toBeVisible();
  });

  test('点击登录按钮应导航到登录页', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('link', { name: /登录/i }).first().click();
    
    await expect(page).toHaveURL(/\/login/);
  });

  test('点击开始使用按钮应导航到注册模式', async ({ page }) => {
    await page.goto('/');
    
    // 头部的"开始使用"按钮
    await page.getByRole('link', { name: /开始使用/i }).first().click();
    
    await expect(page).toHaveURL(/\/login/);
  });
});
