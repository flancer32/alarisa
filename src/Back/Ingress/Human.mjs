// @ts-check

/**
 * @namespace Alarisa_Back_Ingress_Human
 * @description Host ingress boundary reserved for accepted Principal contributions.
 */

/**
 * The PWA transport is wired before the runtime owns human-signal creation.
 * Rejecting here keeps a transport acknowledgement from claiming that a
 * contribution was accepted as a signal.
 */
export default class Alarisa_Back_Ingress_Human {
  /**
   * @returns {Promise<never>}
   */
  async accept() {
    throw new Error("Human ingress is not available yet");
  }
}
