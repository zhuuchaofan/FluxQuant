# FluxQuant (量流) - 动态配额生产力追踪系统

> **注意**: 本项目是一个生产级系统，严格遵循 Antigravity 架构规范。

## 📋 环境要求

在启动项目之前，请确保您的开发环境满足以下要求：

- **.NET 10 SDK** (后端)
- **Node.js 22 (LTS)** (前端)
- **Docker** (用于 PostgreSQL 数据库)

---

## 🚀 快速启动

### 1. 启动数据库

本项目后端强依赖 **PostgreSQL**。在运行后端之前，**必须**确保数据库容器正在运行。

```bash
# 示例：使用 Docker 启动 Postgres
docker run --name fluxquant-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:latest
```

> **⚠️ 重要**: 如果本地未运行 Postgres，后端应用将无法启动。

### 2. 启动后端 (FluxQuant.Server)

后端服务负责 API 接口和数据库迁移。

```bash
cd FluxQuant.Server

# 应用数据库迁移 (确保连接字符串正确)
dotnet ef database update

# 启动服务
dotnet run
# 服务将运行在 https://localhost:7193 (或其他配置端口)
```

### 3. 启动前端 (fluxquant-client)

前端为 Next.js 15 应用，通过 Proxy 或 Direct Fetch 与后端通信。

```bash
cd fluxquant-client

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 访问 http://localhost:3333
```

---

## ⚙️ 核心配置说明 (CRITICAL)

### 1. 数据库连接字符串

- **开发环境**: 默认配置在 `appsettings.Development.json`。
- **生产环境**: **严禁**将连接字符串硬编码在代码中。请使用环境变量注入：

  ```bash
  ConnectionStrings__DefaultConnection="Host=prod-db;Database=fluxquant;Username=user;Password=secret"
  ```

### 2. JWT 密钥安全

- **开发环境**: `appsettings.Development.json` 中可使用弱密钥。
- **生产环境**: 必须提供强密钥（至少 32 字符），否则应用启动时不安全。

  ```bash
  Jwt__Key="YOUR_SUPER_SECRET_LONG_KEY_FOR_PRODUCTION"
  Jwt__Issuer="FluxQuant.Prod"
  ```

### 3. Cookie 安全标志

前端 Server Actions (`auth.ts`) 已配置自动环境识别：

- **开发环境 (`NODE_ENV != production`)**: `secure: false` (允许 HTTP 调试)
- **生产环境 (`NODE_ENV == production`)**: `secure: true` (**强制 HTTPS**)

> **注意**: 生产环境部署必须启用 HTTPS，否则 Auth Cookie 将无法设置，导致登录失败。

---

## 🧪 测试与验证

### 后端单元测试

项目包含完整的单元测试覆盖核心逻辑（认证 & 矩阵计算）。

```bash
cd FluxQuant.Tests
dotnet test
```

### 前端验证

提交代码前请运行 Lint 检查：

```bash
cd fluxquant-client
npm run lint
```

---

## 📚 文档资源

- [架构规范 (ARCHITECTURE.md)](./ARCHITECTURE.md)
- [详细设计文档](<./FluxQuant%20(%E9%87%8F%E6%B5%81)%20-%E5%8A%A8%E6%80%81%E9%85%8D%E9%A2%9D%E7%94%9F%E4%BA%A7%E5%8A%9B%E8%BF%BD%E8%B8%AA%E7%B3%BB%E7%BB%9F%E8%AE%BE%E8%AE%A1%E6%96%87%E6%A1%A3.md>)
