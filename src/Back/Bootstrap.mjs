// @ts-check

/**
 * @namespace Alarisa_Back_Bootstrap
 * @description Root application component for the console startup baseline.
 * @typedef {object} Alarisa_Back_Bootstrap_Run_Params
 * @property {string} projectRoot
 * @property {string[]} [cliArgs]
 */

export default class Bootstrap {
  /**
 * @param {object} deps
 * @param {typeof import("node:module")} deps.module
 * @param {typeof import("node:path")} deps.path
    * @param {TeqFw_Log_Provider$} deps.logger
    * @param {Alarisa_Config_Loader$} [deps.configLoader]
    * @param {Fl32_Web_Back_Server$} [deps.server]
    * @param {Fl32_Web_Back_PipelineEngine$} [deps.pipelineEngine]
    * @param {Alarisa_Mob_Back_Handler_HumanIngress$} [deps.humanIngressHandler]
    * @param {Fl32_Web_Back_Handler_Static$} [deps.staticHandler]
    * @param {Fl32_Web_Back_Dto_Source__Factory$} [deps.sourceFactory]
    */
  constructor({ module, path, logger, configLoader, server, pipelineEngine, humanIngressHandler, staticHandler, sourceFactory }) {
    let started = false;
    const log = logger.forSource("Alarisa_Back_Bootstrap");
    const require = module?.createRequire?.(import.meta.url);

    /** @type {{start: (options?: {port?: number}) => Promise<void>, stop: () => Promise<void>}} */
    const serverInstance = server ?? {
      async start() {},
      async stop() {},
    };
    /** @type {((value: number) => void)|undefined} */
    let resolveRun;

    this.run = async function ({ projectRoot, cliArgs = [], port, serverType }) {
      if (configLoader) {
        await configLoader.load({ projectRoot, overrides: { httpPort: port, serverType } });
      }
      if (pipelineEngine && humanIngressHandler && staticHandler && sourceFactory) {
        const mobPackageJson = require.resolve("@flancer32/alarisa-mob/package.json");
        const mobWebDirectory = path.join(path.dirname(mobPackageJson), "web");

        pipelineEngine.addHandler(humanIngressHandler);
        pipelineEngine.addHandler(staticHandler);
        await staticHandler.init({
          sources: [
            sourceFactory.create({
              root: mobWebDirectory,
              prefix: "/",
              allow: {".": ["."]},
              defaults: ["index.html"],
            }),
          ],
        });
      }

      await serverInstance.start();

      started = true;
      log.info("Application started", { projectRoot, cliArgs });

      return new Promise((resolve) => {
        resolveRun = resolve;
      });
    };

    this.stop = async function () {
      await serverInstance.stop();
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
  default: {
    module: "node:module",
    path: "node:path",
    logger: "TeqFw_Log_Provider$",
    configLoader: "Alarisa_Config_Loader$",
    server: "Fl32_Web_Back_Server$",
    pipelineEngine: "Fl32_Web_Back_PipelineEngine$",
    humanIngressHandler: "Alarisa_Mob_Back_Handler_HumanIngress$",
    staticHandler: "Fl32_Web_Back_Handler_Static$",
    sourceFactory: "Fl32_Web_Back_Dto_Source__Factory$",
  },
});
