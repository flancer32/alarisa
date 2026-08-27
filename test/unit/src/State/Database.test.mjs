import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import {test} from "node:test";
import Database from "../../../../src/State/Database.mjs";

test("database composition initializes the PostgreSQL store, creates an absent schema, and disconnects", async () => {
  const calls = [];
  const connection = {
    async init(config) { calls.push({operation: "init", config}); },
    setSchemaConfig(config) { calls.push({operation: "schema-config", config}); },
    getDialectAdapter() { return {id: "postgresql"}; },
    getSchemaBuilder() { return {async hasTable() { return false; }}; },
    async disconnect() { calls.push({operation: "disconnect"}); },
  };
  const compilation = {physical: {namespace: "", tables: [{name: "alarisa_state_object"}]}};
  const database = new Database({
    dbConfig: {get: () => ({client: "pg", connection: {database: "alarisa", host: "127.0.0.1", user: "alarisa"}})}, connection,
    demLoad: {exec: async () => ({compilation})},
    schema: {
      setCompilation({compilation: value}) { assert.equal(value, compilation); },
      async createAllTables({conn}) { assert.equal(conn, connection); return {status: "complete"}; },
    },
  });
  const result = await database.start(path.join(os.tmpdir(), "alarisa-db-host-test"));
  await database.stop();
  assert.equal(result.status, "created");
  assert.deepEqual(calls[0], {operation: "init", config: {client: "pg", connection: {database: "alarisa", host: "127.0.0.1", user: "alarisa"}}});
  assert.deepEqual(calls[1], {operation: "schema-config", config: {prefix: ""}});
  assert.equal(calls.at(-1).operation, "disconnect");
});

test("database composition rejects a partial PostgreSQL schema", async () => {
  const connection = {
    async init() {}, setSchemaConfig() {}, getDialectAdapter() { return {}; },
    getSchemaBuilder() { return {hasTable: async (table) => table === "alarisa_state_object"}; },
  };
  const compilation = {physical: {namespace: "", tables: [{name: "alarisa_state_object"}, {name: "alarisa_state_relation"}]}};
  const database = new Database({
    dbConfig: {get: () => ({client: "pg"})}, connection,
    demLoad: {exec: async () => ({compilation})},
    schema: {setCompilation() {}, createAllTables: async () => assert.fail("must not create over a partial schema")},
  });
  await assert.rejects(database.start(process.cwd()), /Partial Alarisa database schema/);
});

test("database composition rejects a non-PostgreSQL client", async () => {
  const database = new Database({
    dbConfig: {get: () => ({client: "sqlite3"})},
    connection: {init: async () => assert.fail("must not initialize")},
    demLoad: {exec: async () => assert.fail("must not load schema")},
    schema: {},
  });
  await assert.rejects(database.start(process.cwd()), /requires pg, received 'sqlite3'/);
});
