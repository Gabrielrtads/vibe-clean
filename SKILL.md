---
name: vibe-clean
version: 1.1.0
category: devops
description: "The OS hygiene & zombie process killer for Vibe-Coders. Eliminates zombie processes (node, python, ffmpeg) eating RAM, frees stuck dev ports (3000, 5173, 8000), prunes orphaned Git worktrees, and cleans disk junk. / Guardião da ordem e faxina do sistema operacional no Vibe Coding. Trigger with /vibe-clean, /faxina, 'limpar zumbis', 'liberar portas', 'kill zombies', 'free ports', or 'clean worktrees'."
tags: [vibe-clean, vibe-coding, zombie-processes, memory-cleaner, port-killer, git-worktrees, disk-cleanup, devops, system-hygiene, claude-code, codex, antigravity]
---

# Vibe-Clean: Guardião da Ordem, Higiene do Sistema e Prevenção de Zumbis

O Gabriel utiliza a abordagem de **100% Vibe Coding** (programação guiada por intenção, delegada para a IA). Ele não é desenvolvedor e não deve carregar a carga cognitiva de caçar PIDs, monitorar memória RAM vazando, destravar portas locais presas ou limpar lixo no SSD.

Enquanto a skill irmã `vibe-dev` cuida da integridade do **código** (mesas Git isoladas), a skill **`vibe-clean`** cuida da integridade do **sistema operacional** (impede que o desleixo de agentes de IA transforme o computador em um depósito de processos zumbis, portas travadas e arquivos mortos).

---

## 1. Os 6 Pilares do Vibe-Clean

| Pilar | O que a IA costuma abandonar | O que o Vibe-Clean faz |
|---|---|---|
| **1. Memória RAM** | Processos zumbis (`node.exe`, `python.exe`, `whisper`, `ffmpeg`) que continuam rodando após tarefas | Localiza e encerra cirurgicamente apenas os zumbis, protegendo a IDE e servidores MCP ativos |
| **2. Portas de Dev** | Servidores locais presos nas portas `3000`, `5173`, `8000`, `9222` impedindo novos testes | Caçador de portas cirúrgico: protege o navegador visual do usuário e libera portas travadas em 1 comando |
| **3. Disco (SSD)** | Mesas de trabalho Git (`.worktrees/`) esquecidas que acumulam gigabytes | Audita e desmonta com segurança mesas concluídas com 0 commits pendentes (`--limpar-concluidas`) |
| **4. Sessões de IA** | Arquivos `.lock`, logs headless e sessões antigas | **100% Node.js hermético**: move arquivos órfãos com mais de 5 dias para quarentena reversível com manifesto |
| **5. Barra Lateral** | Centenas de projetos fantasmas repetidos poluem a interface da IDE | Mantém a trava `--project default-cli-project` e isola arquivos de projetos fantasmas automaticamente |
| **6. Higiene de Scripts** | Subprocessos sem timeout ou comandos perigosos criados por agentes | Auditor estático que aponta scripts com risco de gerar zumbis eternos ou inchaço |

---

## 2. Comandos Canônicos do Sistema

Todos os comandos rodam a partir da raiz do workspace:

### 1. Raio-X do Sistema (`auditar`)
Diagnóstico completo e seguro em menos de 3 segundos, sem alterar nenhum arquivo:
```bash
node scripts/vibe-clean.mjs auditar
```
*(Nota: `node scripts/faxina.mjs auditar` também funciona como alias transparente).*

### 2. Caçador de Portas Presas (`portas`)
Inspeciona ou libera as portas de desenvolvimento (3000, 5173, 8000, 9222):
```bash
node scripts/vibe-clean.mjs portas [--liberar]
```

### 3. Liberação Imediata de Memória RAM (`zumbis`)
Mata processos zumbis de IA que ficaram pendurados:
```bash
node scripts/vibe-clean.mjs zumbis --confirmar
```

### 4. Gestão e Desmontagem Rápida de Mesas Git (`mesas`)
Audita ou desmonta mesas concluídas e limpas (0 commits pendentes):
```bash
node scripts/vibe-clean.mjs mesas [--limpar-concluidas]
```

### 5. Faxina Geral Segura 100% Node.js (`limpar`)
Executa a higienização completa com proteção de quarentena reversível e manifesto transacional:
```bash
node scripts/vibe-clean.mjs limpar [--dias 5]
```

### 6. Expurgo Definitivo de Espaço (`expurgar`)
Exclui a pasta de quarentena e devolve gigabytes para o SSD:
```bash
node scripts/vibe-clean.mjs expurgar --confirmar-destruicao
```

---

## 3. Sinergia de Ecossistema (100% Opcional)

* **Código & Git:** [`vibe-dev`](https://github.com/Gabrielrtads/vibe-dev) (Governança de mesas Git)
* **Sistema & RAM:** [`vibe-clean`](https://github.com/Gabrielrtads/vibe-clean) (Higiene do sistema operacional)
*(Cada ferramenta é 100% independente e não exige a instalação da outra).*
