import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { avaliarProjeto, quarentenaProjetosFantasmasNode } from "../scripts/vibe-clean.mjs";

// Tudo acontece em um diretório temporário do SO: nunca toca ~/.gemini real nem a pasta do projeto
let tmp, projectsDir, arquivoDir, pastaViva, pastaMorta;

function projeto(nome, folderPath) {
  const json = { id: nome, name: nome };
  if (folderPath !== undefined) {
    json.projectResources = { resources: [{ gitFolder: { folderUri: pathToFileURL(folderPath).href } }] };
  }
  fs.writeFileSync(path.join(projectsDir, `${nome}.json`), JSON.stringify(json));
}

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vibe-clean-projetos-"));
  projectsDir = path.join(tmp, "projects");
  arquivoDir = path.join(tmp, "_arquivo");
  pastaViva = path.join(tmp, "repo-vivo");
  pastaMorta = path.join(tmp, "repo-apagado");
  fs.mkdirSync(projectsDir);
  fs.mkdirSync(pastaViva);

  projeto("projeto-ativo", pastaViva);        // pasta existe -> nunca mover
  projeto("projeto-orfao", pastaMorta);       // pasta não existe -> órfão
  projeto("projeto-sem-pasta");               // não referencia pasta -> manter na dúvida
  fs.writeFileSync(path.join(projectsDir, "projeto-quebrado.json"), "{ nao e json");
});

afterEach(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

test("projeto fora da allowlist cuja pasta EXISTE nao e orfao", () => {
  assert.equal(avaliarProjeto(path.join(projectsDir, "projeto-ativo.json")).orfao, false);
});

test("so e orfao o projeto cuja pasta referenciada nao existe mais", () => {
  assert.equal(avaliarProjeto(path.join(projectsDir, "projeto-orfao.json")).orfao, true);
  assert.equal(avaliarProjeto(path.join(projectsDir, "projeto-sem-pasta.json")).orfao, false);
  assert.equal(avaliarProjeto(path.join(projectsDir, "projeto-quebrado.json")).orfao, false);
});

test("sem --confirmar e apenas dry-run: nada e movido", () => {
  const r = quarentenaProjetosFantasmasNode(false, { projectsDir, arquivoDir });
  assert.equal(r.movidos, 0);
  assert.match(r.mensagem, /DRY-RUN/);
  assert.equal(fs.existsSync(path.join(projectsDir, "projeto-orfao.json")), true);
  assert.equal(fs.existsSync(arquivoDir), false);
});

test("com --confirmar move SOMENTE o orfao e preserva os demais", () => {
  const r = quarentenaProjetosFantasmasNode(true, { projectsDir, arquivoDir });
  assert.equal(r.movidos, 1);
  assert.deepEqual(fs.readdirSync(projectsDir).sort(), ["projeto-ativo.json", "projeto-quebrado.json", "projeto-sem-pasta.json"]);
});

test("erro de rename e reportado, nunca engolido", () => {
  const rename = () => { throw new Error("EPERM simulado"); };
  const r = quarentenaProjetosFantasmasNode(true, { projectsDir, arquivoDir, rename });
  assert.equal(r.movidos, 0);
  assert.equal(r.falhas.length, 1);
  assert.match(r.mensagem, /EPERM simulado/);
  assert.equal(fs.existsSync(path.join(projectsDir, "projeto-orfao.json")), true);
});
