// @ts-check

/**
 * @namespace Alarisa_Back_Bootstrap
 * @description Root application component for the console startup baseline.
 */

/**
 * @typedef {object} Alarisa_Back_Bootstrap_Run_Params
 * @property {string} projectRoot
 * @property {string[]} [cliArgs]
 */

export default class Alarisa_Back_Bootstrap {
  /**
   * @param {object} deps
   * @param {TeqFw_Log_Provider} deps.logger
   */
  constructor({ logger }) {
    let started = false;
    const log = logger.forSource("Alarisa_Back_Bootstrap");

    /**
     * @param {Alarisa_Back_Bootstrap_Run_Params} params
     * @returns {Promise<number>}
     */
    this.run = async function ({ projectRoot, cliArgs = [] }) {
      started = true;
      log.info("Application started", { projectRoot, cliArgs });
      return 0;
    };

    /**
     * @returns {Promise<void>}
     */
    this.stop = async function () {
      started = false;
      log.info("Application stopped");
    };

    /**
     * @returns {boolean}
     */
    this.isStarted = function () {
      return started;
    };
  }
}

export const __deps__ = Object.freeze({
  logger: "TeqFw_Log_Provider$",
});
