// @ts-check

/**
 * @namespace Alarisa_Config_Runtime
 * @description Immutable application runtime configuration sourced from the ALARISA namespace.
 */

export class Data {
  /** @type {string|undefined} */ dataRoot;
  /** @type {string|undefined} */ authOrigin;
  /** @type {string|undefined} */ authRpId;
  /** @type {string|undefined} */ authRpName;
  /** @type {number|undefined} */ authChallengeTtlMs;
  /** @type {number|undefined} */ authEnrollmentTtlMs;
  /** @type {number|undefined} */ authMobSessionTtlMs;
  /** @type {number|undefined} */ authDeskSessionTtlMs;
  /** @type {number|undefined} */ authStepUpTtlMs;
}

const cfg = new Data();
let frozen = false;
const facade = {};

const proxy = new Proxy(facade, {
  get(_target, prop) {
    const isServiceProp = prop === "then" || typeof prop === "symbol";
    if (!frozen && !isServiceProp) throw new Error("Runtime configuration is not initialized.");
    return cfg[prop];
  },
  set() { throw new Error("Runtime configuration is immutable."); },
  defineProperty() { throw new Error("Runtime configuration is immutable."); },
  deleteProperty() { throw new Error("Runtime configuration is immutable."); },
  preventExtensions() { throw new Error("Runtime configuration wrapper cannot be frozen."); },
});

export default class Wrapper {
  /**
   * Creates the immutable runtime configuration wrapper.
   */
  constructor() {
    return proxy;
  }
}

export class Factory {
  /**
   * @param {object} deps
   * @param {typeof import("node:path")} deps.path
   * @param {TeqFw_Cfg_Reader} deps.reader
   * @param {Alarisa_Back_Config_Runtime__Factory} deps.backRuntimeFactory
   */
  constructor({path, reader, backRuntimeFactory}) {
    let projectRoot;
    let overrides = {};

    /**
     * @param {string} key
     * @param {unknown} value
     * @returns {string}
     */
    const parseNonEmpty = (key, value) => {
      if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid runtime configuration field ${key}: value must not be empty.`);
      return value;
    };
    /**
     * @param {string} key
     * @param {unknown} value
     * @returns {number}
     */
    const parsePositive = (key, value) => {
      const result = Number.parseInt(value, 10);
      if (!Number.isInteger(result) || String(result) !== String(value) || result <= 0) {
        throw new Error(`Invalid runtime configuration field ${key}: value must be a positive integer.`);
      }
      return result;
    };
    /**
     * @param {unknown} value
     * @returns {number}
     */
    const parsePort = (value) => {
      const result = Number.parseInt(value, 10);
      if (!Number.isInteger(result) || String(result) !== String(value) || result < 1 || result > 65535) {
        throw new Error("Invalid runtime configuration field TEQFW_WEB__PORT: value must be an integer from 1 to 65535.");
      }
      return result;
    };
    /**
     * @param {unknown} value
     * @returns {string}
     */
    const parseOrigin = (value) => {
      const source = parseNonEmpty("ALARISA__AUTH_ORIGIN", value);
      let origin;
      try { origin = new URL(source).origin; } catch { throw new Error("Invalid runtime configuration field ALARISA__AUTH_ORIGIN: expected an HTTP or HTTPS origin."); }
      if ((!origin.startsWith("http://") && !origin.startsWith("https://")) || origin !== source.replace(/\/$/, "")) {
        throw new Error("Invalid runtime configuration field ALARISA__AUTH_ORIGIN: expected an HTTP or HTTPS origin without a path.");
      }
      return origin;
    };
    /**
     * @param {unknown} value
     * @returns {string}
     */
    const parseRpId = (value) => {
      if (typeof value !== "string" || !/^(localhost|[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?)$/.test(value)) {
        throw new Error("Invalid runtime configuration field ALARISA__AUTH_RP_ID: expected a domain name or localhost.");
      }
      return value;
    };

    /**
     * @param {Alarisa_Config_Runtime__Params} params
     * @returns {void}
     */
    this.configure = function (params = {}) {
      if (frozen) throw new Error("Runtime configuration is frozen.");
      if (projectRoot === undefined && params.projectRoot !== undefined) projectRoot = parseNonEmpty("projectRoot", params.projectRoot);
      overrides = {...overrides, ...params};
    };

    /**
     * @returns {Alarisa_Config_Runtime$}
     */
    this.freeze = function () {
      if (frozen) return proxy;
      if (projectRoot === undefined) throw new Error("Runtime configuration requires projectRoot.");
      const alarisa = reader.get("ALARISA");
      const web = reader.get("TEQFW_WEB");
      const httpPort = overrides.httpPort ?? (web.PORT === undefined ? 3000 : parsePort(web.PORT));
      cfg.dataRoot = path.resolve(projectRoot, overrides.dataRoot ?? (alarisa.DATA_ROOT === undefined ? "var" : parseNonEmpty("ALARISA__DATA_ROOT", alarisa.DATA_ROOT)));
      cfg.authOrigin = overrides.authOrigin ?? (alarisa.AUTH_ORIGIN === undefined ? `http://localhost:${httpPort}` : parseOrigin(alarisa.AUTH_ORIGIN));
      cfg.authRpId = overrides.authRpId ?? (alarisa.AUTH_RP_ID === undefined ? "localhost" : parseRpId(alarisa.AUTH_RP_ID));
      cfg.authRpName = overrides.authRpName ?? (alarisa.AUTH_RP_NAME === undefined ? "Alarisa" : parseNonEmpty("ALARISA__AUTH_RP_NAME", alarisa.AUTH_RP_NAME));
      cfg.authChallengeTtlMs = (alarisa.AUTH_CHALLENGE_MINUTES === undefined ? 5 : parsePositive("ALARISA__AUTH_CHALLENGE_MINUTES", alarisa.AUTH_CHALLENGE_MINUTES)) * 60_000;
      cfg.authEnrollmentTtlMs = (alarisa.AUTH_ENROLLMENT_MINUTES === undefined ? 15 : parsePositive("ALARISA__AUTH_ENROLLMENT_MINUTES", alarisa.AUTH_ENROLLMENT_MINUTES)) * 60_000;
      cfg.authMobSessionTtlMs = (alarisa.AUTH_MOB_SESSION_DAYS === undefined ? 90 : parsePositive("ALARISA__AUTH_MOB_SESSION_DAYS", alarisa.AUTH_MOB_SESSION_DAYS)) * 86_400_000;
      cfg.authDeskSessionTtlMs = (alarisa.AUTH_DESK_SESSION_DAYS === undefined ? 180 : parsePositive("ALARISA__AUTH_DESK_SESSION_DAYS", alarisa.AUTH_DESK_SESSION_DAYS)) * 86_400_000;
      cfg.authStepUpTtlMs = (alarisa.AUTH_STEP_UP_MINUTES === undefined ? 30 : parsePositive("ALARISA__AUTH_STEP_UP_MINUTES", alarisa.AUTH_STEP_UP_MINUTES)) * 60_000;
      backRuntimeFactory.configure({...cfg, httpPort, serverType: overrides.serverType, host: overrides.host});
      backRuntimeFactory.freeze();
      Object.freeze(cfg);
      frozen = true;
      return proxy;
    };
  }
}

export const __deps__ = Object.freeze({
  Factory: Object.freeze({
    path: "node:path",
    reader: "TeqFw_Cfg_Reader$",
    backRuntimeFactory: "Alarisa_Back_Config_Runtime__Factory$",
  }),
});
