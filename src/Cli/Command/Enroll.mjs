// @ts-check

/**
 * @namespace Alarisa_Cli_Command_Enroll
 * @description Issues one short-lived Principal enrollment URL.
 */
export default class Enroll {
  /**
   * @param {object} deps
   * @param {Alarisa_Bootstrap} deps.bootstrap
   */
  constructor({bootstrap}) {
    this.id = "auth:enroll";
    this.summary = "Issue a Principal device enrollment URL.";
    this.lifetime = "finite";
    /**
     * @param {Alarisa_Cli_Command_Enroll_Context} context
     * @returns {Promise<void>}
     */
    this.execute = async function (context) {
      await bootstrap.enroll(context.options);
    };
  }
}

export const __deps__ = Object.freeze({
  default: Object.freeze({
    bootstrap: "Alarisa_Bootstrap$",
  }),
});
