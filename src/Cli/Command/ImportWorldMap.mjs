// @ts-check

/**
 * @namespace Alarisa_Cli_Command_ImportWorldMap
 * @description Loads the bundled World Map snapshot through the durable State importer.
 */
export default class ImportWorldMap {
  /**
   * @param {object} deps
   * @param {object} deps.fs
   * @param {object} deps.path
   * @param {TeqFw_Cli_Config} deps.cliConfig
   * @param {Alarisa_State_WorldMap_Import} deps.importer
   * @param {object} deps.yaml
   */
  constructor({fs, path, cliConfig, importer, yaml}) {
    this.id = "state:import-world-map";
    this.summary = "Import the bundled World Map snapshot into durable State.";
    this.lifetime = "finite";
    /** @returns {Promise<void>} */
    this.execute = async function () {
      const sourcePath = path.join(cliConfig.applicationRoot, "ctx", "agent", "world-map-2026-08-19.yaml");
      const result = await importer.execute(yaml.parse(await fs.readFile(sourcePath, "utf8")));
      console.log(`World Map ${result.status}: ${result.objects} objects, ${result.relations} relations.`);
    };
  }
}

export const __deps__ = Object.freeze({default: Object.freeze({fs: "node:fs/promises", path: "node:path", cliConfig: "TeqFw_Cli_Config$", importer: "Alarisa_State_WorldMap_Import$", yaml: "npm:yaml"})});
