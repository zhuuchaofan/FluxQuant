**FluxQuant (\*\***量流\***\*) -** **动态配额生产力追踪系统设计文档**

版本: 1.0.0

日期: 2026-01-17

技术栈: .NET 10 (Web API) + Next.js 15 (App Router/Server Actions) + Postgres + React Query (Polling)

**1.** **项目愿景与核心理念** **(Vision & Philosophy)**

**1.1** **核心痛点**

传统的项目管理工具（如 Jira/Trello）基于“离散的任务卡片”（Issue Tracking），无法有效处理以下“流式生产”场景：

1. **分母不确定**：任务总量（Total Quota）会随时根据业务变化而调整，导致进度计算困难。
2. **异常归因**：员工无法处理某些任务（如源数据损坏），传统工具只能标记“未完成”，导致员工绩效受损且掩盖了数据质量问题。
3. **批量流转**：任务不是一个一个指派，而是成百上千地按“份额”分配。

**1.2** **核心理念**

**FluxQuant** 重新定义了进度的计算方式：

- **进度** **≠** **状态切换**：进度不是从 Pending 到 Done。
- **进度** **=** **数值累积**：进度是有效产出量与动态分母的比率。
- **公式**：$$\text{进度} = \frac{\text{有效产出}}{\text{当前总量} - \text{除外总量}}$$

**2.** **领域模型设计** **(Domain Model)**

系统采用四层层级结构，核心实体为 **WorkPool (\*\***任务池\***\*)**。

**2.1** **实体层级** **(Hierarchy)**

1. **Project (\*\***项目\***\*)**: 宏观容器（例：2026 Q1 数据迁移）。
2. **Stage (\*\***阶段\***\*)**: 逻辑切片（例：扫描 -> 清洗 -> 录入）。
3. **TaskPool (\*\***任务池\***\*)**: **[\*\***核心\***\*]** 承载总工作量的蓄水池（例：合同扫描，总量 5000）。
4. **Allocation (\*\***分配单元\***\*)**: 连接 TaskPool 与 User 的桥梁，定义“分给谁”以及“分多少”。

**2.2** **状态定义**

任务没有状态（Open/Close），只有**数值流向**：

- **Total Quota (\*\***总水位\***\*)**: 任务池的当前总量。
- **Valid Output (\*\***有效产出\***\*)**: 成功的完成量。
- **Excluded (\*\***除外\***\*/\*\***异常\***\*)**: 因客观原因无法完成的量（从分母剔除）。
- **Void Effort (\*\***无效工时\***\*)**: 做了但无效的工作（计入员工苦劳，但不计入项目进度）。

**3.** **详细设计：员工端** **(Employee Side)**

**设计目标**: 低摩擦输入，高频正反馈。

**3.1** **界面交互** **(UI/UX)**

- **视图**: **My Stream (\*\***我的卡片流\***\*)**。
- **展示**: 不显示复杂的项目全貌，仅显示“分配给我的卡片”。
  - 进度条: 个人目标达成率（如：已做 150 / 分配 200）。
- **核心操作**: **“\*\***每日结算\***\*”\*\***弹窗\*\*。

**3.2** **业务逻辑** **(Business Logic)**

1. **填报逻辑**:
   - 员工输入 Valid Qty（有效量）。
   - 员工输入 Excluded Qty（除外量），**必须**选择原因（如：源文件损坏、数据重复）并可选填备注。

1. **即时反馈** **(Optimistic UI)**:

- 前端不等待服务器响应，直接根据输入值更新进度条动画，提供瞬时的成就感。

1. **数据归属**:

- 填报的数据直接计入个人的绩效统计。
- 同时触发 TaskPool 级别的聚合计算。

**3.3** **预期成果** **(Outcomes)**

- 员工不再抗拒填表，因为操作在 5 秒内完成。
- “坏数据”被显性化地记录下来，员工不再为上游的错误背锅。
- 形成清晰的个人产出日报（Timesheet）。

**4.** **详细设计：管理端** **(Manager Side)**

**设计目标**: 全局可视，资源调度，异常阻断。

**4.1** **界面交互** **(UI/UX)**

- **主视图**: **Allocation Matrix (\*\***分配矩阵\***\*)**。
  - 行: 任务池 (Task Pools)。
  - 列: 团队成员 (Users) + 未分配池 + 总量。
  - 单元格: 可直接编辑的分配数字。
- **辅助视图**: **Analytics Dashboard (\*\***分析仪表盘\***\*)**。

**4.2** **核心功能** **(Core Features)**

1. **动态配额调整** **(Dynamic Quota)**:
   - 允许修改 TaskPool 的总量。
   - **强制审计**: 修改时必须填写 Reason，系统记录 AdjustmentLog。

1. **资源再平衡** **(Re-balancing)**:

- 通过矩阵视图，将 User A 的未完成配额“划拨”给 User B。
- 系统自动计算 Unassigned（未分配）数量，防止分配溢出。

1. **异常熔断**:

- 当某任务的 Exclusion Rate (除外率) > 10% 时，界面高亮预警，提示管理者介入。

**4.3** **预期成果** **(Outcomes)**

- 管理者拥有“上帝视角”，进度不仅看百分比，更能看“除外分布”。
- 彻底解决了“总数变了怎么算进度”的烂账问题。
- 通过审计日志，所有进度的回退或突增都有据可查。

**5.** **数据架构设计** **(Database Schema)**

基于关系型数据库 (PostgreSQL/SQL Server)，采用 **“\*\***快照\*\* **+** **事件溯源\*\***”\*\* 的混合模式。

**5.1** **静态结构表**

-- 任务池定义
CREATE TABLE TaskPools (
Id INT PRIMARY KEY,
ProjectId INT,
Name NVARCHAR(100),
CurrentTotalQuota INT, -- 当前总量（可变）
RowVersion TIMESTAMP -- 用于并发控制的乐观锁
);
-- Constraint: 写入 `ProductionLogs` 与更新 `Allocations` **必须**在同一个数据库事务 (Transaction) 中完成，确保数据强一致性。

-- 团队/组织 (New: Audit Item 1)
CREATE TABLE Teams (
Id INT PRIMARY KEY,
Name NVARCHAR(50),
ManagerId INT
);

-- 分配关系
CREATE TABLE Allocations (
Id INT PRIMARY KEY,
TaskPoolId INT,
UserId INT NULL, -- [Modified: Audit Item 4] 允许为空，支持“抢单模式”或“公共池”
TeamId INT NULL, -- [New] 可选绑定团队
TargetQuota INT, -- 分配目标
CurrentValid INT, -- [快照] 当前有效产出
CurrentExcluded INT -- [快照] 当前除外量
);

**5.2 动态流水表 (系统的核心)**

-- 生产日志 (记录每一次填报)
CREATE TABLE ProductionLogs (
Id BIGINT PRIMARY KEY,
AllocationId INT,
Date DATE,
ValidQty INT,
ExcludedQty INT,
ExclusionReason NVARCHAR(50), -- 仅当 ExcludedQty > 0 时非空
Comment NVARCHAR(200),
CreatedAt DATETIME
);

-- 总量调整审计 (记录每一次分母变化)
CREATE TABLE PoolAdjustmentLogs (
Id INT PRIMARY KEY,
TaskPoolId INT,
OldQuota INT,
NewQuota INT,
Reason NVARCHAR(200),
OperatorId INT,
CreatedAt DATETIME
);

**6.** **关键算法与逻辑** **(Key Algorithms)**

**6.1** **实时进度计算** **(Real-time Calculation)**

后端不存储“进度百分比”，永远是实时计算得出。

public class ProgressCalculator
{
public decimal Calculate(int currentTotal, int totalValid, int totalExcluded)
{
// 核心公式：分母 = 总量 - 除外量
int effectiveTotal = currentTotal - totalExcluded;

     if (effectiveTotal <= 0) return 0; // 避免除以零
     if (totalValid >= effectiveTotal) return 100; // 防止溢出

     return (decimal)totalValid / effectiveTotal * 100;

}
}

**6.2** **每日快照** **Job (Daily Snapshot)**

为了生成历史趋势图（燃尽图），系统需运行每日定时任务：

1. **Trigger**: 每天 00:00。
2. **Action**: 遍历所有活跃 Project。
3. **Save**: 将当天的 Sum(Valid) 和 Sum(Excluded) 存入 DailyProjectStats 表。
4. **Purpose**: 前端查询历史曲线时，直接读 Stats 表，无需回溯计算数百万条 Log。

**6.3** **数据一致性对账** **(Reconciliation Job)**

- **触发**: 每晚 03:00 (错峰执行)。
- **逻辑**:
  - 重新计算 `Sum(ProductionLogs.Valid)` where `AllocationId = X`。
  - 对比 `Allocations.CurrentValid`。
  - 若不一致 -> 触发 `DataDriftAlert` 并自动修复快照值。
- **价值**: 作为“双写”模式的最终兜底机制 (Safety Net)。

**7.** **技术实现难点预案**

1. **并发冲突**:
   - 场景: 管理员 A 和 B 同时修改任务总量。
   - 方案: 使用 EF Core 的 ConcurrencyToken。如果版本号不一致，抛出异常并提示前端刷新。

1. **海量数据聚合**:

- 场景: 矩阵视图需要加载 50 个任务 \* 10 个人的实时数据。
- 方案: 在 Allocations 表中维护 CurrentValid 快照字段。每次插入 Log 时，原子性更新 Allocation 表，读的时候直接读 Allocation，避免 Sum(Logs)。

**8.** **总结**

**FluxQuant** 不仅仅是一个记录工具，它是一套**生产力量化方法论**。

- 对**员工**，它提供了清晰的边界和免责机制（除外标记）。
- 对**管理**，它提供了动态调整的弹性和深度的质量洞察。
- 对**开发者**，它是练习 DDD（领域驱动设计）、CQRS（命令查询职责分离）和并发处理的绝佳战场。
