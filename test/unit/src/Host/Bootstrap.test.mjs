import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import path from "node:path";

import Container from "@teqfw/di";

import Bootstrap from "../../../../src/Bootstrap.mjs";

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

const moduleStub = {createRequire};

test("composes handlers and four collision-free static sources", async () => {
  const logger = createLoggerProviderStub();
  const registrations = [];
  const staticInitializations = [];
  const principalContributionHandler = {name: "principal"};
  const authenticationHandler = {name: "authentication"};
  const principalApiAuthHandler = {name: "api-auth"};
  const reservedRoutesHandler = {name: "reserved"};
  const authService = {};
  const databaseCalls = [];
  const database = {
    async start(projectRoot) { databaseCalls.push({operation: "start", projectRoot}); },
    async stop() { databaseCalls.push({operation: "stop"}); },
  };
  const staticHandler = {name: "static", async init(params) { staticInitializations.push(params); }};
  const sourceFactory = {create: (source) => source};
  const pipelineEngine = {addHandler: (handler) => registrations.push(handler)};
  const runtimeFactory = {configure() {}, freeze() { return {authOrigin: "http://localhost:3000"}; }};
  const app = new Bootstrap({
    logger: logger.provider,
    module: moduleStub,
    path,
    cliConfig: {applicationRoot: process.cwd(), argv: []},
    runtimeFactory,
    authService,
    database,
    pipelineEngine,
    authenticationHandler,
    principalApiAuthHandler,
    principalContributionHandler,
    reservedRoutesHandler,
    staticHandler,
    sourceFactory,
  });

  await app.onStartup();
  await app.onShutdown();

  assert.deepEqual(registrations, [authenticationHandler, principalApiAuthHandler, principalContributionHandler, reservedRoutesHandler, staticHandler]);
  assert.deepEqual(databaseCalls, [{operation: "start", projectRoot: process.cwd()}, {operation: "stop"}]);
  assert.deepEqual(staticInitializations[0].sources.map((source) => source.prefix), ["/", "/_assets/comm/", "/desk/", "/mob/"]);
  assert.match(staticInitializations[0].sources[1].root, /node_modules\/\@flancer32\/alarisa-comm\/web$/);
  assert.match(staticInitializations[0].sources[2].root, /node_modules\/\@flancer32\/alarisa-desk\/web$/);
  assert.match(staticInitializations[0].sources[3].root, /node_modules\/\@flancer32\/alarisa-mob\/web$/);
});

test("container resolves the host bootstrap without back namespace collision", async () => {
  const container = new Container();
  container.addNamespaceRoot("Alarisa_", path.resolve(process.cwd(), "src"), ".mjs");
  container.addNamespaceRoot("Alarisa_Back_", path.resolve(process.cwd(), "node_modules/@flancer32/alarisa-back/src"), ".mjs");
  container.addNamespaceRoot("Alarisa_Comm_", path.resolve(process.cwd(), "node_modules/@flancer32/alarisa-comm/src"), ".mjs");
  container.addNamespaceRoot("Alarisa_Back_State_", path.resolve(process.cwd(), "node_modules/@flancer32/alarisa-back-state/src"), ".mjs");
  container.addNamespaceRoot("TeqFw_Db_", path.resolve(process.cwd(), "node_modules/@teqfw/db/src"), ".mjs");
  container.addNamespaceRoot("TeqFw_Log_", path.resolve(process.cwd(), "node_modules/@teqfw/log/src"), ".mjs");
  container.addNamespaceRoot("TeqFw_Cfg_", path.resolve(process.cwd(), "node_modules/@teqfw/cfg/src"), ".mjs");
  container.addNamespaceRoot("TeqFw_Cli_", path.resolve(process.cwd(), "node_modules/@teqfw/cli/src"), ".mjs");
  container.addNamespaceRoot("TeqFw_Web_", path.resolve(process.cwd(), "node_modules/@teqfw/web/src"), ".mjs");
  container.addNamespaceRoot("node:", path.resolve(process.cwd(), "node_modules"), ".mjs");

  const app = await container.get("Alarisa_Bootstrap$");

  assert.ok(app instanceof Bootstrap);
  assert.equal(typeof app.onStartup, "function");
  assert.equal(typeof app.onShutdown, "function");
});
