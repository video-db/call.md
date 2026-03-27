# Agent Guidelines for Call.md

This document provides guidance for agentic coding agents working in this repository.

## Project Overview

Call.md is a real-time AI meeting assistant built with Electron 34, TypeScript 5.8, React 19, and Tailwind CSS. It captures screen/audio, transcribes meetings in real-time, and provides AI-powered insights including sentiment analysis, cue cards, nudges, and post-meeting summaries.

## Build/Lint/Test Commands

```bash
# Install dependencies
npm install

# Rebuild native modules for Electron (required after install)
npm run rebuild

# Development
npm run dev              # Start main + renderer in dev mode
npm run dev:renderer     # Start only renderer dev server

# Building
npm run build           # Full production build (renderer + main)
npm run build:main      # Build main process only
npm run build:renderer  # Build renderer only

# Quality
npm run typecheck       # TypeScript type checking (main + renderer)
npm run lint            # ESLint on src directory

# Distribution
npm run dist            # Build for distribution (all platforms)
npm run dist:mac        # Build for macOS only

# Database
npm run db:generate     # Generate Drizzle migrations
npm run db:migrate       # Apply Drizzle migrations
```

**No test framework is currently configured.** If adding tests, use Vitest for the renderer and Jest for the main process.

## Code Style Guidelines

### TypeScript Configuration

- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **Strict mode**: Enabled (`strict: true`)
- **No implicit any**: All variables must have explicit types
- **Path aliases**: Use `@shared/*`, `@main/*`, `@renderer/*` instead of relative imports where appropriate

### Imports

**Order imports by:**
1. Node.js built-ins (`node:` prefix when possible)
2. External packages (alphabetical)
3. Internal packages (path aliases first, then relative)
4. Type imports (`import type { ... }` for types only)
5. Local relative imports

```typescript
// Good
import { ipcMain } from 'electron';
import type { SomeType } from 'some-package';
import { logger } from '../lib/logger';
import type { Config } from '../../shared/types';
import { Button } from './components/ui/button';
import { cn } from '@/renderer/lib/utils';

// Bad - no type import separation, wrong order
import { Button } from './components/ui/button';
import { ipcMain } from 'electron';
```

**React imports**: Use named imports for React hooks, but `import * as React from 'react'` for component types.

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `session-store.ts`, `recording-card.tsx` |
| React Components | PascalCase | `RecordingCard`, `LiveAssistPanel` |
| TypeScript Interfaces | PascalCase with descriptive suffix | `SessionState`, `StartRecordingParams` |
| TypeScript Types | PascalCase | `RecordingStatus`, `CopilotMetrics` |
| Enums | PascalCase | `RecordingStatus`, `SessionStatus` |
| Functions | camelCase, verb-first for actions | `startSession()`, `handleTabChange()` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| CSS classes | Tailwind utility classes preferred | N/A |
| Database columns | snake_case | `session_id`, `created_at` |
| IPC channel names | kebab-case with colon prefix | `recorder-start-recording`, `copilot:transcript` |

### React Patterns

**Component structure:**
```tsx
// Use forwardRef for components that accept refs
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

**Hooks patterns:**
```typescript
// Custom hooks use camelCase starting with 'use'
export function useSession() { ... }
export function useCopilotStore() { ... }

// Event subscription cleanup - return unsubscribe function
export function useGlobalRecorderEvents() {
  React.useEffect(() => {
    const unsubscribe = window.electronAPI.on.recorderEvent(handleEvent);
    return () => unsubscribe();
  }, [handleEvent]);
}
```

**Store patterns (Zustand):**
```typescript
interface SessionState {
  status: SessionStatus;
  // State fields first
  setStatus: (status: SessionStatus) => void;
  // Actions after state
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
  // Use get() for computed values from state
  isTokenExpired: () => {
    const { tokenExpiresAt } = get();
    return !tokenExpiresAt || Date.now() / 1000 > tokenExpiresAt - 300;
  },
}));
```

### Database Patterns (Drizzle ORM)

```typescript
// Schema: Use snake_case column names
export const recordings = sqliteTable('recordings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  status: text('status', { enum: ['recording', 'processing', 'available', 'failed'] })
    .notNull()
    .default('recording'),
});

// Type exports: InferSelect and InferInsert
export type Recording = typeof recordings.$inferSelect;
export type NewRecording = typeof recordings.$inferInsert;

// Indexes for performance
}, (table) => ({
  sessionIdx: index('idx_recordings_session').on(table.sessionId),
}));
```

### IPC Communication

**Pattern for IPC handlers (main process):**
```typescript
// In ipc/*.ts files
ipcMain.handle('channel-name', async (event, param: ParamType): Promise<ReturnType> => {
  // Validate input first
  if (!param) {
    throw new Error('Invalid parameter');
  }
  // Handle and return
  return result;
});
```

**Pattern for IPC event listeners (renderer):**
```typescript
const unsubscribe = window.electronAPI.on.recorderEvent((data) => {
  // Handle event
});
// Always cleanup
React.useEffect(() => {
  return () => unsubscribe();
}, []);
```

**Type-safe IPC**: All IPC types are defined in `src/shared/types/ipc.types.ts`. The preload script (`src/preload/index.ts`) exposes `window.electronAPI` with full TypeScript types.

### Error Handling

**Main process services:**
```typescript
import { logger } from '../lib/logger';

async function someServiceMethod(): Promise<ResultType> {
  try {
    const result = await doSomething();
    log.info({ result }, 'Operation completed');
    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    log.error({ error, errMsg }, 'Operation failed');
    return { success: false, error: errMsg };
  }
}
```

**Renderer error states:**
```typescript
// Use ErrorToast component for global errors
<ErrorToast message={error} onDismiss={() => setError(null)} />

// Store errors in Zustand
setError: (error) => set({ error }),
```

### Logging

Use pino logger with child loggers:
```typescript
import { logger, createChildLogger } from '../lib/logger';

const log = createChildLogger('module-name');
// or
const log = logger.child({ module: 'module-name' });

log.info({ context }, 'Message');
log.error({ error, param }, 'Error occurred');
```

**Log levels**: `debug` (dev only), `info` (production), `warn`, `error`.

### Zod Schemas

Define validation schemas in `src/shared/schemas/`:
```typescript
import { z } from 'zod';

export const RecordingSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum(['recording', 'processing', 'available', 'failed']),
});

export type Recording = z.infer<typeof RecordingSchema>;
```

### Service Classes

Use singleton pattern for services that need global state:
```typescript
export class LLMService {
  private static instance: LLMService | null = null;

  static getInstance(config?: Partial<LLMConfig>): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService(config);
    }
    return LLMService.instance;
  }

  static resetInstance(): void {
    LLMService.instance = null;
  }
}
```

### Class Variance Authority (CVA)

For component variants, use CVA:
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('base-class', {
  variants: {
    variant: {
      default: 'bg-primary',
      destructive: 'bg-destructive',
    },
    size: {
      default: 'h-9 px-4',
      sm: 'h-8 px-3',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});
```

### Tailwind CSS

**Class organization**: Use logical grouping
```tsx
<div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg border">
```

**Custom colors**: Use CSS custom properties from `tailwind.config.ts`
```tsx
className="bg-[#ec5b16]"  // Only when design system color not available
className="text-primary"   // Use design system colors
```

### tRPC Patterns

**Main process (tRPC server):**
```typescript
import { initTRPC, TRPCError } from '@trpc/server';

const t = initTRPC.context<TrpcContext>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { user: ctx.user } });
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
```

## Project Structure Reference

```
src/
├── main/                    # Electron main process
│   ├── db/                  # Drizzle schema + connection
│   ├── ipc/                 # IPC handler modules
│   ├── lib/                 # Utilities (logger, config, paths)
│   ├── server/              # HTTP server (Hono + tRPC)
│   │   └── trpc/           # tRPC router and procedures
│   ├── services/           # Business logic services
│   │   ├── copilot/        # AI copilot services
│   │   └── mcp/            # MCP orchestration
│   └── utils/              # Helper utilities
├── preload/                 # Context bridge (window.electronAPI)
├── renderer/                # React frontend
│   ├── api/                # tRPC client hooks
│   ├── components/         # UI components
│   │   ├── ui/            # shadcn/ui base components
│   │   ├── copilot/       # Copilot UI
│   │   ├── recording/     # Recording UI
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities
│   └── stores/            # Zustand stores
└── shared/                  # Shared between processes
    ├── schemas/            # Zod schemas
    └── types/             # TypeScript types
```

## Security Considerations

- Never expose secrets in logs (API keys, tokens)
- Validate all IPC input before processing
- Use `safeStorage` for sensitive data encryption
- Always use context isolation in Electron windows
- Sanitize external data before use
