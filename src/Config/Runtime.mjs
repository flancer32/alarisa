// @ts-check

/**
 * @namespace Alarisa_Config_Runtime
 * @description Runtime configuration data for the Alarisa application.
 */
export class Data {
  /** @type {string|undefined} */
  host;
  /** @type {number|undefined} */
  httpPort;
  /** @type {string|undefined} */
  serverType;
  /** @type {string|undefined} */
  dataRoot;
  /** @type {Fl32_Web_Back_Config_Runtime} */
  web;
}

const cfg = new Data();
const facade = {};
let frozen = false;

const proxy = new Proxy(facade, {
  get(_target, prop) {
    const isServiceProp = prop === "then" || typeof prop === "symbol";
    if (!frozen && !isServiceProp) throw new Error("Runtime configuration is not initialized.");
    return Reflect.get(cfg, prop);
  },
  set() {
    throw new Error("Runtime configuration is immutable.");
  },
  defineProperty() {
    throw new Error("Runtime configuration is immutable.");
  },
  deleteProperty() {
    throw new Error("Runtime configuration is immutable.");
  },
  preventExtensions() {
    throw new Error("Runtime configuration cannot be structurally mutated.");
  },
});

/**
 * @namespace Alarisa_Config_Runtime__Factory
 * @description Factory for the immutable Alarisa runtime configuration.
 */
export class Factory {
  /**
   * @param {object} deps
   * @param {Fl32_Web_Back_Config_Runtime__Factory} deps.webRuntimeFactory
   */
  constructor({ webRuntimeFactory }) {
    let factoryFrozen = false;
    cfg.host = undefined;
    cfg.httpPort = undefined;
    cfg.serverType = undefined;
    cfg.dataRoot = undefined;
    frozen = false;

    this.configure = function (params = {}) {
      if (factoryFrozen) throw new Error("Runtime configuration is already frozen.");
      if (params.host !== undefined && cfg.host === undefined) cfg.host = params.host;
      if (params.httpPort !== undefined && cfg.httpPort === undefined) cfg.httpPort = params.httpPort;
      if (params.serverType !== undefined && cfg.serverType === undefined) cfg.serverType = params.serverType;
      if (params.dataRoot !== undefined && cfg.dataRoot === undefined) cfg.dataRoot = params.dataRoot;
      webRuntimeFactory.configure({
        host: params.host,
        port: params.httpPort,
        type: params.serverType,
      });
    };

    this.freeze = function () {
      if (factoryFrozen) return proxy;
      if (cfg.host === undefined) cfg.host = "127.0.0.1";
      if (cfg.httpPort === undefined) cfg.httpPort = 3000;
      if (cfg.serverType === undefined) cfg.serverType = "http";
      if (cfg.dataRoot === undefined) cfg.dataRoot = "var";
      cfg.web = webRuntimeFactory.freeze();
      Object.freeze(cfg);
      factoryFrozen = true;
      frozen = true;
      return proxy;
    };
  }
}

export default class Wrapper {
  constructor() {
    return proxy;
  }
}

export const __deps__ = Object.freeze({
  Factory: Object.freeze({
    webRuntimeFactory: "Fl32_Web_Back_Config_Runtime__Factory$",
  }),
});
