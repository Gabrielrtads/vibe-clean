import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { detectarBranchBase, analisarMesa } from "../scripts/vibe-clean.mjs";

// Repositório Git descartável no diretório temporário do SO (nada é criado dentro do projeto)
let tmp, repo;

function git(cwd, ...args) {
  return execFileSync("git", [
    "-c", "user.name=vibe-clean-test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false",
    "-C", cwd, ...args
  ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

before(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-clean-mesas-"));
  repo = path.join(tmp, "repo");
  fs.mkdirSync(repo);
  git(repo, "init", "-q", "-b", "master");
  fs.writeFileSync(path.join(repo, "a.txt"), "a");
  git(repo, "add", "a.txt");
  git(repo, "commit", "-q", "-m", "inicial");

  // Mesa com 1 commit local que não existe em master
  git(repo, "worktree", "add", "-q", "-b", "task/com-commit", path.join(tmp, "wt-com-commit"));
  fs.writeFileSync(path.join(tmp, "wt-com-commit", "b.txt"), "b");
  git(path.join(tmp, "wt-com-commit"), "add", "b.txt");
  git(path.join(tmp, "wt-com-commit"), "commit", "-q", "-m", "trabalho nao enviado");

  // Mesa sem commits nem sujeira
  git(repo, "worktree", "add", "-q", "-b", "task/limpa", path.join(tmp, "wt-limpa"));
});

after(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

test("detecta 'master' como base num repo sem 'origin/main'", () => {
  assert.equal(detectarBranchBase(repo), "master");
});

test("mesa com commit local NAO e segura (repo usa master, nao origin/main)", () => {
  const mesa = { caminho: path.join(tmp, "wt-com-commit"), branch: "task/com-commit" };
  const r = analisarMesa(repo, mesa, detectarBranchBase(repo));
  assert.equal(r.erro, null);
  assert.equal(r.commitsAhead, 1);
  assert.equal(r.seguro, false);
});

test("base inexistente (ex.: 'origin/main' fixo) vira erro e NAO segura, nunca '0 commits'", () => {
  const mesa = { caminho: path.join(tmp, "wt-com-commit"), branch: "task/com-commit" };
  const r = analisarMesa(repo, mesa, "origin/main");
  assert.notEqual(r.erro, null);
  assert.equal(r.seguro, false);
});

test("falha no git status vira erro e NAO segura", () => {
  const mesa = { caminho: path.join(tmp, "nao-existe"), branch: "task/limpa" };
  const r = analisarMesa(repo, mesa, "master");
  assert.notEqual(r.erro, null);
  assert.equal(r.seguro, false);
});

test("mesa limpa sem commits a frente da base e segura", () => {
  const mesa = { caminho: path.join(tmp, "wt-limpa"), branch: "task/limpa" };
  const r = analisarMesa(repo, mesa, detectarBranchBase(repo));
  assert.equal(r.erro, null);
  assert.equal(r.commitsAhead, 0);
  assert.equal(r.seguro, true);
});

test("mesa com arquivo nao salvo NAO e segura", () => {
  const wt = path.join(tmp, "wt-limpa");
  fs.writeFileSync(path.join(wt, "rascunho.txt"), "x");
  try {
    const r = analisarMesa(repo, { caminho: wt, branch: "task/limpa" }, "master");
    assert.equal(r.isDirty, true);
    assert.equal(r.seguro, false);
  } finally {
    fs.rmSync(path.join(wt, "rascunho.txt"));
  }
});
