import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import {test} from "node:test";
import Database from "../../../../src/State/Database.mjs";

test("database composition creates an absent schema and disconnects", async () => {
  const calls = [];
  const connection = {
    async init(config) { calls.push({operation: "init", config}); },
    setSchemaConfig(config) { calls.push({operation: "schema-config", config}); },
    getDialectAdapter() { return {id: "sqlite"}; },
    getSchemaBuilder() { return {async hasTable() { return false; }}; },
    async disconnect() { calls.push({operation: "disconnect"}); },
  };
  const compilation = {physical: {tables: [{name: "alarisa_case"}]}};
  const database = new Database({
    fs: {async mkdir(directory, options) { calls.push({operation: "mkdir", directory, options}); }},
    path, dbConfig: {get: () => ({})}, connection,
    demLoad: {exec: async () => ({compilation})},
    schema: {
      setCompilation({compilation: value}) { assert.equal(value, compilation); },
      async createAllTables({conn}) { assert.equal(conn, connection); return {status: "complete"}; },
    },
  });
  const projectRoot = path.join(os.tmpdir(), "alarisa-db-host-test");
  const result = await database.start(projectRoot);
  await database.stop();
  assert.equal(result.status, "created");
  assert.equal(result.filename, path.join(projectRoot, "var/state.sqlite"));
  assert.equal(calls.at(-1).operation, "disconnect");
});

test("database composition rejects a partial schema", async () => {
  const connection = {
    async init() {}, setSchemaConfig() {}, getDialectAdapter() { return {}; },
    getSchemaBuilder() { return {hasTable: async (table) => table === "alarisa_case"}; },
  };
  const compilation = {physical: {tables: [{name: "alarisa_case"}, {name: "alarisa_case_relation"}]}};
  const database = new Database({
    fs: {mkdir: async () => {}}, path, dbConfig: {get: () => ({})}, connection,
    demLoad: {exec: async () => ({compilation})},
    schema: {setCompilation() {}, createAllTables: async () => assert.fail("must not create over a partial schema")},
  });
  await assert.rejects(database.start(process.cwd()), /Partial Alarisa database schema/);
});
