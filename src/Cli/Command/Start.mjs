// @ts-check

/**
 * @namespace Alarisa_Cli_Command_Start
 * @description Starts the composed Alarisa web server through the standard TeqFW CLI lifecycle.
 */
export default class Start {
  /**
   * @param {object} deps
   * @param {TeqFw_Web_Cli_Command_Start} deps.webStart
   */
  constructor({webStart}) {
    this.id = "alarisa:start";
    this.summary = "Start the Alarisa server.";
    this.lifetime = "long-running";
    /**
     * @param {Alarisa_Cli_Command_Start_Context} context
     * @returns {Promise<TeqFw_Cli_Command_Runtime>}
     */
    this.start = async function (context) {
      return webStart.start(context);
    };
  }
}

export const __deps__ = Object.freeze({
  default: Object.freeze({
    webStart: "TeqFw_Web_Cli_Command_Start$",
  }),
});
