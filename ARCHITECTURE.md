# FluxQuant Architecture & Coding Standards

> **Living Document**: This file defines the structural and stylistic rules for the project.

## 1. System Architecture

### 1.1 Backend: .NET 10 Web API (MCSD Pattern)

We follow a strict **Layered Architecture** (Model-Controller-Service-DTO).

```
FluxQuant.Server/
├── Controllers/            # [C] API Endpoints (Thin)
├── Services/               # [S] Business Logic
│   ├── Interfaces/         # IService definitions
│   └── Implementations/    # Service logic
├── Models/                 # [M] Domain Entities (EF Core)
├── DTOs/                   # [D] Data Transfer Objects (Records)
├── Infrastructure/         # DBContext, Logging, External APIs
└── Program.cs              # DI & Middleware
```

**Key Decisions**:

- **DTOs**: MUST be `public record` types for immutability and conciseness.
  ```csharp
  public record CreatePoolRequest(string Name, int TotalQuota);
  ```
- **Controllers**:
  - Attribute-based routing (`[ApiController]`, `[Route("api/v1/[controller]")]`).
  - NO business logic. Only validation, service call, and mapping to HTTP response.
- **Services**:
  - Return `Task<T>` or `Result<T>`.
  - Handle all business rules.
- **Documentation**:
  - **Swagger (OpenAPI)** is mandatory.
  - All public APIs must have XML comments (`/// <summary>`).
- **Logging**:
  - Interface: `ILogger<T>`.
  - Implementation: **Serilog** (configured in Program.cs).
  - Log all exceptions and critical business events.
- **Linting**:
  - Use `.editorconfig` to enforce coding styles.
  - Warnings treated as Errors in Release build.

### 1.2 Frontend: Next.js 15 (App Router)

```
fluxquant-client/
├── app/                    # Routes
│   ├── (main)/             # Layout group for authenticated routes
│   │   ├── matrix/         # /matrix page
│   │   └── my-stream/      # /my-stream page
│   ├── login/              # Public route
│   └── layout.tsx          # Root layout
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── matrix/         # Matrix-specific components
│   │   │   ├── MatrixGrid.tsx
│   │   │   └── MatrixCell.tsx
│   │   └── stream/         # Employee Stream components
│   └── ui/                 # Shadcn UI (Atomic)
├── lib/
│   ├── actions/            # Server Actions (The "Controller" of Frontend)
│   ├── hooks/              # Custom Hooks
│   └── utils.ts            # Helpers
```

**Key Decisions**:

- **Server Actions**: All mutations use Server Actions.
- **Client Components**: Push down the component tree. Leaves are Client, Roots are Server.
- **Styling**: Tailwind CSS v4.
- **State**:
  - `useOptimistic` for instant feedback.
  - `nuqs` for URL-based state (filters, sorting).
  - `React Query` (optional, if detailed caching is needed beyond Next.js Cache).

### 1.3 Testing Strategy

- **Backend**:
  - **Unit Tests**: `FluxQuant.Server.Tests` (xUnit + FluentAssertions + NSubstitute).
  - **Integration Tests**: `FluxQuant.Server.IntegrationTests` (TestServer + Sqlite In-Memory).
- **Frontend**:
  - **Unit**: Vitest + React Testing Library.
  - **E2E**: Playwright (covering critical flows like "Report Progress").

### 1.4 API Synchronization (Type Safety)

- **Source of Truth**: Backend OpenAPI (Swagger) JSON.
- **Tooling**: Use `openapi-typescript` to auto-generate TS interfaces.
- **Workflow**:
  1. Backend updates DTO.
  2. CI/Dev runs `npm run api:sync`.
  3. Frontend gets compile error if fields missing.

---

## 2. Coding Conventions

### 2.1 Documentation & Comments

- **Rule**: Comments explain **WHY**, Code explains **HOW**.
- **Backend (C#)**:
  - **Public APIs**: MUST use XML Documentation `/// <summary>`.
  - **Complex Logic**: Inline comments explaining the _business rule_ source.
  ```csharp
  /// <summary>
  /// Calculates the effective progress deducting exclusions.
  /// </summary>
  /// <param name="total">Current dynamic quota.</param>
  public decimal Calculate(...)
  ```
- **Frontend (TS)**:
  - **Components**: JSDoc `/** */` for Props interface.
  - **Hooks**: Explain the side-effect or lifecycle management.

### 2.2 Backend (.NET)

- **Naming**: `PascalCase` for public members. `_camelCase` for private fields.
- **Async**: `await` everything. Use `CancellationToken` in arguments.
- **Validation**: Use `FluentValidation` if DTOs are complex.
- **Endpoints**:
  ```csharp
  // Example
  app.MapPost("/", async (CreatePoolRequest req, PoolService service) => {
      var result = await service.CreateAsync(req);
      return result.Match(TypedResults.Ok, TypedResults.BadRequest);
  });
  ```

### 2.2 Frontend (TSX)

- **Naming**: `PascalCase` for Components. `useCamelCase` for Hooks. `camelCase` for props.
- **Safety**: No `any`. Zod for all form inputs.
- **Server Actions**:

  ```typescript
  // actions/production.ts
  'use server'
  export async function reportProgress(id: number, amount: number) {
      // 1. Validate
      // 2. Call Backend API (or DB direct if unified) -> In this case, Call .NET API?
      // WAIT. We have a separate .NET Backend.
      // So Next.js Server Actions act as a Proxy/BFF to .NET API.

      const res = await fetch(`${API_URL}/allocations/${id}/report`, { ... });
      if (!res.ok) throw new Error("Failed");
      revalidateTag('allocations');
  }
  ```

## 3. Workflow Rules

1. **Migrations**: `dotnet ef migrations add Name`.
2. **Icons**: Use `lucide-react`.
3. **Format**: `dotnet format` and `npm run lint`.
