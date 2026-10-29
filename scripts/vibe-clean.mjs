#!/usr/bin/env node
/**
 * scripts/vibe-clean.mjs
 * -----------------------
 * Vibe-Clean: Guardião da Ordem, Higiene do Sistema e Prevenção de Zumbis para Vibe Coding.
 * 
 * Uso:
 *   node scripts/vibe-clean.mjs auditar                        (Raio-X transparente de RAM, Disco, Portas e Scripts)
 *   node scripts/vibe-clean.mjs zumbis [--confirmar]           (Lista ou encerra processos órfãos na RAM)
 *   node scripts/vibe-clean.mjs portas [--liberar]             (Inspeciona ou libera portas 3000, 5173, 8000, 9222)
 *   node scripts/vibe-clean.mjs mesas [--limpar-concluidas]    (Audita ou desmonta com segurança mesas sem commits)
 *   node scripts/vibe-clean.mjs limpar [--dias 5]              (Executa faxina segura 100% Node.js com quarentena)
 *   node scripts/vibe-clean.mjs expurgar --confirmar-destruicao (Exclui quarentenas antigas para liberar SSD)
 * 
 * Repo: https://github.com/Gabrielrtads/vibe-clean
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKTREES_DIR = path.join(ROOT_DIR, ".worktrees");
const CLI_DIR = path.join(os.homedir(), ".gemini", "antigravity-cli");
const APP_STORAGE_PATH = path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "Antigravity", "app_storage.json");
const PROJECTS_CONFIG_DIR = path.join(os.homedir(), ".gemini", "config", "projects");
const ARQUIVO_DIR = path.join(ROOT_DIR, "_arquivo");
const PROTECTED_PROJECT_FILES = new Set([
  "ed974f37-3914-446e-a2a4-53a72a61df74.json",
  "default-cli-project.json",
  "outside-of-project.json"
]);

const DEV_PORTS = [3000, 5173, 8000, 9222];
const IS_WINDOWS = os.platform() === "win32";

function execPwshJson(command) {
  try {
    const raw = execFileSync("powershell", ["-NoProfile", "-Command", command], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      maxBuffer: 25 * 1024 * 1024
    }).trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    throw new Error(`Falha na consulta de processos do sistema: ${err.message}`);
  }
}

function getFolderSize(dirPath, excludePattern = null) {
  let totalBytes = 0;
  let fileCount = 0;
  if (!fs.existsSync(dirPath)) return { sizeMB: 0, fileCount: 0 };

  function walk(current) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        if (excludePattern && excludePattern.test(entry.name)) continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          fileCount++;
          try {
            totalBytes += fs.statSync(full).size;
          } catch {}
        }
      }
    } catch {}
  }

  walk(dirPath);
  return {
    sizeMB: Math.round((totalBytes / (1024 * 1024)) * 10) / 10,
    fileCount
  };
}

function findProcesses() {
  if (!IS_WINDOWS) {
    // Implementação POSIX (Linux/macOS)
    try {
      const raw = execSync("ps -eo pid,ppid,comm,args", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const lines = raw.trim().split("\n").slice(1);
      const all = [];
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          all.push({
            ProcessId: parseInt(parts[0], 10),
            ParentProcessId: parseInt(parts[1], 10),
            Name: parts[2],
            CommandLine: parts.slice(3).join(" "),
            WorkingSetSize: 0
          });
        }
      }
      return { totalTargetProcesses: all.length, protectedCount: 0, zombies: [], zombieRamMB: 0, allProcesses: all };
    } catch {
      return { totalTargetProcesses: 0, protectedCount: 0, zombies: [], zombieRamMB: 0, allProcesses: [] };
    }
  }

  const psCmd = `Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine, WorkingSetSize | ConvertTo-Json -Compress`;
  const all = execPwshJson(psCmd);
  const { targets, zombies, protectedPids } = classificarProcessos(all, process.pid);

  const zombieRamMB = Math.round(zombies.reduce((acc, p) => acc + (p.WorkingSetSize || 0), 0) / (1024 * 1024));

  return {
    totalTargetProcesses: targets.length,
    protectedCount: protectedPids.size,
    zombies,
    zombieRamMB,
    allProcesses: all
  };
}

/**
 * Classificação pura (testável) da tabela de processos do Windows.
 * Um processo só é zumbi se o PID pai NÃO existe mais na tabela: nunca por
 * conter uma palavra na linha de comando, pois isso mataria processos com pai vivo.
 */
export function classificarProcessos(all, selfPid) {
  const pidMap = new Map(all.map(p => [p.ProcessId, p]));

  // 1. Identificar PIDs raiz protegidos de TODOS os agentes e ferramentas do enxame:
  // - Antigravity IDE & CLI (language_server, agy.exe, antigravity)
  // - Claude Code (claude.exe, claude)
  // - OpenAI Codex (codex.exe, codex, codex-*)
  // - IDEs e Terminais ativos (code.exe, cursor.exe, windsurf.exe, pwsh.exe, powershell.exe, wt.exe)
  const agentRoots = all.filter(p => {
    const name = (p.Name || "").toLowerCase();
    const cmd = (p.CommandLine || "").toLowerCase();
    return (
      name.includes("language_server") ||
      name.includes("claude") ||
      name.includes("codex") ||
      name.includes("agy") ||
      name.includes("cursor") ||
      name.includes("code.exe") ||
      name.includes("windsurf") ||
      name === "pwsh.exe" ||
      name === "powershell.exe" ||
      name === "wt.exe" ||
      cmd.includes("claude") ||
      cmd.includes("codex") ||
      cmd.includes("language_server")
    );
  });

  // 2. Coletar transitivamente toda a árvore de filhos e netos (MCPs, subtasks, testes em andamento)
  const protectedPids = new Set(agentRoots.map(p => p.ProcessId));
  let added = true;
  while (added) {
    added = false;
    for (const p of all) {
      if (!protectedPids.has(p.ProcessId) && protectedPids.has(p.ParentProcessId)) {
        protectedPids.add(p.ProcessId);
        added = true;
      }
    }
  }

  // 3. Identificar processos alvo (node, python, agy, whisper, ffmpeg)
  const targets = [];
  const zombies = [];

  for (const p of all) {
    const name = (p.Name || "").toLowerCase();

    const isTarget = name.includes("node.exe") || name.includes("python.exe") || name.includes("agy.exe") || name.includes("whisper") || name.includes("ffmpeg.exe");
    if (!isTarget) continue;

    targets.push(p);

    // Se estiver protegido pela árvore do Claude, Codex, Gemini ou IDEs, NUNCA toca
    if (protectedPids.has(p.ProcessId)) continue;

    // Se for o próprio processo atual do Node, pula
    if (p.ProcessId === selfPid) continue;

    // Único critério de órfão: ParentProcessId não existe mais na tabela de processos ativos do SO
    if (!pidMap.has(p.ParentProcessId)) {
      zombies.push({ ...p, motivo: "Processo Pai Inexistente (Órfão)" });
    }
  }

  return { targets, zombies, protectedPids };
}

/**
 * CAÇADOR DE PORTAS DE DESENVOLVIMENTO
 * Detecta e protege o navegador visual CDP enquanto libera servidores travados (3000, 5173, 8000).
 */
function inspecionarPortas(allProcs = null) {
  const portasStatus = [];
  const procs = allProcs || (findProcesses().allProcesses || []);
  const pidMap = new Map(procs.map(p => [p.ProcessId, p]));

  if (IS_WINDOWS) {
    try {
      const portQuery = DEV_PORTS.join(",");
      const psCmd = `Get-NetTCPConnection -LocalPort ${portQuery} -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort, OwningProcess | ConvertTo-Json -Compress`;
      const netResults = execPwshJson(psCmd);

      for (const port of DEV_PORTS) {
        const matches = netResults.filter(nr => Number(nr.LocalPort) === port);
        if (matches.length === 0) {
          portasStatus.push({ port, status: "LIVRE", pid: null, name: "-", cmd: "-", isZombie: false, isProtected: false });
        } else {
          for (const m of matches) {
            portasStatus.push(classificarPorta(port, m.OwningProcess, pidMap));
          }
        }
      }
    } catch {
      // Fallback silencioso se WMI/NetTCPConnection falhar
    }
  }

  return portasStatus;
}

/**
 * Classificação pura (testável) de quem ocupa uma porta de dev.
 * Só é "servidor preso" um node/python ÓRFÃO de verdade (PID pai inexistente):
 * um servidor com pai vivo (terminal, npm, IDE) está em uso e nunca é marcado.
 */
export function classificarPorta(port, pid, pidMap) {
  const pInfo = pidMap.get(pid);
  const pName = ((pInfo && pInfo.Name) || "").toLowerCase();
  const pCmd = ((pInfo && pInfo.CommandLine) || "").toLowerCase();

  // Guardrail de Proteção: Navegadores visuais (Chrome, Brave, Edge) na 9222 NUNCA são zumbis
  const isUserBrowser = pName.includes("brave") || pName.includes("chrome") || pName.includes("msedge");
  const isCdpBrowser = port === 9222 && isUserBrowser;

  // Zumbis típicos: node.exe ou python.exe esquecidos segurando a porta de dev, cujo pai já morreu
  const isOrphan = !!pInfo && !pidMap.has(pInfo.ParentProcessId);
  const isZombieDevServer = !isCdpBrowser && isOrphan && (pName.includes("node") || pName.includes("python")) && !pCmd.includes("language_server");

  return {
    port,
    status: isCdpBrowser ? "OCUPADA (NAVEGADOR PRINCIPAL)" : (isZombieDevServer ? "OCUPADA (SERVIDOR PRESO)" : "OCUPADA"),
    pid,
    name: pInfo ? pInfo.Name : "desconhecido",
    cmd: (pInfo && pInfo.CommandLine) || "",
    isZombie: isZombieDevServer,
    isProtected: isCdpBrowser
  };
}

/**
 * Decide quais portas presas podem ser liberadas. A 9222 (CDP) pode ser uma sessão
 * de navegador/automação em uso: só entra com a confirmação extra --incluir-cdp.
 */
export function selecionarPortasParaLiberar(portas, incluirCdp = false) {
  const presas = portas.filter(p => p.isZombie && !p.isProtected);
  return {
    liberar: presas.filter(p => p.port !== 9222 || incluirCdp),
    cdpRetidas: presas.filter(p => p.port === 9222 && !incluirCdp)
  };
}

function listarMesasGit() {
  try {
    const raw = execFileSync("git", ["-C", ROOT_DIR, "worktree", "list", "--porcelain"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true
    }).trim();

    const mesas = [];
    let atual = null;
    for (const linha of raw.split(/\r?\n/)) {
      if (linha.startsWith("worktree ")) mesas.push((atual = { caminho: linha.slice(9), branch: null }));
      else if (linha.startsWith("branch refs/heads/") && atual) atual.branch = linha.slice(18);
    }
    return mesas.filter(m => path.resolve(m.caminho) !== ROOT_DIR);
  } catch {
    return [];
  }
}

/**
 * Auditor de Scripts Tóxicos (Static Code Hygiene & Zombie Prevention)
 */
function auditarScripts() {
  const scriptsDir = path.join(ROOT_DIR, "scripts");
  if (!fs.existsSync(scriptsDir)) return { scanned: 0, alerts: [] };

  const alerts = [];
  let scanned = 0;

  function scanFolder(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "_quarentena") {
          scanFolder(full);
        }
      } else if (entry.isFile() && (entry.name.endsWith(".mjs") || entry.name.endsWith(".js") || entry.name.endsWith(".py") || entry.name.endsWith(".ps1"))) {
        scanned++;
        const content = fs.readFileSync(full, "utf8");
        const lines = content.split(/\r?\n/);
        const relPath = path.relative(ROOT_DIR, full).replace(/\\/g, "/");

        lines.forEach((line, idx) => {
          const lineNum = idx + 1;
          const trimmed = line.trim();

          if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
            return;
          }

          if (line.includes("--new-project") && !line.includes("default-cli-project")) {
            alerts.push({
              file: relPath,
              line: lineNum,
              type: "POLUICAO_SIDEBAR",
              snippet: trimmed.slice(0, 80),
              msg: "Uso de '--new-project' detectado. Pode criar projetos fantasmas na barra lateral. Substitua por '--project default-cli-project'."
            });
          }

          const isNodeExec = line.includes("execSync(") || line.includes("execFileSync(") || line.includes("spawn(");
          if (isNodeExec && !content.includes("timeout") && !line.includes("timeout")) {
            if (!alerts.some(a => a.file === relPath && a.type === "SEM_TIMEOUT")) {
              alerts.push({
                file: relPath,
                line: lineNum,
                type: "SEM_TIMEOUT",
                snippet: trimmed.slice(0, 80),
                msg: "Chamada de subprocesso sem 'timeout' configurado. Se o comando travar, gerará um processo zumbi eterno."
              });
            }
          }

          const isPySubproc = line.includes("subprocess.run(") || line.includes("subprocess.check_output(") || line.includes("subprocess.Popen(");
          if (isPySubproc && !line.includes("timeout=") && !content.includes("timeout=")) {
            if (!alerts.some(a => a.file === relPath && a.type === "SEM_TIMEOUT")) {
              alerts.push({
                file: relPath,
                line: lineNum,
                type: "SEM_TIMEOUT",
                snippet: trimmed.slice(0, 80),
                msg: "subprocess sem 'timeout=' no Python. Risco de processo pendurado na RAM em caso de falha de I/O."
              });
            }
          }
        });
      }
    }
  }

  scanFolder(scriptsDir);
  return { scanned, alerts };
}

function auditar() {
  console.log("\n=======================================================");
  console.log("       RAIO-X DE HIGIENE DO SISTEMA (VIBE-CLEAN)       ");
  console.log("=======================================================");

  let procData = { totalTargetProcesses: 0, protectedCount: 0, zombies: [], zombieRamMB: 0, allProcesses: [] };
  try {
    procData = findProcesses();
    console.log(`\n[1] MEMORIA RAM & PROCESSOS:`);
    console.log(`  - Processos de IA ativos          : ${procData.totalTargetProcesses}`);
    console.log(`  - Processos legitimos protegidos  : ${procData.totalTargetProcesses - procData.zombies.length}`);
    console.log(`  - Processos orfaos confirmados    : ${procData.zombies.length}`);
    console.log(`  - Memoria RAM consumida por orfaos: ${procData.zombieRamMB} MB`);
  } catch (err) {
    console.log(`\n[1] MEMORIA RAM & PROCESSOS:\n  [AVISO] Nao foi possivel consultar WMI: ${err.message}`);
  }

  // 2. Portas de Desenvolvimento
  const portas = inspecionarPortas(procData.allProcesses);
  console.log(`\n[2] PORTAS DE DEV & SERVIDORES LOCAIS:`);
  if (portas.length === 0) {
    console.log(`  - Auditoria de portas indisponivel ou portas livres.`);
  } else {
    for (const p of portas) {
      if (p.status === "LIVRE") {
        console.log(`  - Porta :${p.port.toString().padEnd(5)} : 🟢 LIVRE`);
      } else if (p.isProtected) {
        console.log(`  - Porta :${p.port.toString().padEnd(5)} : 🛡️  PROTEGIDA (Navegador Principal - PID ${p.pid})`);
      } else if (p.isZombie) {
        console.log(`  - Porta :${p.port.toString().padEnd(5)} : ⚠️  PRESA POR ZUMBI (${p.name} - PID ${p.pid})`);
      } else {
        console.log(`  - Porta :${p.port.toString().padEnd(5)} : 🔵 OCUPADA (${p.name} - PID ${p.pid})`);
      }
    }
  }

  // 3. Disco / Mesas Git
  const mesas = listarMesasGit();
  const worktreesStats = getFolderSize(WORKTREES_DIR);
  console.log(`\n[3] DISCO / MESAS DE TRABALHO (.worktrees):`);
  console.log(`  - Mesas ativas detectadas         : ${mesas.length} mesa(s)`);
  console.log(`  - Espaco ocupado em disco         : ${worktreesStats.fileCount} arquivos (${worktreesStats.sizeMB} MB)`);
  if (mesas.length > 0) {
    for (const m of mesas) {
      console.log(`    * ${path.basename(m.caminho)} [${m.branch || "sem branch"}]`);
    }
  }

  // 4. Disco / Sessões CLI & Quarentena
  const cliStats = getFolderSize(CLI_DIR, /^quarentena/);
  const quarStats = getFolderSize(CLI_DIR);
  const diffQuarMB = Math.max(0, Math.round((quarStats.sizeMB - cliStats.sizeMB) * 10) / 10);
  console.log(`\n[4] DISCO / SESSOES DO TERMINAL (~/.gemini/antigravity-cli):`);
  console.log(`  - Arquivos ativos em uso          : ${cliStats.fileCount} arquivos (${cliStats.sizeMB} MB)`);
  if (diffQuarMB > 0) {
    console.log(`  - Arquivos em Quarentena segura   : ${diffQuarMB} MB protegidos`);
  }

  // 5. Barra Lateral & Projetos
  let projectFilesCount = 0;
  let ghostProjectsCount = 0;
  if (fs.existsSync(PROJECTS_CONFIG_DIR)) {
    try {
      const files = fs.readdirSync(PROJECTS_CONFIG_DIR).filter(f => f.endsWith(".json"));
      projectFilesCount = files.length;
      ghostProjectsCount = files.filter(f => !PROTECTED_PROJECT_FILES.has(f)).length;
    } catch {}
  }

  let projectStorageCount = "N/A";
  try {
    if (fs.existsSync(APP_STORAGE_PATH)) {
      const storage = JSON.parse(fs.readFileSync(APP_STORAGE_PATH, "utf8"));
      const pOrder = JSON.parse(storage.projectsOrder || "[]");
      projectStorageCount = pOrder.length;
    }
  } catch {}

  console.log(`\n[5] INTERFACE DA IDE (PROJETOS & BARRA LATERAL):`);
  console.log(`  - Projetos ativos no app_storage  : ${projectStorageCount} projeto(s)`);
  console.log(`  - Arquivos de projeto em disco    : ${projectFilesCount} arquivo(s)`);
  if (ghostProjectsCount > 0) {
    console.log(`  - ⚠️  Projetos fantasmas detectados: ${ghostProjectsCount} arquivo(s) (Risco de duplicação na barra lateral!)`);
  } else {
    console.log(`  - Integridade de projetos         : 100% LIMPO (Zero projetos fantasmas)`);
  }

  // 6. Auditoria Estática de Scripts
  const scriptAudit = auditarScripts();
  console.log(`\n[6] AUDITORIA DE SCRIPTS (HIGIENE DE CÓDIGO):`);
  console.log(`  - Scripts inspecionados em scripts/: ${scriptAudit.scanned} arquivos`);
  if (scriptAudit.alerts.length === 0) {
    console.log(`  - Conformidade de automação       : 100% LIMPO (Zero padrões tóxicos detectados)`);
  } else {
    console.log(`  - ⚠️  Padrões de risco detectados   : ${scriptAudit.alerts.length} alerta(s)`);
    for (const a of scriptAudit.alerts.slice(0, 5)) {
      console.log(`    * [${a.type}] ${a.file}:${a.line} -> ${a.msg}`);
    }
    if (scriptAudit.alerts.length > 5) {
      console.log(`    * ... e mais ${scriptAudit.alerts.length - 5} alertas.`);
    }
  }

  console.log("\n-------------------------------------------------------");
  console.log(`Dica: Para gerenciar portas presas: node scripts/vibe-clean.mjs portas --liberar`);
  console.log(`Para desmontar mesas concluidas   : node scripts/vibe-clean.mjs mesas --limpar-concluidas`);
  console.log(`Para faxina segura de sessoes     : node scripts/vibe-clean.mjs limpar`);
  console.log(`⭐ Repositório oficial: https://github.com/Gabrielrtads/vibe-clean`);
  console.log("=======================================================\n");
}

function gerenciarZumbis(confirmar = false) {
  const procData = findProcesses();
  if (procData.zombies.length === 0) {
    console.log("Nenhum processo orfao detectado na memoria RAM.");
    return;
  }

  console.log(`\nDetectados ${procData.zombies.length} processos orfaos consumindo ${procData.zombieRamMB} MB de RAM:\n`);
  for (const z of procData.zombies) {
    const cmdShort = (z.CommandLine || z.Name || "").slice(0, 70);
    console.log(`  - PID ${String(z.ProcessId).padEnd(6)} | ${z.Name.padEnd(12)} | ${cmdShort} | [${z.motivo}]`);
  }

  if (!confirmar) {
    console.log("\n[AVISO DE SEGURANCA] Nenhum processo foi encerrado.");
    console.log("Para encerrar os processos orfaos listados acima, adicione a flag: --confirmar");
    console.log("Exemplo: node scripts/vibe-clean.mjs zumbis --confirmar\n");
    return;
  }

  console.log(`\nEncerrando ${procData.zombies.length} processos orfaos...`);
  let killed = 0;
  for (const z of procData.zombies) {
    try {
      if (IS_WINDOWS) {
        execSync(`taskkill /F /PID ${z.ProcessId}`, { stdio: "ignore" });
      } else {
        execSync(`kill -9 ${z.ProcessId}`, { stdio: "ignore" });
      }
      killed++;
    } catch {}
  }
  console.log(`SUCESSO: ${killed} processos finalizados. ~${procData.zombieRamMB} MB de RAM liberados!\n`);
}

function gerenciarPortas(liberar = false, incluirCdp = false) {
  const portas = inspecionarPortas();
  console.log("\n=======================================================");
  console.log("       CAÇADOR DE PORTAS DE DEV (VIBE-CLEAN)           ");
  console.log("=======================================================");

  const presas = portas.filter(p => p.isZombie);
  const protegidas = portas.filter(p => p.isProtected);
  const { liberar: liberaveis, cdpRetidas } = selecionarPortasParaLiberar(portas, incluirCdp);

  for (const p of portas) {
    if (p.status === "LIVRE") {
      console.log(`  - Porta :${p.port.toString().padEnd(5)} : 🟢 LIVRE`);
    } else if (p.isProtected) {
      console.log(`  - Porta :${p.port.toString().padEnd(5)} : 🛡️  PROTEGIDA (${p.name} - PID ${p.pid})`);
    } else if (p.isZombie) {
      console.log(`  - Porta :${p.port.toString().padEnd(5)} : ⚠️  PRESA POR ZUMBI (${p.name} - PID ${p.pid}) -> ${p.cmd.slice(0, 60)}`);
    } else {
      console.log(`  - Porta :${p.port.toString().padEnd(5)} : 🔵 OCUPADA (${p.name} - PID ${p.pid})`);
    }
  }

  if (presas.length === 0) {
    console.log("\nNenhuma porta de dev presa por processos zumbis!");
    return;
  }

  if (!liberar) {
    console.log("\n[AVISO DE SEGURANCA] Para liberar as portas presas por processos zumbis, adicione a flag: --liberar");
    console.log("Exemplo: node scripts/vibe-clean.mjs portas --liberar\n");
    return;
  }

  for (const p of cdpRetidas) {
    console.log(`\n[AVISO] Porta :9222 (CDP, PID ${p.pid}) NAO sera liberada: pode ser uma sessao de navegador/automacao em uso.`);
    console.log("Se tiver certeza, repita com a confirmacao extra: node scripts/vibe-clean.mjs portas --liberar --incluir-cdp");
  }

  console.log(`\nLiberando ${liberaveis.length} porta(s) presas...`);
  let freed = 0;
  for (const p of liberaveis) {
    try {
      if (IS_WINDOWS) {
        execSync(`taskkill /F /PID ${p.pid}`, { stdio: "ignore" });
      } else {
        execSync(`kill -9 ${p.pid}`, { stdio: "ignore" });
      }
      console.log(`  - Porta :${p.port} liberada com sucesso (PID ${p.pid} finalizado).`);
      freed++;
    } catch (err) {
      console.error(`  - Erro ao liberar porta :${p.port}: ${err.message}`);
    }
  }
  console.log(`\nSUCESSO: ${freed} porta(s) liberadas!\n`);
}

function gerenciarMesas(limparConcluidas = false) {
  const mesas = listarMesasGit();
  console.log("\n=======================================================");
  console.log("       GESTÃO SEGURA DE MESAS GIT (.WORKTREES)         ");
  console.log("=======================================================");

  if (mesas.length === 0) {
    console.log("Nenhuma mesa Git de trabalho ativa detectada.");
    return;
  }

  const concluidasLimpass = [];

  for (const m of mesas) {
    const nomePasta = path.basename(m.caminho);
    const branch = m.branch || "sem branch";

    // Verificar sujeira
    let isDirty = false;
    let commitsAhead = 0;
    try {
      const statusRaw = execFileSync("git", ["-C", m.caminho, "status", "--porcelain"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      isDirty = statusRaw.length > 0;

      // Verificar commits à frente de origin/main
      const logRaw = execFileSync("git", ["-C", ROOT_DIR, "log", "origin/main.." + branch, "--oneline"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
      commitsAhead = logRaw ? logRaw.split(/\r?\n/).length : 0;
    } catch {}

    const statusMsg = isDirty ? "⚠️  ARQUIVOS NÃO SALVOS (SUJA)" : (commitsAhead > 0 ? `🔵 ${commitsAhead} COMMITS PENDENTES` : "🟢 PRONTA P/ DESMONTAR (0 COMMITS)");
    console.log(`  - ${nomePasta.padEnd(40)} | [${branch}] | ${statusMsg}`);

    if (!isDirty && commitsAhead === 0 && branch.startsWith("task/")) {
      concluidasLimpass.push(m);
    }
  }

  if (concluidasLimpass.length === 0) {
    console.log("\nNenhuma mesa concluída e limpa elegível para desmontagem automática.");
    return;
  }

  console.log(`\nDetectadas ${concluidasLimpass.length} mesa(s) sem alterações pendentes elegíveis para desmontagem.`);

  if (!limparConcluidas) {
    console.log("Para desmontar com segurança e liberar o espaço em disco, use:");
    console.log("  node scripts/vibe-clean.mjs mesas --limpar-concluidas\n");
    return;
  }

  console.log("\nDesmontando mesas concluídas...");
  let count = 0;
  for (const m of concluidasLimpass) {
    try {
      console.log(`  - Desmontando ${m.branch}...`);
      execFileSync("node", ["scripts/mesa.mjs", "desmontar", "--repo", ".", "--branch", m.branch], {
        cwd: ROOT_DIR,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      });
      count++;
    } catch (err) {
      console.error(`    Erro ao desmontar ${m.branch}: ${err.message}`);
    }
  }
  console.log(`\nSUCESSO: ${count} mesa(s) desmontadas com segurança!\n`);
}

/**
 * HERMETISMO 100% NODE.JS: Quarentena de Sessões da CLI
 * Substitui scripts Python externos com manifesto e suporte total a rollback.
 */
function quarentenaSessoesCliNode(dias = 5) {
  if (!fs.existsSync(CLI_DIR)) return "Diretório da CLI não encontrado.";

  const now = Date.now();
  const sessionAgeLimitMs = dias * 24 * 60 * 60 * 1000;
  const lockAgeLimitMs = 2 * 60 * 60 * 1000; // 2 horas para locks

  const candidates = [];

  // 1. Presence locks
  const presenceDir = path.join(CLI_DIR, "presence");
  if (fs.existsSync(presenceDir)) {
    for (const f of fs.readdirSync(presenceDir)) {
      if (f.endsWith(".lock")) {
        const full = path.join(presenceDir, f);
        try {
          const stat = fs.statSync(full);
          if (now - stat.mtimeMs > lockAgeLimitMs) {
            candidates.push({ category: "presence", fullPath: full, name: f, size: stat.size, isDir: false });
          }
        } catch {}
      }
    }
  }

  // 2. Annotations (.pbtxt)
  const annotationsDir = path.join(CLI_DIR, "annotations");
  if (fs.existsSync(annotationsDir)) {
    for (const f of fs.readdirSync(annotationsDir)) {
      if (f.endsWith(".pbtxt")) {
        const full = path.join(annotationsDir, f);
        try {
          const stat = fs.statSync(full);
          if (now - stat.mtimeMs > sessionAgeLimitMs) {
            candidates.push({ category: "annotations", fullPath: full, name: f, size: stat.size, isDir: false });
          }
        } catch {}
      }
    }
  }

  // 3. Brain folders
  const brainDir = path.join(CLI_DIR, "brain");
  if (fs.existsSync(brainDir)) {
    for (const f of fs.readdirSync(brainDir)) {
      if (f === "tempmediaStorage" || f.startsWith("quarentena")) continue;
      const full = path.join(brainDir, f);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory() && (now - stat.mtimeMs > sessionAgeLimitMs)) {
          candidates.push({ category: "brain", fullPath: full, name: f, size: 0, isDir: true });
        }
      } catch {}
    }
  }

  // 4. Conversations (.db*)
  const convDir = path.join(CLI_DIR, "conversations");
  if (fs.existsSync(convDir)) {
    for (const f of fs.readdirSync(convDir)) {
      if (f.includes(".db")) {
        const full = path.join(convDir, f);
        try {
          const stat = fs.statSync(full);
          if (now - stat.mtimeMs > sessionAgeLimitMs) {
            candidates.push({ category: "conversations", fullPath: full, name: f, size: stat.size, isDir: false });
          }
        } catch {}
      }
    }
  }

  if (candidates.length === 0) {
    return "Nenhum arquivo órfão com mais de " + dias + " dias para quarentena.";
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const destDir = path.join(CLI_DIR, `quarentena_${ts}`);
  fs.mkdirSync(destDir, { recursive: true });

  const manifest = {
    timestamp: ts,
    corteDias: dias,
    itensCount: candidates.length,
    itens: []
  };

  let movedCount = 0;
  for (const c of candidates) {
    try {
      const catDestDir = path.join(destDir, c.category);
      fs.mkdirSync(catDestDir, { recursive: true });
      const targetPath = path.join(catDestDir, c.name);
      fs.renameSync(c.fullPath, targetPath);
      manifest.itens.push({ origem: c.fullPath, destino: targetPath, categoria: c.category });
      movedCount++;
    } catch {}
  }

  fs.writeFileSync(path.join(destDir, "manifesto.json"), JSON.stringify(manifest, null, 2), "utf8");
  return `Movidos ${movedCount} itens para quarentena reversível em ${destDir}`;
}

/**
 * HERMETISMO 100% NODE.JS: Quarentena de Projetos Fantasmas
 */
function quarentenaProjetosFantasmasNode() {
  if (!fs.existsSync(PROJECTS_CONFIG_DIR)) return "Diretório de projetos não encontrado.";

  const ghostFiles = [];
  try {
    const files = fs.readdirSync(PROJECTS_CONFIG_DIR).filter(f => f.endsWith(".json"));
    for (const f of files) {
      if (!PROTECTED_PROJECT_FILES.has(f)) {
        ghostFiles.push(f);
      }
    }
  } catch {}

  if (ghostFiles.length === 0) {
    return "Nenhum projeto fantasma detectado para isolar.";
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const destDir = path.join(ARQUIVO_DIR, `quarentena_projetos_config_${ts}`);
  fs.mkdirSync(destDir, { recursive: true });

  const manifest = {
    timestamp: ts,
    total: ghostFiles.length,
    arquivos: []
  };

  let moved = 0;
  for (const f of ghostFiles) {
    try {
      const src = path.join(PROJECTS_CONFIG_DIR, f);
      const dst = path.join(destDir, f);
      fs.renameSync(src, dst);
      manifest.arquivos.push({ origem: src, destino: dst });
      moved++;
    } catch {}
  }

  fs.writeFileSync(path.join(destDir, "manifesto.json"), JSON.stringify(manifest, null, 2), "utf8");
  return `Isolados ${moved} projetos fantasmas para ${destDir}`;
}

function limpar(dias = 5) {
  console.log("\n=======================================================");
  console.log("             INICIANDO FAXINA SEGURA (100% NODE.JS)    ");
  console.log("=======================================================");

  // 1. Quarentena segura de sessões CLI (100% Node.js)
  console.log(`\n[Passo 1/3] Movendo sessoes antigas (> ${dias} dias) para quarentena reversivel...`);
  const resSessoes = quarentenaSessoesCliNode(dias);
  console.log(`  ${resSessoes}`);

  // 2. Quarentena de projetos fantasmas (100% Node.js)
  console.log(`\n[Passo 2/3] Verificando e isolando projetos fantasmas em ~/.gemini/config/projects...`);
  const resProjetos = quarentenaProjetosFantasmasNode();
  console.log(`  ${resProjetos}`);

  // 3. Alerta de mesas Git
  const mesas = listarMesasGit();
  console.log(`\n[Passo 3/3] Verificando mesas Git (.worktrees)...`);
  if (mesas.length > 0) {
    console.log(`  Existem ${mesas.length} mesa(s) ativas.`);
    console.log(`  Para auditar e desmontar mesas concluidas com seguranca:`);
    console.log(`    node scripts/vibe-clean.mjs mesas --limpar-concluidas`);
  } else {
    console.log(`  Nenhuma mesa de trabalho acumulada.`);
  }

  console.log("\n=======================================================");
  console.log("            FAXINA SEGURA CONCLUIDA COM SUCESSO!       ");
  console.log("=======================================================\n");
  console.log(`⭐ Repositório: https://github.com/Gabrielrtads/vibe-clean`);
}

function expurgar(confirmarDestruicao = false) {
  if (!confirmarDestruicao) {
    console.log("\n[BLOQUEIO DE SEGURANCA] O expurgo exclui permanentemente todas as pastas de quarentena.");
    console.log("Para confirmar a exclusao definitiva e liberar o espaco no SSD, use:");
    console.log("    node scripts/vibe-clean.mjs expurgar --confirmar-destruicao\n");
    return;
  }

  if (!fs.existsSync(CLI_DIR)) {
    console.log("Diretorio da CLI nao encontrado.");
    return;
  }

  const entries = fs.readdirSync(CLI_DIR, { withFileTypes: true });
  const quarFolders = entries.filter(e => e.isDirectory() && e.name.startsWith("quarentena"));

  if (quarFolders.length === 0) {
    console.log("Nenhuma pasta de quarentena encontrada para expurgo.");
    return;
  }

  let totalFreedMB = 0;
  for (const q of quarFolders) {
    const fullPath = path.join(CLI_DIR, q.name);
    const sz = getFolderSize(fullPath);
    console.log(`Excluindo ${q.name} (${sz.sizeMB} MB)...`);
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      totalFreedMB += sz.sizeMB;
    } catch (err) {
      console.error(`Erro ao apagar ${q.name}: ${err.message}`);
    }
  }

  console.log(`\nSUCESSO: ${totalFreedMB.toFixed(1)} MB liberados permanentemente no SSD!\n`);
}

function main() {
  const args = process.argv.slice(2);
  const comando = args[0] || "auditar";

  let dias = 5;
  const diasIdx = args.indexOf("--dias");
  if (diasIdx !== -1 && args[diasIdx + 1]) {
    dias = parseInt(args[diasIdx + 1], 10) || 5;
  }

  const confirmar = args.includes("--confirmar");
  const liberar = args.includes("--liberar");
  const incluirCdp = args.includes("--incluir-cdp");
  const limparConcluidas = args.includes("--limpar-concluidas");
  const confirmarDestruicao = args.includes("--confirmar-destruicao");

  switch (comando) {
    case "auditar":
      auditar();
      break;
    case "zumbis":
      gerenciarZumbis(confirmar);
      break;
    case "portas":
      gerenciarPortas(liberar, incluirCdp);
      break;
    case "mesas":
      gerenciarMesas(limparConcluidas);
      break;
    case "limpar":
      limpar(dias);
      break;
    case "expurgar":
      expurgar(confirmarDestruicao);
      break;
    default:
      console.log("Uso: node scripts/vibe-clean.mjs <auditar|zumbis|portas|mesas|limpar|expurgar> [--dias 5] [--confirmar] [--liberar [--incluir-cdp]] [--limpar-concluidas] [--confirmar-destruicao]");
      process.exit(1);
  }
}

// Só executa a CLI quando chamado diretamente (permite importar as funções nos testes sem efeitos colaterais)
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main();
}
