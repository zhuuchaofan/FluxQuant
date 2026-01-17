# FluxQuant Architecture & Coding Standards

> **Living Document**: This file defines the structural and stylistic rules for the project.

## 1. System Architecture

### 1.1 Backend: .NET 10 Web API (Minimal API / REPR)

We follow the **REPR (Request-Endpoint-Response)** Pattern using Minimal APIs.

```
FluxQuant.Server/
├── Features/               # Vertical Slices
│   ├── Production/         # Feature
│   │   ├── CreatePool/     # Slice
│   │   │   ├── Endpoint.cs # Minimal API MapGroup
│   │   │   ├── Request.cs  # DTO
│   │   │   └── Service.cs  # Business Logic
├── Domain/                 # Entities
├── Infrastructure/         # DbContext, External
└── Program.cs
```

**Key Decisions**:

- **Endpoints**: Use `app.MapGroup("/api/v1/pools")` in strictly typed Endpoint classes.
- **No Controllers**: Completely remove `Controllers/` folder.
- **DTOs**: `public record` types co-located with Endpoints or in `Shared/DTOs`.
- **Services**:
  - Return `Task<T>` or `Result<T>`.
  - Handle all business rules.
  - **Transactions**: Multi-table updates (e.g., Log + Snapshot) MUST be wrapped in `using var transaction = _dbContext.Database.BeginTransaction()`.
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
  - **Integration Tests**: `FluxQuant.Server.IntegrationTests` using **Testcontainers**.
    - **Rule**: No SQLite In-Memory. Must use real PostgreSQL container to ensure 100% environment parity.
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

### 1.5 Global Error Handling

- **Standard**: RFC 7807 `ProblemDetails`.
- **Backend**: Use `app.UseExceptionHandler()` to Map Exceptions -> ProblemDetails.
- **Frontend**: Server Actions must catch non-2xx responses and throw structured errors or return `{ success: false, error: ... }`.

### 1.6 BFF Authentication Flow

- **Next.js -> .NET**: 必须透传 Auth Token。

  ```typescript
  import { cookies } from "next/headers";

  export async function callApi(path: string) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    return fetch(`${API_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  ```

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
- **Validation**:
  - **Input Validation**: Use `FluentValidation` for complex DTOs appropriately.
  - **Business Rules**: Check in Service layer (Result Pattern).
- **Endpoints (Minimal API)**:
  ```csharp
  public class CreatePoolEndpoint : ICarterModule
  {
      public void AddRoutes(IEndpointRouteBuilder app)
      {
          app.MapPost("/api/v1/pools", async (CreatePoolRequest req, PoolService service) => {
              var result = await service.CreateAsync(req);
              return result.Match(TypedResults.Ok, TypedResults.BadRequest);
          });
      }
  }
  ```

### 2.3 Frontend (TSX)

- **Naming**: `PascalCase` for Components. `useCamelCase` for Hooks. `camelCase` for props.
- **Safety**:
  - **No `any`**.
  - **Zod Validation**: ALL Server Actions MUST validate input using `zod.safeParse()` before processing.
  - **Shared Schemas**: Store schemas in `lib/validations/*.ts` to be reusable.
- **Server Actions**:

  ```typescript
  // actions/production.ts
  "use server";
  import { reportSchema } from "@/lib/validations/report";

  export async function reportProgress(data: unknown) {
    // 1. Validate
    const parsed = reportSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message };
    }

    // 2. Call Backend API
    const res = await fetch(`${API_URL}/allocations/report`, {
      body: JSON.stringify(parsed.data),
    });
    // ...
  }
  ```

### 2.4 Testing Standards

- **Backend**:
  - **Project**: `FluxQuant.Tests` (xUnit).
  - **Coverage**: Core Services (Auth, Matrix) MUST be covered.
  - **Fixtures**: Use `InMemoryDbContextFactory` for fast isolation testing.
- **Frontend**:
  - **Lint**: `npm run lint` must pass 0 errors.

## 3. Workflow Rules

1. **Migrations**: `dotnet ef migrations add Name`.
2. **Icons**: Use `lucide-react`.
3. **Format**: `dotnet format` and `npm run lint`.
