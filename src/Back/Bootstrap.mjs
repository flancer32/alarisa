// @ts-check

import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

/**
 * @namespace Alarisa_Back_Bootstrap
 * @description Root application component for the console startup baseline.
 * @typedef {object} Alarisa_Back_Bootstrap_Run_Params
 * @property {string} projectRoot
 * @property {string[]} [cliArgs]
 */

export default class Alarisa_Back_Bootstrap {
  /**
   * @param {object} deps
    * @param {TeqFw_Log_Provider$} deps.logger
    * @param {Fl32_Web_Back_Server$} [deps.server]
    * @param {Fl32_Web_Back_Config_Runtime__Factory$} [deps.runtimeFactory]
    * @param {Fl32_Web_Back_PipelineEngine$} [deps.pipelineEngine]
    * @param {Alarisa_Pwa_Back_Handler_HumanIngress$} [deps.humanIngressHandler]
    * @param {Fl32_Web_Back_Handler_Static$} [deps.staticHandler]
    * @param {Fl32_Web_Back_Dto_Source__Factory$} [deps.sourceFactory]
    */
  constructor({ logger, server, runtimeFactory, pipelineEngine, humanIngressHandler, staticHandler, sourceFactory }) {
    let started = false;
    const log = logger.forSource("Alarisa_Back_Bootstrap");

    /** @type {{start: (options?: {port?: number}) => Promise<void>, stop: () => Promise<void>}} */
    const serverInstance = server ?? {
      async start() {},
      async stop() {},
    };
    /** @type {((value: number) => void)|undefined} */
    let resolveRun;

    this.run = async function ({ projectRoot, cliArgs = [], port, serverType = "http" }) {
      if (runtimeFactory) {
        runtimeFactory.configure({ port, type: serverType });
        runtimeFactory.freeze();
      }

      if (pipelineEngine && humanIngressHandler && staticHandler && sourceFactory) {
        const pwaPackageJson = require.resolve("@flancer32/alarisa-pwa/package.json");
        const pwaWebDirectory = path.join(path.dirname(pwaPackageJson), "web");

        pipelineEngine.addHandler(humanIngressHandler);
        pipelineEngine.addHandler(staticHandler);
        await staticHandler.init({
          sources: [
            sourceFactory.create({
              root: pwaWebDirectory,
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
    logger: "TeqFw_Log_Provider$",
    server: "Fl32_Web_Back_Server$",
    runtimeFactory: "Fl32_Web_Back_Config_Runtime__Factory$",
    pipelineEngine: "Fl32_Web_Back_PipelineEngine$",
    humanIngressHandler: "Alarisa_Pwa_Back_Handler_HumanIngress$",
    staticHandler: "Fl32_Web_Back_Handler_Static$",
    sourceFactory: "Fl32_Web_Back_Dto_Source__Factory$",
  },
});
