import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import path from "node:path";

import Container from "@teqfw/di";

import Bootstrap from "../../../../src/Host/Bootstrap.mjs";

const createLoggerProviderStub = function () {
  const records = [];
  const sources = [];
  return {
    records,
    sources,
    provider: {
      forSource(source) {
        sources.push(source);
        return {
          info(message, data) { records.push({level: "info", message, data, source}); },
        };
      },
    },
  };
};

const createServerStub = function () {
  return {
    startCalls: 0,
    stopCalls: 0,
    async start() { this.startCalls += 1; },
    async stop() { this.stopCalls += 1; },
  };
};

const moduleStub = {createRequire};

test("composes handlers and three collision-free static sources", async () => {
  const logger = createLoggerProviderStub();
  const server = createServerStub();
  const registrations = [];
  const staticInitializations = [];
  const principalContributionHandler = {name: "principal"};
  const reservedRoutesHandler = {name: "reserved"};
  const staticHandler = {name: "static", async init(params) { staticInitializations.push(params); }};
  const sourceFactory = {create: (source) => source};
  const pipelineEngine = {addHandler: (handler) => registrations.push(handler)};
  const configLoader = {load: async () => ({})};
  const app = new Bootstrap({
    logger: logger.provider,
    server,
    module: moduleStub,
    path,
    configLoader,
    pipelineEngine,
    principalContributionHandler,
    reservedRoutesHandler,
    staticHandler,
    sourceFactory,
  });

  const runPromise = app.run({projectRoot: process.cwd()});
  await new Promise((resolve) => setTimeout(resolve, 10));
  await app.stop();
  await runPromise;

  assert.deepEqual(registrations, [principalContributionHandler, reservedRoutesHandler, staticHandler]);
  assert.deepEqual(staticInitializations[0].sources.map((source) => source.prefix), ["/", "/desk/", "/mob/"]);
  assert.match(staticInitializations[0].sources[1].root, /node_modules\/\@flancer32\/alarisa-desk\/web$/);
  assert.match(staticInitializations[0].sources[2].root, /node_modules\/\@flancer32\/alarisa-mob\/web$/);
});

test("container resolves the host bootstrap without back namespace collision", async () => {
  const container = new Container();
  container.addNamespaceRoot("Alarisa_", path.resolve(process.cwd(), "src"), ".mjs");
  container.addNamespaceRoot("Alarisa_Back_", path.resolve(process.cwd(), "node_modules/@flancer32/alarisa-back/src"), ".mjs");
  container.addNamespaceRoot("Alarisa_Comm_", path.resolve(process.cwd(), "node_modules/@flancer32/alarisa-comm/src"), ".mjs");
  container.addNamespaceRoot("TeqFw_Log_", path.resolve(process.cwd(), "node_modules/@teqfw/log/src"), ".mjs");
  container.addNamespaceRoot("Fl32_Web_", path.resolve(process.cwd(), "node_modules/@flancer32/teq-web/src"), ".mjs");
  container.addNamespaceRoot("node:", path.resolve(process.cwd(), "node_modules"), ".mjs");

  const app = await container.get("Alarisa_Host_Bootstrap$");

  assert.ok(app instanceof Bootstrap);
  assert.equal(typeof app.run, "function");
});
