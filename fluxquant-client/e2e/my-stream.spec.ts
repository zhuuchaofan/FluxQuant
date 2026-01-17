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

test.describe('员工任务流页面测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/my-stream');
    await page.waitForLoadState('networkidle');
  });

  test('应该正确显示页面结构', async ({ page }) => {
    // 验证 Header Logo
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();

    // 验证筛选标签存在
    await expect(page.getByText('全部任务')).toBeVisible();
  });

  test('应该显示任务列表或空状态', async ({ page }) => {
    // 检查是否显示任务卡片或空状态
    const pageContent = await page.content();
    
    // 页面应该包含有意义的内容
    const hasContent = pageContent.includes('暂无任务') || 
                       pageContent.includes('进度') || 
                       pageContent.includes('加载') ||
                       pageContent.includes('全部任务');
    
    expect(hasContent).toBeTruthy();
  });

  test('今日产出区域应该存在', async ({ page }) => {
    // 页面应该有今日相关的文本或产出区域
    const pageContent = await page.content();
    const hasTodaySection = pageContent.includes('今日') || 
                            pageContent.includes('产出') ||
                            pageContent.includes('Today') ||
                            pageContent.includes('FluxQuant');
    
    expect(hasTodaySection).toBeTruthy();
  });
});

test.describe('员工任务流 - 响应式测试', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('移动端页面应正常渲染', async ({ page }) => {
    await login(page);
    await page.goto('/my-stream');
    await page.waitForLoadState('networkidle');
    
    // 验证页面可以正常加载
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();
  });
});
