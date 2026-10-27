# 🧹 Vibe-Clean

> **The OS Hygiene & Zombie Process Killer for AI Coding Agents.**  
> *(Eliminates lingering RAM zombies, frees stuck dev ports, and prunes orphaned worktrees across Windows, macOS & Linux).*

[![skills.sh compatible](https://img.shields.io/badge/skills.sh-vibe--clean-6366f1?style=for-the-badge)](https://skills.sh)
[![Zero-Dependency](https://img.shields.io/badge/Dependencies-Zero-emerald?style=for-the-badge)](#)
[![Cross-Platform](https://img.shields.io/badge/OS-Windows_|_macOS_|_Linux-blue?style=for-the-badge)](#)
[![Vibe Coding Ready](https://img.shields.io/badge/Vibe_Coding-100%25_Friendly-ff007f?style=for-the-badge)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Gabrielrtads/vibe-clean?style=social)](https://github.com/Gabrielrtads/vibe-clean/stargazers)

```bash
# ⚡ 1-Click Install via skills.sh (Claude Code / Codex / Antigravity):
npx skills add Gabrielrtads/vibe-clean

# Or audit system health immediately without touching any files:
node scripts/vibe-clean.mjs auditar
```

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

---

<div align="center">

### ⭐ Impressed with Vibe-Clean?
If this tool rescued your RAM or freed your stuck dev ports, please star the repository!  
It helps other autonomous agent developers discover the project.

[![Star on GitHub](https://img.shields.io/github/stars/Gabrielrtads/vibe-clean?style=social)](https://github.com/Gabrielrtads/vibe-clean/stargazers)

---

**Built with pride by [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads)**  
*Creator of [Barber.fi](https://painel.barberfi.com.br), `vibe-design-studio`, `sta`, `kage-bunshin`, and `agent-log`.*

Licensed under [MIT](LICENSE).

</div>
