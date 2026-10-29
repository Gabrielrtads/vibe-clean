import { test } from "node:test";
import assert from "node:assert/strict";
import { classificarPorta, selecionarPortasParaLiberar } from "../scripts/vibe-clean.mjs";

function mapa(procs) {
  return new Map(procs.map(p => [p.ProcessId, p]));
}

test("servidor node ativo (pai vivo) na porta 3000 NAO e marcado como preso", () => {
  const pidMap = mapa([
    { ProcessId: 10, ParentProcessId: 1, Name: "cmd.exe", CommandLine: "cmd /c npm run dev" },
    { ProcessId: 20, ParentProcessId: 10, Name: "node.exe", CommandLine: "node next dev" }
  ]);
  const p = classificarPorta(3000, 20, pidMap);
  assert.equal(p.isZombie, false);
});

test("servidor node orfao (pai inexistente) na porta 5173 E marcado como preso", () => {
  const pidMap = mapa([{ ProcessId: 20, ParentProcessId: 4242, Name: "node.exe", CommandLine: "node vite" }]);
  const p = classificarPorta(5173, 20, pidMap);
  assert.equal(p.isZombie, true);
});

test("processo desconhecido (fora da tabela) nunca e marcado como preso", () => {
  assert.equal(classificarPorta(8000, 77, mapa([])).isZombie, false);
});

test("porta 9222 orfa so e liberada com a confirmacao extra --incluir-cdp", () => {
  const pidMap = mapa([
    { ProcessId: 30, ParentProcessId: 4242, Name: "node.exe", CommandLine: "node cdp-proxy.js" },
    { ProcessId: 31, ParentProcessId: 4243, Name: "python.exe", CommandLine: "python -m http.server 8000" }
  ]);
  const portas = [classificarPorta(9222, 30, pidMap), classificarPorta(8000, 31, pidMap)];

  const semCdp = selecionarPortasParaLiberar(portas, false);
  assert.deepEqual(semCdp.liberar.map(p => p.port), [8000]);
  assert.deepEqual(semCdp.cdpRetidas.map(p => p.port), [9222]);

  const comCdp = selecionarPortasParaLiberar(portas, true);
  assert.deepEqual(comCdp.liberar.map(p => p.port).sort(), [8000, 9222]);
});

test("navegador na 9222 e sempre protegido", () => {
  const pidMap = mapa([{ ProcessId: 40, ParentProcessId: 4242, Name: "chrome.exe", CommandLine: "chrome --remote-debugging-port=9222" }]);
  const p = classificarPorta(9222, 40, pidMap);
  assert.equal(p.isProtected, true);
  assert.equal(p.isZombie, false);
  assert.equal(selecionarPortasParaLiberar([p], true).liberar.length, 0);
});
