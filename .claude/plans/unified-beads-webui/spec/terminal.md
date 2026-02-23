# Terminal Integration Specification

This document specifies the terminal integration for agent session management in the Unified Beads WebUI.

---

## Overview

The terminal integration provides:
- Embedded terminal using xterm.js
- Agent session launch and monitoring
- Real-time output streaming via PTY
- Session persistence and resumption

---

## xterm.js Integration

### Core Setup

```typescript
// src/lib/terminal/xterm.ts
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { Unicode11Addon } from 'xterm-addon-unicode11';

interface TerminalConfig {
  fontSize: number;
  fontFamily: string;
  theme: TerminalTheme;
  scrollback: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  cursorBlink: boolean;
}

const DEFAULT_CONFIG: TerminalConfig = {
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
  theme: {
    background: '#1a1a2e',
    foreground: '#e4e4e7',
    cursor: '#f4f4f5',
    cursorAccent: '#1a1a2e',
    selectionBackground: '#3b3b5c',
    black: '#27272a',
    red: '#ef4444',
    green: '#22c55e',
    yellow: '#eab308',
    blue: '#3b82f6',
    magenta: '#a855f7',
    cyan: '#06b6d4',
    white: '#f4f4f5',
    brightBlack: '#52525b',
    brightRed: '#f87171',
    brightGreen: '#4ade80',
    brightYellow: '#facc15',
    brightBlue: '#60a5fa',
    brightMagenta: '#c084fc',
    brightCyan: '#22d3ee',
    brightWhite: '#ffffff',
  },
  scrollback: 10000,
  cursorStyle: 'block',
  cursorBlink: true,
};

function createTerminal(container: HTMLElement, config?: Partial<TerminalConfig>): TerminalInstance {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const terminal = new Terminal({
    fontSize: mergedConfig.fontSize,
    fontFamily: mergedConfig.fontFamily,
    theme: mergedConfig.theme,
    scrollback: mergedConfig.scrollback,
    cursorStyle: mergedConfig.cursorStyle,
    cursorBlink: mergedConfig.cursorBlink,
    allowProposedApi: true,
  });

  // Add-ons
  const fitAddon = new FitAddon();
  const webLinksAddon = new WebLinksAddon();
  const searchAddon = new SearchAddon();
  const unicode11Addon = new Unicode11Addon();

  terminal.loadAddon(fitAddon);
  terminal.loadAddon(webLinksAddon);
  terminal.loadAddon(searchAddon);
  terminal.loadAddon(unicode11Addon);
  terminal.unicode.activeVersion = '11';

  terminal.open(container);
  fitAddon.fit();

  return {
    terminal,
    fitAddon,
    searchAddon,
    dispose: () => terminal.dispose(),
  };
}
```

### Terminal Instance Interface

```typescript
interface TerminalInstance {
  terminal: Terminal;
  fitAddon: FitAddon;
  searchAddon: SearchAddon;
  dispose: () => void;
}

interface TerminalDrawer {
  // State
  isOpen: boolean;
  height: number;
  activeSessionId: string | null;

  // Methods
  open(): void;
  close(): void;
  toggle(): void;
  resize(height: number): void;

  // Terminal operations
  write(data: string): void;
  writeln(data: string): void;
  clear(): void;
  focus(): void;

  // Search
  search(term: string): void;
  searchNext(): void;
  searchPrevious(): void;

  // Session
  attachSession(sessionId: string): void;
  detachSession(): void;
}
```

---

## node-pty Integration

### Native Dependency Handling

node-pty requires native compilation. Handle platform-specific builds:

```typescript
// src/lib/terminal/pty.ts
import * as pty from 'node-pty';

interface PTYConfig {
  shell: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  cols: number;
  rows: number;
}

const PLATFORM_SHELLS: Record<string, { shell: string; args: string[] }> = {
  darwin: { shell: '/bin/zsh', args: ['-l'] },
  linux: { shell: '/bin/bash', args: ['-l'] },
  win32: { shell: 'powershell.exe', args: [] },
};

function createPTY(config: Partial<PTYConfig>): pty.IPty {
  const platform = process.platform;
  const defaults = PLATFORM_SHELLS[platform] || PLATFORM_SHELLS.linux;

  return pty.spawn(config.shell || defaults.shell, config.args || defaults.args, {
    name: 'xterm-256color',
    cwd: config.cwd || process.cwd(),
    env: { ...process.env, ...config.env },
    cols: config.cols || 80,
    rows: config.rows || 24,
  });
}
```

### Build Configuration

```json
// package.json - native dependency handling
{
  "optionalDependencies": {
    "node-pty": "^1.0.0"
  },
  "scripts": {
    "postinstall": "node scripts/rebuild-native.js"
  }
}
```

```javascript
// scripts/rebuild-native.js
const { execSync } = require('child_process');

try {
  // Rebuild native modules for current platform
  execSync('npm rebuild node-pty', { stdio: 'inherit' });
} catch (e) {
  console.warn('node-pty rebuild failed. Terminal features may be limited.');
  console.warn('Error:', e.message);
}
```

### Fallback Mode (No PTY)

When node-pty is unavailable, fall back to non-interactive mode:

```typescript
interface FallbackTerminal {
  // Captures stdout/stderr without PTY
  spawn(command: string, args: string[]): ChildProcess;

  // Streams output to terminal display
  onData(callback: (data: string) => void): void;

  // No input support in fallback mode
  readonly interactive: false;
}

async function createTerminalBackend(): Promise<PTYBackend | FallbackBackend> {
  try {
    const pty = await import('node-pty');
    return { type: 'pty', module: pty };
  } catch (e) {
    console.warn('node-pty not available, using fallback mode');
    return { type: 'fallback' };
  }
}
```

---

## Agent Session Management

### Session Lifecycle

```
┌─────────┐    launch()    ┌──────────┐    complete/fail    ┌───────────┐
│ PENDING │───────────────▶│ RUNNING  │────────────────────▶│ COMPLETED │
└─────────┘                └────┬─────┘                     └───────────┘
                                │                                  │
                           pause()                            retry()
                                │                                  │
                                ▼                                  ▼
                          ┌──────────┐                       ┌─────────┐
                          │ PAUSED   │──────resume()────────▶│ PENDING │
                          └──────────┘                       └─────────┘
                                │
                           terminate()
                                │
                                ▼
                          ┌───────────┐
                          │ TERMINATED│
                          └───────────┘
```

### Session Data Model

```typescript
interface AgentSession {
  id: string;
  issueId: string;
  worktree: string | null;

  // State
  status: SessionStatus;
  startedAt: Date;
  endedAt: Date | null;
  duration: number;  // milliseconds

  // Process
  pid: number | null;
  exitCode: number | null;

  // Claude-specific
  claudeSessionId: string | null;
  planId: string | null;

  // Output
  outputPath: string;  // File path for persisted output
  outputSize: number;  // Bytes

  // Verification
  verificationStatus: 'pending' | 'approved' | 'rejected' | null;
  verificationItems: string[];  // VerificationItem IDs

  // Retry tracking
  retryCount: number;
  parentSessionId: string | null;  // If this is a retry
}

type SessionStatus =
  | 'pending'
  | 'starting'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'terminated';
```

### Session Manager

```typescript
// src/lib/agents/manager.ts
class AgentSessionManager extends EventEmitter {
  private sessions = new Map<string, AgentSession>();
  private ptyProcesses = new Map<string, pty.IPty>();
  private outputBuffers = new Map<string, CircularBuffer>();

  constructor(
    private supervisor: ProcessSupervisor,
    private config: SessionManagerConfig
  ) {
    super();
  }

  async launch(options: LaunchOptions): Promise<AgentSession> {
    const session = this.createSession(options);

    // Start PTY process
    const ptyProcess = createPTY({
      cwd: options.worktree || process.cwd(),
      env: this.buildEnv(options),
    });

    // Connect output to buffer and broadcast
    ptyProcess.onData((data) => {
      this.bufferOutput(session.id, data);
      this.emit('output', { sessionId: session.id, data });
    });

    ptyProcess.onExit(({ exitCode }) => {
      this.handleExit(session.id, exitCode);
    });

    // Execute agent command
    const command = this.buildAgentCommand(options);
    ptyProcess.write(command + '\r');

    this.ptyProcesses.set(session.id, ptyProcess);
    this.sessions.set(session.id, session);

    return session;
  }

  async pause(sessionId: string): Promise<void> {
    const process = this.ptyProcesses.get(sessionId);
    if (process) {
      // Send SIGTSTP to pause
      process.kill('SIGTSTP');
      this.updateStatus(sessionId, 'paused');
    }
  }

  async resume(sessionId: string): Promise<void> {
    const process = this.ptyProcesses.get(sessionId);
    if (process) {
      // Send SIGCONT to resume
      process.kill('SIGCONT');
      this.updateStatus(sessionId, 'running');
    }
  }

  async terminate(sessionId: string): Promise<void> {
    const process = this.ptyProcesses.get(sessionId);
    if (process) {
      process.kill();
      this.updateStatus(sessionId, 'terminated');
    }
  }

  private buildAgentCommand(options: LaunchOptions): string {
    // Build claude command with issue context
    const args = ['claude'];

    if (options.prompt) {
      args.push('--print', options.prompt);
    }

    if (options.autoApprove) {
      args.push('--dangerously-skip-permissions');
    }

    return args.join(' ');
  }
}
```

### Output Buffering

```typescript
// Circular buffer for output with size limit
class CircularBuffer {
  private buffer: string[] = [];
  private totalSize = 0;
  private readonly maxSize: number;

  constructor(maxSize = 10 * 1024 * 1024) {  // 10MB default
    this.maxSize = maxSize;
  }

  append(data: string): void {
    this.buffer.push(data);
    this.totalSize += data.length;

    // Trim from front if over limit
    while (this.totalSize > this.maxSize && this.buffer.length > 1) {
      const removed = this.buffer.shift()!;
      this.totalSize -= removed.length;
    }
  }

  getAll(): string {
    return this.buffer.join('');
  }

  clear(): void {
    this.buffer = [];
    this.totalSize = 0;
  }
}
```

---

## Session Persistence

### Storage Strategy

Sessions and their outputs are persisted to disk:

```
.beads/
├── sessions/
│   ├── index.jsonl           # Session metadata (append-only)
│   ├── <session-id>/
│   │   ├── meta.json         # Session metadata
│   │   ├── output.txt        # Raw terminal output
│   │   ├── output.ansi       # ANSI-formatted output
│   │   └── plan.json         # Claude plan (if available)
│   └── ...
└── ...
```

### Retention Policy

```typescript
interface RetentionPolicy {
  maxAge: number;           // Max session age in days (default: 30)
  maxSize: number;          // Max total storage in bytes (default: 1GB)
  maxSessions: number;      // Max sessions to keep (default: 1000)
  keepFailed: boolean;      // Keep failed sessions longer (default: true)
  keepVerified: boolean;    // Keep verified sessions indefinitely (default: true)
}

async function cleanupSessions(policy: RetentionPolicy): Promise<CleanupResult> {
  const sessions = await listSessions();
  const now = Date.now();
  const toDelete: string[] = [];

  for (const session of sessions) {
    const age = now - session.endedAt.getTime();
    const ageDays = age / (1000 * 60 * 60 * 24);

    // Skip protected sessions
    if (policy.keepVerified && session.verificationStatus === 'approved') continue;
    if (policy.keepFailed && session.status === 'failed' && ageDays < policy.maxAge * 2) continue;

    // Delete old sessions
    if (ageDays > policy.maxAge) {
      toDelete.push(session.id);
    }
  }

  // Delete sessions
  for (const id of toDelete) {
    await deleteSession(id);
  }

  return { deleted: toDelete.length };
}
```

### Resume from Persistence

```typescript
async function resumeSession(sessionId: string): Promise<AgentSession> {
  const session = await loadSession(sessionId);

  if (session.status !== 'paused') {
    throw new Error(`Cannot resume session in ${session.status} state`);
  }

  // Restore terminal output
  const output = await readSessionOutput(sessionId);

  // Recreate PTY with restored state
  const ptyProcess = createPTY({
    cwd: session.worktree || process.cwd(),
    env: await loadSessionEnv(sessionId),
  });

  // Write previous output to terminal for context
  // (Claude maintains its own session state)

  return {
    ...session,
    status: 'running',
  };
}
```

---

## Security Model

### Process Isolation

```typescript
interface SecurityConfig {
  // Sandbox options
  sandbox: boolean;
  allowedPaths: string[];      // Paths agent can access
  deniedPaths: string[];       // Explicitly denied paths

  // Network
  allowNetwork: boolean;
  allowedHosts: string[];

  // Process
  maxMemory: number;           // Memory limit in bytes
  maxCPU: number;              // CPU percentage limit
  timeout: number;             // Max session duration in ms
}

const DEFAULT_SECURITY: SecurityConfig = {
  sandbox: true,
  allowedPaths: [
    process.cwd(),             // Project directory
    '/tmp',                    // Temp files
  ],
  deniedPaths: [
    '~/.ssh',                  // SSH keys
    '~/.aws',                  // AWS credentials
    '~/.config/gh',            // GitHub tokens
  ],
  allowNetwork: true,
  allowedHosts: ['*'],         // All hosts allowed
  maxMemory: 2 * 1024 * 1024 * 1024,  // 2GB
  maxCPU: 80,                  // 80%
  timeout: 30 * 60 * 1000,     // 30 minutes
};
```

### Session Tokens

```typescript
interface SessionToken {
  sessionId: string;
  userId: string;
  issuedAt: Date;
  expiresAt: Date;
  scopes: SessionScope[];
}

type SessionScope =
  | 'read:output'      // Read session output
  | 'write:input'      // Send input to session
  | 'control:pause'    // Pause/resume session
  | 'control:terminate' // Terminate session
  | 'verify:approve'   // Approve verification items
  | 'verify:reject';   // Reject verification items

function createSessionToken(
  sessionId: string,
  userId: string,
  scopes: SessionScope[]
): string {
  // JWT token with session-specific claims
  return jwt.sign(
    { sessionId, userId, scopes },
    process.env.SESSION_SECRET,
    { expiresIn: '24h' }
  );
}
```

### WebSocket Authentication

```typescript
// Authenticate WebSocket connections for session output
function authenticateSessionWS(
  ws: WebSocket,
  token: string
): SessionToken | null {
  try {
    const decoded = jwt.verify(token, process.env.SESSION_SECRET);
    return decoded as SessionToken;
  } catch (e) {
    ws.close(4001, 'Invalid token');
    return null;
  }
}
```

---

## API Endpoints

### Sessions

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/sessions` | GET | List sessions (with filters) |
| `/api/agents/sessions` | POST | Launch new session |
| `/api/agents/sessions/[id]` | GET | Get session details |
| `/api/agents/sessions/[id]/output` | GET | Get session output |
| `/api/agents/sessions/[id]/pause` | POST | Pause session |
| `/api/agents/sessions/[id]/resume` | POST | Resume session |
| `/api/agents/sessions/[id]/terminate` | POST | Terminate session |
| `/api/agents/sessions/[id]/input` | POST | Send input to session |

### WebSocket

| Endpoint | Protocol | Description |
|----------|----------|-------------|
| `/ws/sessions/[id]` | WebSocket | Stream session output |

### WebSocket Messages

```typescript
// Server -> Client
interface OutputMessage {
  type: 'output';
  sessionId: string;
  data: string;
  timestamp: number;
}

interface StatusMessage {
  type: 'status';
  sessionId: string;
  status: SessionStatus;
  exitCode?: number;
}

// Client -> Server
interface InputMessage {
  type: 'input';
  sessionId: string;
  data: string;
}

interface ResizeMessage {
  type: 'resize';
  sessionId: string;
  cols: number;
  rows: number;
}
```

---

## Error Handling

### Error Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| `PTY_UNAVAILABLE` | node-pty not installed | Use fallback mode |
| `SESSION_NOT_FOUND` | Session doesn't exist | Refresh session list |
| `SESSION_ENDED` | Session already completed | View output only |
| `PERMISSION_DENIED` | Insufficient scope | Request additional permissions |
| `TIMEOUT` | Session exceeded time limit | Review output, retry |
| `OOM` | Out of memory | Reduce memory usage |
| `SPAWN_FAILED` | Failed to start process | Check Claude CLI |

### Error Recovery

```typescript
async function handleSessionError(
  sessionId: string,
  error: SessionError
): Promise<void> {
  const session = await getSession(sessionId);

  switch (error.code) {
    case 'TIMEOUT':
      // Save output and mark as failed
      await saveSessionOutput(sessionId);
      await updateSession(sessionId, {
        status: 'failed',
        errorCode: 'TIMEOUT',
        errorMessage: 'Session exceeded time limit'
      });
      break;

    case 'OOM':
      // Kill process and save partial output
      await terminateSession(sessionId);
      await updateSession(sessionId, {
        status: 'failed',
        errorCode: 'OOM',
        errorMessage: 'Out of memory'
      });
      break;

    case 'SPAWN_FAILED':
      // Log error and notify user
      await updateSession(sessionId, {
        status: 'failed',
        errorCode: 'SPAWN_FAILED',
        errorMessage: error.message
      });
      break;
  }

  // Emit error event
  emit('session:error', { sessionId, error });
}
```

---

## Accessibility

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `` ` `` (backtick) | Toggle terminal drawer |
| `Ctrl+Shift+T` | Open new session |
| `Ctrl+Shift+K` | Clear terminal |
| `Ctrl+Shift+F` | Search in terminal |
| `Ctrl+C` | Send interrupt to session |
| `Ctrl+D` | Send EOF to session |
| `Escape` | Close search / exit focus |

### Screen Reader Support

- Terminal output has `role="log"` with `aria-live="polite"`
- Session status announced via `aria-live="assertive"`
- Search results announced with count
- Focus management when drawer opens/closes

---

## Performance Requirements

| Metric | Target | Maximum |
|--------|--------|---------|
| Output latency | < 50ms | 100ms |
| Render 1000 lines | < 100ms | 200ms |
| Memory per session | < 50MB | 100MB |
| Drawer open time | < 100ms | 200ms |
| Search response | < 100ms | 500ms |

---

## References

- [Phase 4: Agent Orchestration](../phase/04-agent-orchestration.md)
- [CLI Integration](./cli-integration.md)
- [xterm.js Documentation](https://xtermjs.org/docs/)
- [node-pty Documentation](https://github.com/microsoft/node-pty)
- [foolery Reference](../references/foolery/README.md)
