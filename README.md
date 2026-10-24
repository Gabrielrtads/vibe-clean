# 🧹 Vibe-Clean

[![GitHub stars](https://img.shields.io/github/stars/Gabrielrtads/vibe-clean?style=social)](https://github.com/Gabrielrtads/vibe-clean/stargazers)

> ⭐ **If this tool saved you time or empowered your AI agents, please star this repository! It helps more developers discover the project.**

> **Safe, Cross-Platform System Hygiene & Zombie Process Killer for AI Coding Agents**  
> *Built for Claude Code, Cursor, OpenAI Codex, Antigravity, and Aider.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![skills.sh](https://img.shields.io/badge/skills.sh-vibe--clean-ff69b4.svg)](https://skills.sh)

---

## 💡 The Problem

Autonomous AI coding agents think in immediate steps: *"run this test", "start this dev server", "execute this background watcher"*. 

However, when you close a chat session or switch tasks, **those child processes are often left running invisibly as zombies**. Within a few hours of Vibe Coding:
* Your RAM shoots to 90%+ with 30+ lingering `node` or `python` processes.
* Dev ports (`3000`, `5173`, `8000`) get locked, throwing annoying `EADDRINUSE` errors.
* Your laptop fans spin continuously.
* Your SSD loses 20+ GB to forgotten git worktrees and temporary build artifacts.

**`vibe-clean` is the automated antidote:** a zero-dependency, 100% pure Node.js system hygiene engine that reclaims your machine's speed without closing your browser tabs, killing active agents, or terminating your IDE.

---

## ⚡ 1-Click Install via `skills.sh`

Add directly to your AI agent of choice:

```bash
npx skills add Gabrielrtads/vibe-clean
```

---

## 🛠️ The 6 Pillars of Vibe-Clean

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VIBE-CLEAN ARCHITECTURE                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│      1. RAM       │  2. DEV PORTS     │      3. DISK & WORKTREES       │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Zombie Hunter   │ • Port Unblocker  │ • Safe Worktree Pruning        │
│ • Multi-Agent Tree│ • CDP Protected   │ • Reversible Quarantine        │
│ • Claude/Codex/AGY│ • 3000/5173/8000  │ • 100% Pure Node.js (Zero Py)  │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 1. `auditar` — Instant Diagnostic (Read-Only)
Inspects RAM, dev ports, worktree sizes, session storage, and scans your repository scripts for dangerous un-timed subprocesses in less than 3 seconds:
```bash
node scripts/vibe-clean.mjs auditar
```

### 2. `portas` — Surgical Port Hunter & Unblocker
Detects hung servers on ports `3000` (Next.js/React), `5173` (Vite), and `8000` (FastAPI/Python), while strictly protecting the user's visual browser on port `9222` (CDP):
```bash
node scripts/vibe-clean.mjs portas [--liberar]
```

### 3. `mesas` — Safe Worktree Management
Inspects `.worktrees` for uncommitted changes (`git status`) and safely dismantles completed workspaces that have 0 pending commits:
```bash
node scripts/vibe-clean.mjs mesas [--limpar-concluidas]
```

### 4. `zumbis` — Multi-Agent Aware Zombie Slayer
Kills orphaned AI processes while shielding the complete process tree of **Claude Code, OpenAI Codex, Antigravity, and active IDEs**:
```bash
node scripts/vibe-clean.mjs zumbis --confirmar
```

### 5. `limpar` — 100% Node.js Safe Cleanup with Reversible Quarantine
Isolates stale AI logs and temporary files older than 5 days into a reversible quarantine directory with full rollback manifest:
```bash
node scripts/vibe-clean.mjs limpar [--dias 5]
```

### 6. `expurgar` — Permanent SSD Recovery
Permanently purges quarantined archives to return storage to your disk:
```bash
node scripts/vibe-clean.mjs expurgar --confirmar-destruicao
```

---

## 🤝 Ecosystem Synergy (100% Optional)

`vibe-clean` is **100% standalone** and requires zero external npm packages, compilers, or Python runtimes.

If you also need safe, collision-free Git worktree lifecycle management for pair-programming agents, check out:
* 🛡️ [**Gabrielrtads/vibe-dev**](https://github.com/Gabrielrtads/vibe-dev) — Git worktree governance, snapshot-driven safety & clean branch delivery.

*They complement each other seamlessly: `vibe-dev` protects your Git repository, while `vibe-clean` protects your operating system.*

---

## 📄 License

MIT © [Gabriel Toledo](https://github.com/Gabrielrtads)

---
⭐ **If this tool saved your RAM, consider giving it a star on [GitHub](https://github.com/Gabrielrtads/vibe-clean)!**
