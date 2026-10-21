# 🧹 Vibe-Clean

> **Safe, Cross-Platform System Hygiene & Zombie Process Killer for AI Coding Agents**  
> *Built for Claude Code, Cursor, OpenAI Codex, Antigravity, and Aider.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![skills.sh](https://img.shields.io/badge/skills.sh-vibe--clean-ff69b4.svg)](https://skills.sh)

---

## 💡 The Problem

Autonomous AI coding agents think in immediate steps: *"run this test", "start this dev server", "execute this background watcher"*. 

However, when you close a chat session or switch tasks, **those child processes are often left running invisibly as zombies**. Within a few hours of Vibe Coding:
* Your RAM shoots to 90%+ with 30+ lingering `node` or `python` processes.
* Your laptop fans spin continuously.
* Your SSD loses 20+ GB to forgotten git worktrees and temporary build artifacts.

**`vibe-clean` is the automated antidote:** a zero-dependency, safe system hygiene engine that reclaims your machine's speed without closing your browser tabs or terminating your active IDE.

---

## ⚡ 1-Click Install via `skills.sh`

Add directly to your AI agent of choice:

```bash
npx skills add Gabrielrtads/vibe-clean
```

---

## 🛠️ The 5 Pillars of Vibe-Clean

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VIBE-CLEAN ARCHITECTURE                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│      1. RAM       │      2. DISK      │        3. CODE HYGIENE         │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Zombie Hunter   │ • Git Worktrees   │ • Subprocess Timeout Auditor   │
│ • Orphan Detection│ • Stale Sessions  │ • Sidebar Pollution Blocker    │
│ • Protected Trees │ • Reversible Quar │ • Infinite Loop Spotter        │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 1. `auditar` — Instant Diagnostic (Read-Only)
Inspects RAM, worktree size, session storage, and scans your repository scripts for dangerous un-timed subprocesses in less than 3 seconds:
```bash
node scripts/vibe-clean.mjs auditar
```

### 2. `zumbis` — Surgical Zombie Slayer
Kills orphaned AI processes while protecting your active IDE (Cursor, VS Code, Antigravity) and web browsers:
```bash
node scripts/vibe-clean.mjs zumbis --confirmar
```

### 3. `limpar` — Safe Cleanup with Reversible Quarantine
Isolates stale AI logs and temporary files older than 5 days into a reversible quarantine directory:
```bash
node scripts/vibe-clean.mjs limpar --dias 5
```

### 4. `expurgar` — Permanent SSD Recovery
Permanently purges quarantined archives to return storage to your disk:
```bash
node scripts/vibe-clean.mjs expurgar --confirmar-destruicao
```

---

## 🤝 Ecosystem Synergy (100% Optional)

`vibe-clean` is **100% standalone** and requires zero external npm packages or dependencies.

If you also need safe, collision-free Git worktree lifecycle management for pair-programming agents, check out:
* 🛡️ [**Gabrielrtads/vibe-dev**](https://github.com/Gabrielrtads/vibe-dev) — Git worktree governance, snapshot-driven safety & clean branch delivery.

*They complement each other seamlessly: `vibe-dev` protects your Git repository, while `vibe-clean` protects your operating system.*

---

## 📄 License

MIT © [Gabriel Toledo](https://github.com/Gabrielrtads)

---
⭐ **If this tool saved your RAM, consider giving it a star on [GitHub](https://github.com/Gabrielrtads/vibe-clean)!**
