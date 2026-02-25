# Phase 6: Advanced Data Access

**Duration**: 3-4 weeks
**Theme**: Performance optimization and embedded database support

## Objectives

1. Implement Dolt native FFI bindings for embedded access (no server required)
2. Add query caching layer for improved performance
3. Enhance FederatedDAL with advanced federation features
4. Implement time-travel queries for Dolt backends

---

## Phase 5 Entry Gate

Before starting Phase 6, verify Phase 5 completion:

- [ ] All Phase 5 Must-Have features complete
- [ ] FederatedDAL basic implementation working (from 5.12)
- [ ] Multi-source configuration tested
- [ ] Gas-Town integration stable
- [ ] Unit test coverage > 70%

---

## Success Criteria

| Criterion | Measurement | Verification |
|-----------|-------------|--------------|
| Dolt FFI works | Embedded queries execute without server | Integration test |
| Query caching | 50% reduction in repeated query latency | Performance benchmark |
| Time-travel | Can query historical data by commit | E2E test |
| Memory usage | FFI doesn't leak memory over 1000 queries | Memory profiling |
| Test coverage | > 70% for new code | Vitest coverage |

---

## Complexity Scale

| Score | Effort | Description |
|-------|--------|-------------|
| 1 | 0.5-1 day | Simple component or utility |
| 2 | 1-2 days | Component with state/logic |
| 3 | 2-4 days | Complex component or integration |
| 4 | 4-7 days | Major feature or system |
| 5 | 1-2 weeks | Large cross-cutting feature |

---

## Features

### 6.1 Dolt Native FFI Bindings

**Priority**: Should-Have | **Complexity**: 5 | **Source**: New

Embed Dolt database access directly in Node.js without requiring a separate server process.

**Technical Reference**: [Dolt Native FFI Research](../references/dolt-native-ffi.md)

**Approach**: CGO shared library with Node.js N-API bindings

```
┌─────────────────────────────────────────────────────────┐
│                    Node.js Application                   │
├─────────────────────────────────────────────────────────┤
│                  N-API Addon (C/C++)                     │
├─────────────────────────────────────────────────────────┤
│               CGO Shared Library (.so/.dylib)            │
├─────────────────────────────────────────────────────────┤
│                 dolthub/go-mysql-server                  │
│                   dolthub/dolt/go                        │
└─────────────────────────────────────────────────────────┘
```

**Deliverables**:
- [ ] Go CGO wrapper library (`libdolt.go`)
- [ ] C header file with exported functions
- [ ] Node.js N-API addon (`dolt-native.node`)
- [ ] TypeScript bindings (`dolt-native.d.ts`)
- [ ] Build scripts for macOS, Linux (arm64, x64)
- [ ] Integration with FederatedDAL as `dolt-native` adapter

**CGO Wrapper Functions**:
```go
// Required exports
DoltOpen(dbPath string) (*DoltDB, error)
DoltClose(db *DoltDB) error
DoltQuery(db *DoltDB, sql string) (*QueryResult, error)
DoltExec(db *DoltDB, sql string) (int64, error)  // For writes
DoltGetBranch(db *DoltDB) (string, error)
DoltCheckout(db *DoltDB, branch string) error
DoltAsOf(db *DoltDB, commitHash string) (*DoltDB, error)
```

**Acceptance Criteria**:
- Can open `.dolt` database directory directly
- Executes SQL queries without MySQL server
- Memory is properly freed after queries
- Works on macOS arm64 and Linux x64
- Performance comparable to or better than mysql2

**Testing Requirements**:

*Unit Tests*:
- [ ] Opens valid .dolt directory
- [ ] Rejects invalid paths gracefully
- [ ] Executes SELECT queries
- [ ] Returns typed results
- [ ] Handles query errors

*Integration Tests*:
- [ ] Concurrent query execution
- [ ] Memory stability over 1000 queries
- [ ] Branch switching
- [ ] Time-travel queries

---

### 6.2 Query Caching Layer

**Priority**: Should-Have | **Complexity**: 3 | **Source**: New

In-memory cache for frequently executed queries to reduce database load.

```typescript
// src/lib/db/cache.ts
interface QueryCache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): void;
  invalidate(pattern: string): void;
  invalidateAll(): void;
}

interface CacheConfig {
  maxSize: number;        // Max entries
  defaultTTL: number;     // Default TTL in ms
  staleWhileRevalidate: boolean;
}
```

**Deliverables**:
- [ ] LRU cache implementation
- [ ] TTL-based expiration
- [ ] Pattern-based invalidation
- [ ] Cache warming on startup
- [ ] Cache statistics/metrics

**Acceptance Criteria**:
- Repeated identical queries hit cache
- Cache respects TTL
- Write operations invalidate relevant cache entries
- Cache size stays within configured limits

---

### 6.3 Time-Travel Queries

**Priority**: Should-Have | **Complexity**: 3 | **Source**: Dolt feature

Query historical data using Dolt's versioning capabilities.

```typescript
// src/lib/db/timetravel.ts
interface TimeTravelOptions {
  asOf?: string;          // Commit hash or timestamp
  branch?: string;        // Branch name
  beforeCommit?: string;  // Query state before this commit
}

// Usage
const oldIssues = await dal.getIssues(filter, { asOf: 'abc123' });
const branchIssues = await dal.getIssues(filter, { branch: 'feature-x' });
```

**Deliverables**:
- [ ] `AS OF` query support for Dolt backend
- [ ] Branch switching for queries
- [ ] Commit history browser API
- [ ] Diff between commits/branches
- [ ] UI components for time navigation

**Acceptance Criteria**:
- Can query data at any past commit
- Can compare data between branches
- Works with both Dolt server and FFI backends
- Gracefully degrades for SQLite (not supported)

---

### 6.4 Advanced Federation Features

**Priority**: Could-Have | **Complexity**: 4 | **Source**: ADR-0022

Extend FederatedDAL with advanced capabilities.

**Deliverables**:
- [ ] Cross-source joins (limited)
- [ ] Source health monitoring
- [ ] Automatic failover between sources
- [ ] Source-specific query optimization
- [ ] Federation statistics/metrics

**Acceptance Criteria**:
- Can join data from multiple sources (client-side)
- Detects and reports source failures
- Automatically routes around failed sources
- Provides visibility into federation performance

---

## Technical Architecture

### FFI Integration with FederatedDAL

```typescript
// src/lib/db/adapters/dolt-native.ts
import { DoltNative } from 'dolt-native';

class DoltNativeAdapter implements SourceAdapter {
  private db: DoltNative;

  constructor(config: { dbPath: string }) {
    this.db = new DoltNative(config.dbPath);
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    return this.db.query(sql, params);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  // Time-travel support
  async queryAsOf<T>(sql: string, commit: string): Promise<T[]> {
    return this.db.queryAsOf(sql, commit);
  }
}
```

### Build System

```bash
# Build CGO library
cd packages/dolt-native
make build-go        # Builds libdolt.so/dylib
make build-node      # Builds dolt-native.node
make test            # Runs native tests

# Platform-specific builds
make build-macos-arm64
make build-linux-x64
```

---

## Dependencies

### From Previous Phases
- FederatedDAL (Phase 5.12)
- DataAccessLayer (Phase 1.2)
- ProcessSupervisor (Phase 1.1)

### External
| Dependency | Version | Purpose |
|------------|---------|---------|
| dolthub/dolt | latest | Dolt Go libraries |
| node-addon-api | ^7.0 | N-API helpers |
| prebuild | ^12.0 | Cross-platform builds |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| CGO complexity | Start with minimal API, expand gradually |
| Cross-platform builds | Use prebuild for binary distribution |
| Memory leaks | Extensive testing, valgrind on Linux |
| Dolt API changes | Pin to specific Dolt version |
| Performance regression | Benchmark against mysql2 baseline |

---

## Testing Strategy

### Test Distribution

| Type | Focus |
|------|-------|
| Unit (50%) | FFI bindings, cache logic, time-travel queries |
| Integration (30%) | Multi-source queries, failover, concurrent access |
| Performance (15%) | Latency benchmarks, memory profiling |
| E2E (5%) | Full stack with FFI backend |

### FFI-Specific Tests

```typescript
// Native binding tests
describe('DoltNative', () => {
  it('opens database directory', async () => {
    const db = new DoltNative('.beads/dolt/beads_projx');
    expect(db.isOpen()).toBe(true);
  });

  it('executes queries', async () => {
    const result = await db.query('SELECT * FROM issues LIMIT 1');
    expect(result).toHaveLength(1);
  });

  it('handles concurrent queries', async () => {
    const queries = Array(100).fill('SELECT 1');
    const results = await Promise.all(queries.map(q => db.query(q)));
    expect(results).toHaveLength(100);
  });
});
```

---

## Deliverables Checklist

| Component | Priority | Complexity | Effort | Status |
|-----------|----------|------------|--------|--------|
| Dolt FFI CGO Wrapper | Should-Have | 5 | 5 days | Pending |
| Node.js N-API Addon | Should-Have | 4 | 3 days | Pending |
| TypeScript Bindings | Should-Have | 2 | 1 day | Pending |
| Cross-platform Builds | Should-Have | 3 | 2 days | Pending |
| Query Caching Layer | Should-Have | 3 | 2 days | Pending |
| Time-Travel Queries | Should-Have | 3 | 2 days | Pending |
| Advanced Federation | Could-Have | 4 | 3 days | Pending |

**Total Effort**: ~18 days (fits in 3-4 week timeline with buffer)

---

## Exit Criteria

- [ ] Dolt FFI bindings work on macOS and Linux
- [ ] Query caching reduces latency by 50%+ for repeated queries
- [ ] Time-travel queries work for Dolt backends
- [ ] All features integrate with FederatedDAL
- [ ] Unit test coverage > 70%
- [ ] No memory leaks detected in profiling
- [ ] Documentation complete

---

## References

- [ADR-0022: Federated DAL](../../../../docs/src/adrs/0022-federated-data-access-layer-for-multi-source-support.md)
- [Dolt Native FFI Research](../references/dolt-native-ffi.md)
- [Federated DAL Reference](../references/federated-dal.md)
- [Dolt Go Package](https://pkg.go.dev/github.com/dolthub/dolt/go)
- [Node-API Documentation](https://nodejs.org/api/n-api.html)
