import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import Container from "@teqfw/di";

import Bootstrap from "../../../../src/Back/Bootstrap.mjs";

const createLoggerProviderStub = function () {
  /** @type {TeqFw_Log_Record[]} */
  const records = [];
  /** @type {string[]} */
  const sources = [];

  return {
    records,
    sources,
    provider: {
      forSource(source) {
        sources.push(source);
        return {
          isEnabled() {
            return true;
          },
          write(record) {
            records.push(record);
          },
          log(level, message, data) {
            records.push({ level, message, data, source, time: new Date() });
          },
          trace(message, data) {
            this.log("trace", message, data);
          },
          debug(message, data) {
            this.log("debug", message, data);
          },
          info(message, data) {
            this.log("info", message, data);
          },
          warn(message, data) {
            this.log("warn", message, data);
          },
          error(message, data) {
            this.log("error", message, data);
          },
          fatal(message, data) {
            this.log("fatal", message, data);
          },
        };
      },
    },
  };
};

const createServerStub = function () {
  return {
    startCalls: [],
    stopCalls: 0,
    async start(options) {
      this.startCalls.push(options);
    },
    async stop() {
      this.stopCalls += 1;
    },
  };
};

test("run reports startup through bound logger and returns zero", async () => {
  const logger = createLoggerProviderStub();
  const server = createServerStub();
  const app = new Bootstrap({ logger: logger.provider, server });

  const runPromise = app.run({ projectRoot: "/tmp/alarisa", cliArgs: ["--demo"], port: 0 });
  await new Promise((resolve) => setTimeout(resolve, 50));

  await app.stop();
  const result = await runPromise;

  assert.equal(result, 0);
  assert.equal(app.isStarted(), false);
  assert.deepEqual(logger.sources, ["Alarisa_Back_Bootstrap"]);
  assert.equal(logger.records.length, 2);
  assert.equal(logger.records[0].level, "info");
  assert.equal(logger.records[0].message, "Application started");
  assert.equal(logger.records[1].level, "info");
  assert.equal(logger.records[1].message, "Application stopped");
  assert.deepEqual(logger.records[0].data, {
    projectRoot: "/tmp/alarisa",
    cliArgs: ["--demo"],
  });

  await app.stop();
});

test("stop clears started flag and logs shutdown", async () => {
  const logger = createLoggerProviderStub();
  const server = createServerStub();
  const app = new Bootstrap({ logger: logger.provider, server });

  const runPromise = app.run({ projectRoot: "/tmp/alarisa", cliArgs: [], port: 0 });
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(app.isStarted(), true);

  await app.stop();
  await runPromise;

  assert.equal(app.isStarted(), false);
  assert.equal(logger.records.length, 2);
  assert.equal(logger.records[1].level, "info");
  assert.equal(logger.records[1].message, "Application stopped");
});

test("container resolves Alarisa_Back_Bootstrap from namespace mapping", async () => {
  const container = new Container();
  container.addNamespaceRoot("Alarisa_", path.resolve(process.cwd(), "src"), ".mjs");
  container.addNamespaceRoot("TeqFw_Log_", path.resolve(process.cwd(), "node_modules/@teqfw/log/src"), ".mjs");
  container.addNamespaceRoot("Fl32_Web_", path.resolve(process.cwd(), "node_modules/@flancer32/teq-web/src"), ".mjs");
  container.addNamespaceRoot("node:", path.resolve(process.cwd(), "node_modules"), ".mjs");

  const app = await container.get("Alarisa_Back_Bootstrap$");

  assert.ok(app instanceof Bootstrap);
  assert.equal(typeof app.run, "function");
  assert.equal(typeof app.stop, "function");
});
