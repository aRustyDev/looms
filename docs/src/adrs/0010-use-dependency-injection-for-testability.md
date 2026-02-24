---
number: 10
title: Use Dependency Injection for Testability
status: accepted
date: 2026-02-24
tags:
  - testing
  - architecture
  - patterns
deciders:
  - aRustyDev
---

# Use Dependency Injection for Testability

## Context and Problem Statement

The application includes modules that depend on native Node.js addons (better-sqlite3), external processes (bd CLI), and other system-level dependencies. These dependencies are difficult to mock using standard module mocking approaches (vi.mock) due to ESM hoisting issues and native module constraints. We need a testability strategy that allows comprehensive unit testing without complex mocking infrastructure.

## Decision Drivers

* **Native modules**: better-sqlite3 doesn't work with vi.mock due to native bindings
* **Process execution**: child_process.exec needs isolation in tests
* **ESM compatibility**: vi.mock hoisting doesn't work reliably with ESM
* **Test speed**: Unit tests should run without external dependencies
* **Production code**: Testability shouldn't add significant runtime complexity
* **Type safety**: Injected dependencies should be fully typed

## Considered Options

* **Dependency Injection** - Pass dependencies as constructor/function parameters
* **Module mocking (vi.mock)** - Standard Vitest mocking
* **Integration tests only** - Test with real dependencies
* **Wrapper modules** - Thin wrappers around native modules

## Decision Outcome

Chosen option: **Dependency Injection**, because it provides the most reliable testability for native modules while keeping production code clean and type-safe.

### Consequences

* Good, because tests are completely isolated from native modules
* Good, because mock implementations are explicit and type-checked
* Good, because test setup is simple and readable
* Good, because no vi.mock hoisting issues
* Good, because production code can use default implementations
* Neutral, because requires optional constructor/function parameters
* Bad, because slightly more verbose API signatures
* Bad, because developers must remember to inject in tests

### Confirmation

* ProcessSupervisor tests use injected ExecFunction mock
* All tests run without native module compilation
* Type errors if mock signature doesn't match

## Pros and Cons of the Options

### Dependency Injection

Pass dependencies as parameters with defaults for production.

```typescript
export type ExecFunction = (
  command: string,
  args: string[],
  options: { timeout: number; maxBuffer: number; windowsHide: boolean }
) => Promise<{ stdout: string; stderr: string }>;

export class ProcessSupervisor {
  constructor(
    config: Partial<ProcessSupervisorConfig> = {},
    execFn?: ExecFunction  // Optional: defaults to real exec
  ) {
    this.exec = execFn ?? this.createDefaultExec();
  }
}
```

* Good, because completely bypasses native module issues
* Good, because mock signatures are type-checked at compile time
* Good, because test setup is explicit and readable
* Good, because no magic or special test utilities needed
* Good, because default parameters make production usage clean
* Neutral, because adds parameters to constructors/functions
* Bad, because requires upfront design consideration

### Module Mocking (vi.mock)

Use Vitest's built-in module mocking.

```typescript
vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => ({ /* mock implementation */ }))
}));
```

* Good, because standard Vitest pattern
* Good, because no production code changes
* Good, because works for simple modules
* Bad, because ESM hoisting issues with vi.mock
* Bad, because native modules (better-sqlite3) fail to mock
* Bad, because importOriginal often doesn't work as expected
* Bad, because error messages are confusing

### Integration Tests Only

Test with real dependencies in integration environment.

* Good, because tests real behavior
* Good, because no mocking complexity
* Good, because finds integration issues
* Bad, because slow (database, CLI operations)
* Bad, because requires test fixtures and cleanup
* Bad, because can't test error paths easily
* Bad, because CI requires dependency setup

### Wrapper Modules

Create thin wrappers around native dependencies.

```typescript
// db/sqlite-wrapper.ts
export function createDatabase(path: string) {
  const Database = require('better-sqlite3');
  return new Database(path);
}
```

* Good, because centralizes native module usage
* Good, because wrapper can be mocked
* Neutral, because adds indirection layer
* Bad, because still needs mocking strategy for wrapper
* Bad, because doesn't solve the fundamental mocking problem
* Bad, because extra files to maintain

## More Information

### Implementation Pattern

```typescript
// Type definition for injectable dependency
export type ExecFunction = (
  command: string,
  args: string[],
  options: ExecOptions
) => Promise<ExecResult>;

// Class with optional dependency injection
export class ProcessSupervisor {
  private exec: ExecFunction;

  constructor(config: Config = {}, execFn?: ExecFunction) {
    this.exec = execFn ?? this.createDefaultExec();
  }

  private createDefaultExec(): ExecFunction {
    return async (command, args, options) => {
      const { execFile } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execFileAsync = promisify(execFile);
      return execFileAsync(command, args, options);
    };
  }
}
```

### Test Pattern

```typescript
describe('ProcessSupervisor', () => {
  it('executes commands successfully', async () => {
    const mockExec = vi.fn().mockResolvedValue({
      stdout: 'test output',
      stderr: ''
    });

    const supervisor = new ProcessSupervisor({}, mockExec);
    const result = await supervisor.execute('bd', ['list']);

    expect(mockExec).toHaveBeenCalledWith(
      'bd',
      ['list'],
      expect.any(Object)
    );
    expect(result.stdout).toBe('test output');
  });
});
```

### When to Use Each Pattern

| Scenario | Pattern |
|----------|---------|
| Native modules (better-sqlite3) | Dependency Injection |
| Process execution (child_process) | Dependency Injection |
| Pure TypeScript modules | vi.mock or DI |
| External APIs | Dependency Injection |
| Complex class hierarchies | Dependency Injection |

### References

* [ProcessSupervisor implementation](../../src/lib/cli/supervisor.ts)
* [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
* [Martin Fowler - Dependency Injection](https://martinfowler.com/articles/injection.html)
