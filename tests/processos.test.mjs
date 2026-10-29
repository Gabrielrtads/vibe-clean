import { test } from "node:test";
import assert from "node:assert/strict";
import { classificarProcessos } from "../scripts/vibe-clean.mjs";

const SELF = 99999;

test("node com pai vivo NAO e zumbi mesmo com 'taskkill' na linha de comando", () => {
  const all = [
    { ProcessId: 10, ParentProcessId: 1, Name: "explorer.exe", CommandLine: "explorer.exe" },
    { ProcessId: 20, ParentProcessId: 10, Name: "node.exe", CommandLine: "node build.js && taskkill /F /IM foo.exe" },
    { ProcessId: 21, ParentProcessId: 10, Name: "python.exe", CommandLine: "python fila_destilacao.py" }
  ];
  const { zombies } = classificarProcessos(all, SELF);
  assert.deepEqual(zombies.map(z => z.ProcessId), []);
});

test("node cujo pai nao existe mais E zumbi", () => {
  const all = [
    { ProcessId: 10, ParentProcessId: 1, Name: "explorer.exe", CommandLine: "explorer.exe" },
    { ProcessId: 30, ParentProcessId: 4242, Name: "node.exe", CommandLine: "node server.js" }
  ];
  const { zombies } = classificarProcessos(all, SELF);
  assert.deepEqual(zombies.map(z => z.ProcessId), [30]);
});

test("pwsh.exe, powershell.exe e wt.exe sao raizes protegidas (com toda a arvore de filhos)", () => {
  const all = [
    { ProcessId: 1, ParentProcessId: 0, Name: "System", CommandLine: "" },
    { ProcessId: 100, ParentProcessId: 1, Name: "wt.exe", CommandLine: "wt.exe" },
    { ProcessId: 101, ParentProcessId: 100, Name: "pwsh.exe", CommandLine: "pwsh.exe" },
    { ProcessId: 102, ParentProcessId: 101, Name: "node.exe", CommandLine: "node dev.js" },
    { ProcessId: 200, ParentProcessId: 1, Name: "powershell.exe", CommandLine: "powershell.exe" },
    { ProcessId: 201, ParentProcessId: 200, Name: "python.exe", CommandLine: "python app.py" }
  ];
  const { protectedPids, zombies } = classificarProcessos(all, SELF);
  for (const pid of [100, 101, 102, 200, 201]) {
    assert.ok(protectedPids.has(pid), `PID ${pid} deveria estar protegido`);
  }
  assert.equal(zombies.length, 0);
});

test("o proprio processo do vibe-clean nunca e zumbi", () => {
  const all = [{ ProcessId: SELF, ParentProcessId: 4242, Name: "node.exe", CommandLine: "node vibe-clean.mjs" }];
  assert.equal(classificarProcessos(all, SELF).zombies.length, 0);
});
