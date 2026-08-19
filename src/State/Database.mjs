// @ts-check

/** @namespace Alarisa_State_Database */
export default class Alarisa_State_Database {
  /**
   * @param {object} deps
   * @param {Alarisa_Node_FsPromises} deps.fs
   * @param {Alarisa_Node_Path} deps.path
   * @param {TeqFw_Db_Back_Config} deps.dbConfig
   * @param {TeqFw_Db_Back_RDb_IConnect} deps.connection
   * @param {TeqFw_Db_Back_Dem_Load} deps.demLoad
   * @param {TeqFw_Db_Back_RDb_Schema} deps.schema
   */
  constructor({fs, path, dbConfig, connection, demLoad, schema}) {
    let started = false;

    /** @param {string} projectRoot @param {string|undefined} dataRoot @returns {Promise<object>} */
    this.start = async function (projectRoot, dataRoot) {
      if (started) return {status: "already-started"};
      const source = dbConfig.get();
      const client = source.client ?? "sqlite3";
      if (client !== "sqlite3") throw new Error(`The initial Alarisa state store requires sqlite3, received '${client}'.`);
      const configured = source.connection?.filename;
      const filename = (dataRoot !== undefined && (configured === undefined || configured === "var/state.sqlite"))
        ? path.join(dataRoot, "state.sqlite")
        : configured === undefined
          ? path.resolve(projectRoot, "var/state.sqlite")
          : path.isAbsolute(configured) ? configured : path.resolve(projectRoot, configured);
      await fs.mkdir(path.dirname(filename), {recursive: true, mode: 0o700});
      await connection.init({...source, client, connection: {...source.connection, filename}, useNullAsDefault: source.useNullAsDefault ?? true});
      connection.setSchemaConfig({prefix: "alarisa"});
      const adapter = connection.getDialectAdapter();
      const loaded = await demLoad.exec({path: projectRoot, adapter});
      schema.setCompilation({compilation: loaded.compilation});
      const expected = loaded.compilation.physical.tables.map((table) => table.name);
      const present = [];
      for (const table of expected) if (await connection.getSchemaBuilder().hasTable(table)) present.push(table);
      if (present.length === 0) {
        const evidence = await schema.createAllTables({conn: connection});
        if (evidence.status !== "complete") throw new Error("Initial Alarisa database schema creation did not complete.");
      } else if (present.length !== expected.length) {
        throw new Error(`Partial Alarisa database schema detected (${present.length}/${expected.length} tables); automatic repair is forbidden.`);
      }
      started = true;
      return {filename, status: present.length === 0 ? "created" : "existing", tables: expected};
    };

    this.stop = async function () {
      if (!started) return;
      started = false;
      await connection.disconnect();
    };
    this.getConnection = () => connection;
  }
}

export const __deps__ = Object.freeze({default: Object.freeze({
  fs: "node:fs/promises", path: "node:path", dbConfig: "TeqFw_Db_Back_Config$",
  connection: "TeqFw_Db_Back_RDb_Connect$", demLoad: "TeqFw_Db_Back_Dem_Load$", schema: "TeqFw_Db_Back_RDb_Schema$",
})});
