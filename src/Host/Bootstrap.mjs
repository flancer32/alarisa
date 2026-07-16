// @ts-check

/**
 * @namespace Alarisa_Host_Bootstrap
 * @description Single self-hosted server composition root and global HTTP route-map owner.
 */

export default class Bootstrap {
  /**
   * @param {object} deps
   * @param {Alarisa_Node_Module} deps.module
   * @param {Alarisa_Node_Path} deps.path
   * @param {TeqFw_Log_Provider} deps.logger
   * @param {Alarisa_Config_Loader} deps.configLoader
   * @param {Fl32_Web_Back_Server} deps.server
   * @param {Fl32_Web_Back_PipelineEngine} deps.pipelineEngine
   * @param {Alarisa_Comm_Back_Handler_Authentication} deps.authenticationHandler
   * @param {Alarisa_Host_Handler_PrincipalApiAuth} deps.principalApiAuthHandler
   * @param {Alarisa_Comm_Back_Handler_PrincipalContribution} deps.principalContributionHandler
   * @param {Alarisa_Host_Handler_ReservedRoutes} deps.reservedRoutesHandler
   * @param {Fl32_Web_Back_Handler_Static} deps.staticHandler
   * @param {Fl32_Web_Back_Dto_Source__Factory} deps.sourceFactory
   */
  constructor({module, path, logger, configLoader, server, pipelineEngine, authenticationHandler, principalApiAuthHandler, principalContributionHandler, reservedRoutesHandler, staticHandler, sourceFactory}) {
    let started = false;
    const log = logger.forSource("Alarisa_Host_Bootstrap");
    const require = module.createRequire(import.meta.url);
    let resolveRun;

    /**
     * @param {{root: string, prefix: string, allow: {".": string[]}, defaults: string[]}[]} definitions
     * @returns {Fl32_Web_Back_Dto_Source[]}
     */
    function createStaticSources(definitions) {
      const prefixes = new Set();
      for (const definition of definitions) {
        if (prefixes.has(definition.prefix)) throw new Error(`Static route prefix collision: ${definition.prefix}`);
        prefixes.add(definition.prefix);
      }
      return definitions.map((definition) => sourceFactory.create(definition));
    }

    /**
     * @param {{projectRoot: string, cliArgs?: string[], port?: number, serverType?: string}} params
     * @returns {Promise<number>}
     */
    this.run = async function ({projectRoot, cliArgs = [], port, serverType}) {
      await configLoader.load({projectRoot, overrides: {httpPort: port, serverType}});

      const packageWebRoot = (packageName) => {
        const packageJson = require.resolve(`${packageName}/package.json`);
        return path.join(path.dirname(packageJson), "web");
      };
      const sources = createStaticSources([
        {
          root: path.join(projectRoot, "web"),
          prefix: "/",
          allow: {".": ["."]},
          defaults: ["index.html"],
        },
        {
          root: packageWebRoot("@flancer32/alarisa-comm"),
          prefix: "/_assets/comm/",
          allow: {".": ["."]},
          defaults: [],
        },
        {
          root: packageWebRoot("@flancer32/alarisa-desk"),
          prefix: "/desk/",
          allow: {".": ["."]},
          defaults: ["index.html"],
        },
        {
          root: packageWebRoot("@flancer32/alarisa-mob"),
          prefix: "/mob/",
          allow: {".": ["."]},
          defaults: ["index.html"],
        },
      ]);

      pipelineEngine.addHandler(authenticationHandler);
      pipelineEngine.addHandler(principalApiAuthHandler);
      pipelineEngine.addHandler(principalContributionHandler);
      pipelineEngine.addHandler(reservedRoutesHandler);
      pipelineEngine.addHandler(staticHandler);
      await staticHandler.init({sources});
      await server.start();

      started = true;
      log.info("Application started", {projectRoot, cliArgs});

      return new Promise((resolve) => {
        resolveRun = resolve;
      });
    };

    this.stop = async function () {
      await server.stop();
      if (resolveRun) {
        const resolve = resolveRun;
        resolveRun = undefined;
        resolve(0);
      }
      started = false;
      log.info("Application stopped");
    };

    this.isStarted = function () {
      return started;
    };
  }
}

export const __deps__ = Object.freeze({
  module: "node:module",
  path: "node:path",
  logger: "TeqFw_Log_Provider$",
  configLoader: "Alarisa_Config_Loader$",
  server: "Fl32_Web_Back_Server$",
  pipelineEngine: "Fl32_Web_Back_PipelineEngine$",
  authenticationHandler: "Alarisa_Comm_Back_Handler_Authentication$",
  principalApiAuthHandler: "Alarisa_Host_Handler_PrincipalApiAuth$",
  principalContributionHandler: "Alarisa_Comm_Back_Handler_PrincipalContribution$",
  reservedRoutesHandler: "Alarisa_Host_Handler_ReservedRoutes$",
  staticHandler: "Fl32_Web_Back_Handler_Static$",
  sourceFactory: "Fl32_Web_Back_Dto_Source__Factory$",
});
