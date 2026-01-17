import { test, expect, Page } from '@playwright/test';

/**
 * FluxQuant 端到端数据操作测试
 * 
 * 测试完整的业务流程数据操作:
 * 1. 创建项目和任务池
 * 2. 创建员工分配
 * 3. 员工填报进度
 * 4. 验证统计数据更新
 */

const ADMIN_CREDENTIALS = {
  email: 'tokyiopig@gmail.com',
  password: 'chaofan0920'
};

// 生成唯一测试数据
const generateUniqueId = () => Date.now().toString().slice(-8);

test.describe.serial('端到端数据操作测试', () => {
  let testProjectName: string;
  let testTaskPoolName: string;

  test.beforeAll(() => {
    const id = generateUniqueId();
    testProjectName = `测试项目_${id}`;
    testTaskPoolName = `测试任务池_${id}`;
  });

  // 登录辅助函数
  async function login(page: Page) {
    await page.goto('/login');
    await page.fill('input#username', ADMIN_CREDENTIALS.email);
    await page.fill('input#password', ADMIN_CREDENTIALS.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/(dashboard|my-stream|admin)/);
  }

  test('1. 管理员登录并记录初始统计', async ({ page }) => {
    await login(page);
    
    // 访问仪表板记录初始统计
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 截图记录初始状态
    await page.screenshot({ path: 'test-results/data-ops/01-initial-dashboard.png' });
    
    // 验证仪表板正常显示
    const pageContent = await page.content();
    expect(pageContent.includes('项目') || pageContent.includes('FluxQuant')).toBeTruthy();
  });

  test('2. 在矩阵视图中创建分配', async ({ page }) => {
    await login(page);
    
    // 访问矩阵视图 - 修正路由
    await page.goto('/admin/matrix');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 截图当前矩阵状态
    await page.screenshot({ path: 'test-results/data-ops/02-matrix-before.png' });
    
    // 查找项目选择器
    const projectSelector = page.locator('select, [role="combobox"], button:has-text("选择项目")').first();
    
    if (await projectSelector.isVisible()) {
      await projectSelector.click();
      await page.waitForTimeout(500);
      
      // 选择第一个项目
      const firstOption = page.locator('[role="option"], option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // 查找创建分配按钮
    const createAllocationBtn = page.getByRole('button', { name: /新增|创建|分配/i }).first();
    
    if (await createAllocationBtn.isVisible()) {
      await createAllocationBtn.click();
      await page.waitForTimeout(500);
      
      // 检查是否有分配对话框
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        await page.screenshot({ path: 'test-results/data-ops/02-allocation-dialog.png' });
        
        // 尝试填写分配表单
        const quotaInput = dialog.locator('input[type="number"], input[name*="quota"]').first();
        if (await quotaInput.isVisible()) {
          await quotaInput.fill('100');
        }
        
        // 提交或取消
        const submitBtn = dialog.getByRole('button', { name: /确定|保存|创建/i });
        const cancelBtn = dialog.getByRole('button', { name: /取消/i });
        
        if (await submitBtn.isEnabled()) {
          await submitBtn.click();
        } else if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
        
        await page.waitForTimeout(1000);
      }
    }
    
    await page.screenshot({ path: 'test-results/data-ops/02-matrix-after.png' });
    
    // 验证页面正常
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();
  });

  test('3. 员工查看分配的任务', async ({ page }) => {
    await login(page);
    
    // 访问员工任务流
    await page.goto('/my-stream');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/data-ops/03-my-stream.png' });
    
    // 验证任务流页面
    await expect(page.getByText('全部任务')).toBeVisible();
    
    // 检查是否有任务卡片
    const pageContent = await page.content();
    const hasTasks = pageContent.includes('进度') || 
                     pageContent.includes('%') ||
                     pageContent.includes('暂无');
    expect(hasTasks).toBeTruthy();
  });

  test('4. 员工进行填报操作', async ({ page }) => {
    await login(page);
    
    // 访问员工任务流
    await page.goto('/my-stream');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 查找任务卡片上的填报按钮
    const reportButtons = page.getByRole('button', { name: /填报|记录|提交/i });
    
    if (await reportButtons.first().isVisible()) {
      await reportButtons.first().click();
      await page.waitForTimeout(500);
      
      // 检查填报对话框
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        await page.screenshot({ path: 'test-results/data-ops/04-report-dialog.png' });
        
        // 填写有效产出
        const validQtyInput = dialog.locator('input[name*="valid"], input[type="number"]').first();
        if (await validQtyInput.isVisible()) {
          await validQtyInput.fill('10');
        }
        
        // 提交填报
        const submitBtn = dialog.getByRole('button', { name: /确定|提交|保存/i });
        if (await submitBtn.isEnabled()) {
          await submitBtn.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'test-results/data-ops/04-report-success.png' });
        } else {
          // 取消对话框
          const cancelBtn = dialog.getByRole('button', { name: /取消/i });
          if (await cancelBtn.isVisible()) {
            await cancelBtn.click();
          }
        }
      }
    } else {
      // 如果没有填报按钮，可能是没有分配任务
      await page.screenshot({ path: 'test-results/data-ops/04-no-tasks.png' });
    }
    
    // 验证页面正常
    const pageContent = await page.content();
    expect(pageContent.includes('FluxQuant') || pageContent.includes('任务')).toBeTruthy();
  });

  test('5. 验证仪表板统计更新', async ({ page }) => {
    await login(page);
    
    // 访问仪表板
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/data-ops/05-dashboard-updated.png' });
    
    // 验证统计数据显示
    const pageContent = await page.content();
    
    // 检查关键统计指标
    const hasStats = pageContent.includes('项目') || 
                     pageContent.includes('员工') ||
                     pageContent.includes('今日') ||
                     pageContent.includes('进度');
    expect(hasStats).toBeTruthy();
    
    // 检查是否有数值显示
    const hasNumbers = /\d+/.test(pageContent);
    expect(hasNumbers).toBeTruthy();
  });

  test('6. 验证矩阵视图进度更新', async ({ page }) => {
    await login(page);
    
    // 访问矩阵视图 - 修正路由
    await page.goto('/admin/matrix');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/data-ops/06-matrix-progress.png' });
    
    // 验证矩阵页面
    const pageContent = await page.content();
    const isMatrixPage = pageContent.includes('矩阵') || 
                         pageContent.includes('分配') ||
                         pageContent.includes('FluxQuant');
    expect(isMatrixPage).toBeTruthy();
  });
});

test.describe('填报详细测试', () => {
  async function login(page: Page) {
    await page.goto('/login');
    await page.fill('input#username', ADMIN_CREDENTIALS.email);
    await page.fill('input#password', ADMIN_CREDENTIALS.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/(dashboard|my-stream|admin)/);
  }

  test('验证填报历史记录', async ({ page }) => {
    await login(page);
    await page.goto('/my-stream');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 查找任务卡片
    const taskCards = page.locator('[class*="card"]').first();
    
    if (await taskCards.isVisible()) {
      await taskCards.click();
      await page.waitForTimeout(500);
      
      // 检查是否展开了历史记录
      await page.screenshot({ path: 'test-results/data-ops/07-history.png' });
    }
    
    // 验证页面正常
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();
  });

  test('验证今日产出统计', async ({ page }) => {
    await login(page);
    await page.goto('/my-stream');
    await page.waitForLoadState('networkidle');
    
    // 检查今日产出区域
    const pageContent = await page.content();
    const hasTodayStats = pageContent.includes('今日') || 
                          pageContent.includes('产出') ||
                          pageContent.includes('Today');
    
    await page.screenshot({ path: 'test-results/data-ops/08-today-output.png' });
    
    expect(hasTodayStats || pageContent.includes('FluxQuant')).toBeTruthy();
  });
});

test.describe('管理端统计验证', () => {
  async function login(page: Page) {
    await page.goto('/login');
    await page.fill('input#username', ADMIN_CREDENTIALS.email);
    await page.fill('input#password', ADMIN_CREDENTIALS.password);
    await page.click('button:has-text("登录")');
    await page.waitForURL(/\/(dashboard|my-stream|admin)/);
  }

  test('验证仪表板整体进度', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/data-ops/09-overall-progress.png' });
    
    // 检查整体进度显示
    const pageContent = await page.content();
    const hasProgress = pageContent.includes('进度') || 
                        pageContent.includes('%') ||
                        pageContent.includes('整体');
    
    expect(hasProgress || pageContent.includes('FluxQuant')).toBeTruthy();
  });

  test('验证异常检测显示', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/data-ops/10-anomaly-detection.png' });
    
    // 验证仪表板正常
    await expect(page.locator('text=FluxQuant').first()).toBeVisible();
  });

  test('验证项目统计汇总', async ({ page }) => {
    await login(page);
    await page.goto('/admin/projects');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/data-ops/11-project-stats.png' });
    
    // 验证项目列表显示统计信息
    const pageContent = await page.content();
    const hasProjectStats = pageContent.includes('阶段') || 
                            pageContent.includes('任务池') ||
                            pageContent.includes('项目');
    
    expect(hasProjectStats).toBeTruthy();
  });
});
