import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import Container from "@teqfw/di";

import Bootstrap from "../../../../src/Back/Bootstrap.mjs";

test("run reports startup and returns zero", async () => {
  const app = new Bootstrap();
  /** @type {string[]} */
  const messages = [];
  const previousLog = console.log;
  console.log = (...args) => {
    messages.push(args.join(" "));
  };

  try {
    const result = await app.run({ projectRoot: "/tmp/alarisa", cliArgs: ["--demo"] });
    assert.equal(result, 0);
    assert.equal(app.isStarted(), true);
    assert.match(messages[0], /Alarisa application started\./);
    assert.match(messages[0], /Root: \/tmp\/alarisa/);
    assert.match(messages[0], /Args: --demo/);
  } finally {
    console.log = previousLog;
  }
});

test("stop clears started flag", async () => {
  const app = new Bootstrap();
  const previousLog = console.log;
  console.log = () => {};

  try {
    await app.run({ projectRoot: "/tmp/alarisa", cliArgs: [] });
    assert.equal(app.isStarted(), true);
    await app.stop();
    assert.equal(app.isStarted(), false);
  } finally {
    console.log = previousLog;
  }
});

test("container resolves Alarisa_Back_Bootstrap from namespace mapping", async () => {
  const container = new Container();
  container.addNamespaceRoot("Alarisa_", path.resolve(process.cwd(), "src"), ".mjs");

  const app = await container.get("Alarisa_Back_Bootstrap$");

  assert.ok(app instanceof Bootstrap);
  assert.equal(typeof app.run, "function");
  assert.equal(typeof app.stop, "function");
});
