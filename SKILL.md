---
name: vibe-clean
description: Safe, cross-platform system hygiene and zombie process killer for AI coding agents (Claude Code, Cursor, Codex, Antigravity, Aider). Cleans orphaned RAM processes, forgotten Git worktrees, stale logs, and audits scripts for unsafe subcommands.
category: devops
---

# Vibe-Clean: Safe System Hygiene & Zombie Process Killer for AI Coding

`vibe-clean` protects your local operating system (Windows, macOS, Linux) from background resource leaks caused by autonomous AI coding agents (Claude Code, Cursor, Codex, Antigravity, Aider).

AI agents frequently spawn background dev servers, watchers, compilers, or child scripts that never terminate when conversations close, resulting in 90%+ RAM usage, noisy fans, and gigabytes of wasted SSD storage.

---

## 1. Core Capabilities (The 5 Pillars)

1. **RAM & Zombie Hunter (`zumbis`):** Surgically detects and terminates orphaned AI child processes (`node`, `python`, `whisper`, `ffmpeg`) while strictly protecting your active IDE and web browsers.
2. **Disk & Worktree Health (`auditar`):** Audits forgotten Git worktrees, reporting storage consumption and stale branches.
3. **Session & Cache Cleaner (`limpar`):** Moves headless session logs, lock files, and stale AI artifacts (> 5 days) to a reversible quarantine directory with 1-click rollback.
4. **Permanent SSD Space Recovery (`expurgar`):** Safely purges quarantined storage to permanently reclaim SSD space.
5. **Toxic Script Auditor (Static Hygiene):** Scans repository automation scripts for hazardous anti-patterns:
   * Subprocesses missing a `timeout` argument (which lead to eternal zombie locks on network/I/O drops).
   * Unsafe flags like `--new-project` in Antigravity CLI that bloat the IDE sidebar.

---

## 2. Canonical Usage

Run from the root of any project or repository:

### 1. Transparent System X-Ray (Read-Only)
```bash
node scripts/vibe-clean.mjs auditar
```

### 2. Immediate RAM Recovery
```bash
node scripts/vibe-clean.mjs zumbis --confirmar
```

### 3. Safe Cleanup with Reversible Quarantine
```bash
node scripts/vibe-clean.mjs limpar [--dias 5]
```

### 4. Permanent SSD Purge
```bash
node scripts/vibe-clean.mjs expurgar --confirmar-destruicao
```

---

## 3. Recommended Companions (100% Optional)

`vibe-clean` is **100% standalone and has zero dependencies**. 

If you also want collision-free Git worktree governance and snapshot-driven safety for multi-agent pair programming, check out our companion skill:
👉 [**vibe-dev**](https://github.com/Gabrielrtads/vibe-dev)

---
⭐ **Enjoying vibe-clean?** Leave a star on [GitHub](https://github.com/Gabrielrtads/vibe-clean) to support the open-source agent ecosystem!
