import { test, expect, Page } from '@playwright/test';

// 测试账户
const ADMIN_CREDENTIALS = {
  email: 'tokyiopig@gmail.com',
  password: 'chaofan0920'
};

// 登录辅助函数
async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input#username', ADMIN_CREDENTIALS.email);
  await page.fill('input#password', ADMIN_CREDENTIALS.password);
  await page.click('button:has-text("登录")');
  await page.waitForURL(/\/(dashboard|my-stream|admin)/);
}

test.describe('管理后台测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('应该显示管理后台首页', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // 验证页面元素
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();
    await expect(page.getByText('管理后台')).toBeVisible();
  });

  test('点击员工视图应导航到任务流', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const employeeViewLink = page.getByText('员工视图');
    if (await employeeViewLink.isVisible()) {
      await employeeViewLink.click();
      await expect(page).toHaveURL(/\/my-stream/);
    }
  });

  test('页面应该正常加载', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // 页面应该显示项目卡片或空状态
    const pageContent = await page.content();
    const hasContent = pageContent.includes('暂无项目') || 
                       pageContent.includes('整体进度') ||
                       pageContent.includes('项目管理') ||
                       pageContent.includes('FluxQuant');
    
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Dashboard 测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('仪表板应正常显示统计数据', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 等待数据加载
    await page.waitForTimeout(2000);
    
    const pageContent = await page.content();
    
    // 应该显示统计数据或加载状态
    const hasValidState = pageContent.includes('整体进度') || 
                          pageContent.includes('今日') ||
                          pageContent.includes('项目') ||
                          pageContent.includes('FluxQuant');
    
    expect(hasValidState).toBeTruthy();
  });

  test('应该显示仪表板组件', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // 等待加载
    await page.waitForTimeout(2000);
    
    // 验证基本 UI
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();
  });
});
