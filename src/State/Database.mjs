// @ts-check

/**
 * @namespace Alarisa_State_Database
 * @description PostgreSQL State database lifecycle and schema composition.
 */
export default class Alarisa_State_Database {
  /**
   * @param {object} deps
   * @param {TeqFw_Db_Back_Config} deps.dbConfig
   * @param {TeqFw_Db_Back_RDb_IConnect} deps.connection
   * @param {TeqFw_Db_Back_Dem_Load} deps.demLoad
   * @param {TeqFw_Db_Back_RDb_Schema} deps.schema
   */
  constructor({dbConfig, connection, demLoad, schema}) {
    let started = false;

    /** @param {string} projectRoot @returns {Promise<object>} */
    this.start = async function (projectRoot) {
      if (started) return {status: "already-started"};
      const source = dbConfig.get();
      const client = source.client ?? "pg";
      if (client !== "pg") throw new Error(`The Alarisa state store requires pg, received '${client}'.`);
      await connection.init({...source, client});
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
      return {status: present.length === 0 ? "created" : "existing", tables: expected};
    };

    /** @returns {Promise<void>} */
    this.stop = async function () {
      if (!started) return;
      started = false;
      await connection.disconnect();
    };
    /** @returns {TeqFw_Db_Back_RDb_IConnect} */
    this.getConnection = () => connection;
  }
}

export const __deps__ = Object.freeze({default: Object.freeze({
  dbConfig: "TeqFw_Db_Back_Config$",
  connection: "TeqFw_Db_Back_RDb_Connect$", demLoad: "TeqFw_Db_Back_Dem_Load$", schema: "TeqFw_Db_Back_RDb_Schema$",
})});
