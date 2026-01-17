import { test, expect } from '@playwright/test';

test.describe('员工任务流页面测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-stream');
  });

  test('应该正确显示页面结构', async ({ page }) => {
    // 验证 Header Logo
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();

    // 验证筛选标签存在
    await expect(page.getByText('全部任务')).toBeVisible();
  });

  test('应该显示任务列表或空状态', async ({ page }) => {
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查是否显示任务卡片或空状态
    // 使用更通用的方式检查页面状态
    const pageContent = await page.content();
    
    // 页面应该包含有意义的内容
    const hasContent = pageContent.includes('暂无任务') || 
                       pageContent.includes('进度') || 
                       pageContent.includes('加载');
    
    expect(hasContent).toBeTruthy();
  });

  test('今日产出区域应该存在', async ({ page }) => {
    // 页面应该有今日相关的文本
    const pageContent = await page.content();
    const hasTodaySection = pageContent.includes('今日') || pageContent.includes('Today');
    
    expect(hasTodaySection).toBeTruthy();
  });
});

test.describe('员工任务流 - 响应式测试', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('移动端页面应正常渲染', async ({ page }) => {
    await page.goto('/my-stream');
    await page.waitForLoadState('networkidle');
    
    // 验证页面可以正常加载
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();
  });
});
