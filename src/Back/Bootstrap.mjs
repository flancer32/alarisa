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
  constructor() {
    let started = false;

    /**
     * @param {Alarisa_Back_Bootstrap_Run_Params} params
     * @returns {Promise<number>}
     */
    this.run = async function ({ projectRoot, cliArgs = [] }) {
      started = true;
      const suffix = cliArgs.length > 0 ? ` Args: ${cliArgs.join(" ")}` : "";
      console.log(`Alarisa application started. Root: ${projectRoot ?? ""}${suffix}`.trim());
      return 0;
    };

    /**
     * @returns {Promise<void>}
     */
    this.stop = async function () {
      started = false;
    };

    /**
     * @returns {boolean}
     */
    this.isStarted = function () {
      return started;
    };
  }
}
