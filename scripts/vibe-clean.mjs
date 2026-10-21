#!/usr/bin/env node
/**
 * scripts/vibe-clean.mjs
 * -----------------------
 * Vibe-Clean: Guardião da Ordem, Higiene do Sistema e Prevenção de Zumbis para Vibe Coding.
 * 
 * Uso:
 *   node scripts/vibe-clean.mjs auditar                        (Raio-X transparente de RAM, Disco e Auditoria de Scripts)
 *   node scripts/vibe-clean.mjs zumbis [--confirmar]           (Lista ou encerra processos órfãos na RAM)
 *   node scripts/vibe-clean.mjs limpar [--dias 5]              (Executa faxina segura com quarentena reversível)
 *   node scripts/vibe-clean.mjs expurgar --confirmar-destruicao (Exclui quarentenas antigas para liberar SSD)
 * 
 * Repo: https://github.com/Gabrielrtads/vibe-clean
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync, execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKTREES_DIR = path.join(ROOT_DIR, ".worktrees");
const CLI_DIR = path.join(os.homedir(), ".gemini", "antigravity-cli");
const APP_STORAGE_PATH = path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "Antigravity", "app_storage.json");
const PROJECTS_CONFIG_DIR = path.join(os.homedir(), ".gemini", "config", "projects");
const PROTECTED_PROJECT_FILES = new Set([
  "ed974f37-3914-446e-a2a4-53a72a61df74.json",
  "default-cli-project.json",
  "outside-of-project.json"
]);

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
      return { totalTargetProcesses: all.length, protectedCount: 0, zombies: [], zombieRamMB: 0 };
    } catch {
      return { totalTargetProcesses: 0, protectedCount: 0, zombies: [], zombieRamMB: 0 };
    }
  }

  const psCmd = `Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine, WorkingSetSize | ConvertTo-Json -Compress`;
  const all = execPwshJson(psCmd);
  const pidMap = new Map(all.map(p => [p.ProcessId, p]));

  // 1. Identificar PIDs do Language Server do Antigravity IDE
  const lsPids = new Set(
    all
      .filter(p => (p.Name || "").toLowerCase().includes("language_server"))
      .map(p => p.ProcessId)
  );

  // 2. Coletar árvore de processos protegidos (Language Server + filhos e netos MCPs)
  const protectedPids = new Set(lsPids);
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
    const cmd = (p.CommandLine || "").toLowerCase();

    const isTarget = name.includes("node.exe") || name.includes("python.exe") || name.includes("agy.exe") || name.includes("whisper") || name.includes("ffmpeg.exe");
    if (!isTarget) continue;

    targets.push(p);

    // Se estiver protegido pela árvore do Language Server, pula
    if (protectedPids.has(p.ProcessId)) continue;

    // Se for o próprio processo atual do Node, pula
    if (p.ProcessId === process.pid) continue;

    // Critério de órfão: ParentProcessId não existe mais na tabela de processos ativos
    const parentExists = pidMap.has(p.ParentProcessId);
    const isOrphan = !parentExists;

    // Processos associados a scripts descartados de esteira
    const isDeadScript = cmd.includes("fila_destilacao") || cmd.includes("clean_zombie") || cmd.includes("taskkill");

    if (isOrphan || isDeadScript) {
      zombies.push({
        ...p,
        motivo: isOrphan ? "Processo Pai Inexistente (Órfão)" : "Script de Esteira Finalizado"
      });
    }
  }

  const zombieRamMB = Math.round(zombies.reduce((acc, p) => acc + (p.WorkingSetSize || 0), 0) / (1024 * 1024));

  return {
    totalTargetProcesses: targets.length,
    protectedCount: protectedPids.size,
    zombies,
    zombieRamMB
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
 * NOVO: Auditor de Scripts Tóxicos (Static Code Hygiene & Zombie Prevention)
 * Varre scripts procurando por padrões descuidos conhecidos que causam zumbis e inchaço.
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

          // Ignorar comentários
          if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
            return;
          }

          // 1. Detectar --new-project solto (poluição da barra lateral)
          if (line.includes("--new-project") && !line.includes("default-cli-project")) {
            alerts.push({
              file: relPath,
              line: lineNum,
              type: "POLUICAO_SIDEBAR",
              snippet: trimmed.slice(0, 80),
              msg: "Uso de '--new-project' detectado. Pode criar projetos fantasmas na barra lateral. Substitua por '--project default-cli-project'."
            });
          }

          // 2. Detectar chamadas de subprocesso síncronas/assíncronas sem timeout no Node.js
          const isNodeExec = line.includes("execSync(") || line.includes("execFileSync(") || line.includes("spawn(");
          if (isNodeExec && !content.includes("timeout") && !line.includes("timeout")) {
            // Checagem refinada para não gerar alertas duplicados no mesmo arquivo
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

          // 3. Detectar subprocess.run / check_output no Python sem timeout
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

  // 1. RAM / Processos
  try {
    const procData = findProcesses();
    console.log(`\n[1] MEMORIA RAM & PROCESSOS:`);
    console.log(`  - Processos de IA ativos          : ${procData.totalTargetProcesses}`);
    console.log(`  - Processos legitimos protegidos  : ${procData.totalTargetProcesses - procData.zombies.length}`);
    console.log(`  - Processos orfaos confirmados    : ${procData.zombies.length}`);
    console.log(`  - Memoria RAM consumida por orfaos: ${procData.zombieRamMB} MB`);
  } catch (err) {
    console.log(`\n[1] MEMORIA RAM & PROCESSOS:\n  [AVISO] Nao foi possivel consultar WMI: ${err.message}`);
  }

  // 2. Disco / Mesas Git
  const mesas = listarMesasGit();
  const worktreesStats = getFolderSize(WORKTREES_DIR);
  console.log(`\n[2] DISCO / MESAS DE TRABALHO (.worktrees):`);
  console.log(`  - Mesas ativas detectadas         : ${mesas.length} mesa(s)`);
  console.log(`  - Espaco ocupado em disco         : ${worktreesStats.fileCount} arquivos (${worktreesStats.sizeMB} MB)`);
  if (mesas.length > 0) {
    for (const m of mesas) {
      console.log(`    * ${path.basename(m.caminho)} [${m.branch || "sem branch"}]`);
    }
  }

  // 3. Disco / Sessões CLI & Quarentena
  const cliStats = getFolderSize(CLI_DIR, /^quarentena/);
  const quarStats = getFolderSize(CLI_DIR);
  const diffQuarMB = Math.max(0, Math.round((quarStats.sizeMB - cliStats.sizeMB) * 10) / 10);
  console.log(`\n[3] DISCO / SESSOES DO TERMINAL (~/.gemini/antigravity-cli):`);
  console.log(`  - Arquivos ativos em uso          : ${cliStats.fileCount} arquivos (${cliStats.sizeMB} MB)`);
  if (diffQuarMB > 0) {
    console.log(`  - Arquivos em Quarentena segura   : ${diffQuarMB} MB protegidos`);
  }

  // 4. Barra Lateral & Projetos
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

  console.log(`\n[4] INTERFACE DA IDE (PROJETOS & BARRA LATERAL):`);
  console.log(`  - Projetos ativos no app_storage  : ${projectStorageCount} projeto(s)`);
  console.log(`  - Arquivos de projeto em disco    : ${projectFilesCount} arquivo(s)`);
  if (ghostProjectsCount > 0) {
    console.log(`  - ⚠️  Projetos fantasmas detectados: ${ghostProjectsCount} arquivo(s) (Risco de duplicação na barra lateral!)`);
  } else {
    console.log(`  - Integridade de projetos         : 100% LIMPO (Zero projetos fantasmas)`);
  }

  // 5. Auditoria Estática de Scripts Tóxicos
  const scriptAudit = auditarScripts();
  console.log(`\n[5] AUDITORIA DE SCRIPTS (HIGIENE DE CÓDIGO):`);
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
  console.log(`Dica: Para gerenciar mesas Git use: node scripts/mesa.mjs auditar`);
  console.log(`Para abater processos orfaos com seguranca: node scripts/vibe-clean.mjs zumbis --confirmar`);
  console.log(`⭐ Repositório oficial: https://github.com/Gabrielrtads/vibe-clean`);
  console.log(`🤝 Companheira de Git (opcional): https://github.com/Gabrielrtads/vibe-dev`);
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
  console.log(`⭐ Se essa ferramenta te ajudou, deixe uma estrela: https://github.com/Gabrielrtads/vibe-clean\n`);
}

function limpar(dias = 5) {
  console.log("\n=======================================================");
  console.log("             INICIANDO FAXINA SEGURA DO SISTEMA        ");
  console.log("=======================================================");

  // 1. Quarentena segura de sessões CLI
  const quarantineScript = path.join(ROOT_DIR, "scripts", "automation", "quarentena_antigravity_cli.py");
  if (fs.existsSync(quarantineScript)) {
    console.log(`\n[Passo 1/3] Movendo sessoes antigas (> ${dias} dias) para quarentena reversivel...`);
    try {
      const out = execFileSync("python", [quarantineScript, "--executar", "--dias", String(dias)], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      });
      console.log(out.trim());
    } catch (e) {
      console.log("Aviso ao executar quarentena:", e.message);
    }
  }

  // 2. Quarentena de projetos fantasmas (.gemini/config/projects)
  const ghostProjScript = path.join(ROOT_DIR, "scripts", "automation", "quarentena_projetos_fantasmas.py");
  if (fs.existsSync(ghostProjScript)) {
    console.log(`\n[Passo 2/3] Verificando e isolando projetos fantasmas em ~/.gemini/config/projects...`);
    try {
      const out = execFileSync("python", [ghostProjScript, "--executar"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      });
      console.log(out.trim());
    } catch (e) {
      console.log("Aviso ao isolar projetos fantasmas:", e.message);
    }
  }

  // 3. Alerta de mesas Git
  const mesas = listarMesasGit();
  console.log(`\n[Passo 3/3] Verificando mesas Git (.worktrees)...`);
  if (mesas.length > 0) {
    console.log(`Existem ${mesas.length} mesa(s) de trabalho ativas. Para auditar e desmontar as que ja terminaram:`);
    console.log(`  node scripts/mesa.mjs auditar --repo .`);
  } else {
    console.log(`Nenhuma mesa de trabalho acumulada.`);
  }

  console.log("\n=======================================================");
  console.log("            FAXINA SEGURA CONCLUIDA!                  ");
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

const args = process.argv.slice(2);
const comando = args[0] || "auditar";

let dias = 5;
const diasIdx = args.indexOf("--dias");
if (diasIdx !== -1 && args[diasIdx + 1]) {
  dias = parseInt(args[diasIdx + 1], 10) || 5;
}

const confirmar = args.includes("--confirmar");
const confirmarDestruicao = args.includes("--confirmar-destruicao");

switch (comando) {
  case "auditar":
    auditar();
    break;
  case "zumbis":
    gerenciarZumbis(confirmar);
    break;
  case "limpar":
    limpar(dias);
    break;
  case "expurgar":
    expurgar(confirmarDestruicao);
    break;
  default:
    console.log("Uso: node scripts/vibe-clean.mjs <auditar|limpar|zumbis|expurgar> [--dias 5] [--confirmar] [--confirmar-destruicao]");
    process.exit(1);
}
