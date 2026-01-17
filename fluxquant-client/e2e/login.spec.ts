import { test, expect } from '@playwright/test';

test.describe('登录页测试', () => {
  test('应该显示登录表单', async ({ page }) => {
    await page.goto('/login');

    // 验证页面元素
    await expect(page.locator('text=欢迎回来')).toBeVisible();
    await expect(page.locator('text=登录您的 FluxQuant 账户')).toBeVisible();

    // 验证表单元素
    await expect(page.locator('input#username')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button:has-text("登录")')).toBeVisible();

    // 验证切换到注册的链接
    await expect(page.locator('text=立即注册')).toBeVisible();
  });

  test('应该显示注册表单 (mode=register)', async ({ page }) => {
    await page.goto('/login?mode=register');

    // 验证注册模式
    await expect(page.locator('text=创建账户')).toBeVisible();

    // 验证额外的注册字段
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#displayName')).toBeVisible();
  });

  test('可以在登录和注册模式之间切换', async ({ page }) => {
    await page.goto('/login');

    // 确认初始为登录模式
    await expect(page.locator('text=欢迎回来')).toBeVisible();

    // 点击切换到注册
    await page.click('text=立即注册');
    await expect(page.locator('text=创建账户')).toBeVisible();

    // 点击切换回登录
    await page.click('text=立即登录');
    await expect(page.locator('text=欢迎回来')).toBeVisible();
  });

  test('空表单提交应显示验证', async ({ page }) => {
    await page.goto('/login');

    // 清空并提交
    await page.click('button:has-text("登录")');

    // HTML5 验证应阻止提交
    const usernameInput = page.locator('input#username');
    await expect(usernameInput).toHaveAttribute('required', '');
  });

  test('返回首页链接应正常工作', async ({ page }) => {
    await page.goto('/login');

    await page.click('text=返回首页');

    await expect(page).toHaveURL('/');
  });
});
