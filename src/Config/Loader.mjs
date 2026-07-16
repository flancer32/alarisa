// @ts-check

/**
 * @namespace Alarisa_Config_Loader
 * @description Loads and validates Alarisa application runtime configuration.
 */
export default class Loader {
  /**
   * @param {object} deps
   * @param {typeof import("node:fs/promises")} deps.fs
   * @param {typeof import("node:path")} deps.path
   * @param {Alarisa_Back_Config_Runtime__Factory} deps.appCfgRuntimeFactory
   */
  constructor({ fs, path, appCfgRuntimeFactory }) {
    const parseEnv = (content) => {
      const result = {};
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const index = trimmed.indexOf("=");
        if (index <= 0) continue;
        const key = trimmed.slice(0, index).trim();
        if (!key) continue;
        let value = trimmed.slice(index + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        result[key] = value;
      }
      return result;
    };

    const parsePort = (value) => {
      const result = Number.parseInt(value, 10);
      if (!Number.isInteger(result) || String(result) !== value || result < 1 || result > 65535) {
        throw new Error("Invalid runtime configuration field PORT: value must be an integer from 1 to 65535.");
      }
      return result;
    };

    const parseServerType = (value) => {
      if (!["http", "http2", "https"].includes(value)) {
        throw new Error("Invalid runtime configuration field SERVER_TYPE: expected http, http2, or https.");
      }
      return value;
    };

    const parseNonEmpty = (key, value) => {
      if (!value.trim()) throw new Error(`Invalid runtime configuration field ${key}: value must not be empty.`);
      return value;
    };

    const parsePositive = (key, value) => {
      const result = Number.parseInt(value, 10);
      if (!Number.isInteger(result) || String(result) !== value || result <= 0) {
        throw new Error(`Invalid runtime configuration field ${key}: value must be a positive integer.`);
      }
      return result;
    };

    const parseOrigin = (value) => {
      let origin;
      try {
        origin = new URL(value).origin;
      } catch {
        throw new Error("Invalid runtime configuration field ALARISA_AUTH_ORIGIN: expected an HTTP or HTTPS origin.");
      }
      if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
        throw new Error("Invalid runtime configuration field ALARISA_AUTH_ORIGIN: expected an HTTP or HTTPS origin.");
      }
      if (origin !== value.replace(/\/$/, "")) {
        throw new Error("Invalid runtime configuration field ALARISA_AUTH_ORIGIN: paths are not allowed.");
      }
      return origin;
    };

    const parseRpId = (value) => {
      if (!/^(localhost|[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?)$/.test(value)) {
        throw new Error("Invalid runtime configuration field ALARISA_AUTH_RP_ID: expected a domain name or localhost.");
      }
      return value;
    };

    const buildRuntimeConfig = (env, projectRoot, overrides = {}) => {
      const httpPort = overrides.httpPort ?? (env.PORT !== undefined ? parsePort(env.PORT) : 3000);
      return {
        host: overrides.host ?? (env.HOST !== undefined ? parseNonEmpty("HOST", env.HOST) : "127.0.0.1"),
        httpPort,
        serverType: overrides.serverType ?? (env.SERVER_TYPE !== undefined ? parseServerType(env.SERVER_TYPE) : "http"),
        dataRoot: path.resolve(projectRoot, overrides.dataRoot ?? (env.ALARISA_DATA_ROOT !== undefined ? parseNonEmpty("ALARISA_DATA_ROOT", env.ALARISA_DATA_ROOT) : "var")),
        authOrigin: overrides.authOrigin ?? (env.ALARISA_AUTH_ORIGIN !== undefined ? parseOrigin(env.ALARISA_AUTH_ORIGIN) : `http://localhost:${httpPort}`),
        authRpId: overrides.authRpId ?? (env.ALARISA_AUTH_RP_ID !== undefined ? parseRpId(env.ALARISA_AUTH_RP_ID) : "localhost"),
        authRpName: overrides.authRpName ?? (env.ALARISA_AUTH_RP_NAME !== undefined ? parseNonEmpty("ALARISA_AUTH_RP_NAME", env.ALARISA_AUTH_RP_NAME) : "Alarisa"),
        authChallengeTtlMs: (env.ALARISA_AUTH_CHALLENGE_MINUTES !== undefined ? parsePositive("ALARISA_AUTH_CHALLENGE_MINUTES", env.ALARISA_AUTH_CHALLENGE_MINUTES) : 5) * 60_000,
        authEnrollmentTtlMs: (env.ALARISA_AUTH_ENROLLMENT_MINUTES !== undefined ? parsePositive("ALARISA_AUTH_ENROLLMENT_MINUTES", env.ALARISA_AUTH_ENROLLMENT_MINUTES) : 15) * 60_000,
        authMobSessionTtlMs: (env.ALARISA_AUTH_MOB_SESSION_DAYS !== undefined ? parsePositive("ALARISA_AUTH_MOB_SESSION_DAYS", env.ALARISA_AUTH_MOB_SESSION_DAYS) : 90) * 86_400_000,
        authDeskSessionTtlMs: (env.ALARISA_AUTH_DESK_SESSION_DAYS !== undefined ? parsePositive("ALARISA_AUTH_DESK_SESSION_DAYS", env.ALARISA_AUTH_DESK_SESSION_DAYS) : 180) * 86_400_000,
        authStepUpTtlMs: (env.ALARISA_AUTH_STEP_UP_MINUTES !== undefined ? parsePositive("ALARISA_AUTH_STEP_UP_MINUTES", env.ALARISA_AUTH_STEP_UP_MINUTES) : 30) * 60_000,
      };
    };

    const readEnvFile = async (projectRoot) => {
      const filePath = path.join(projectRoot, ".env");
      try {
        const content = await fs.readFile(filePath, "utf8");
        return parseEnv(content);
      } catch (error) {
        if (error && error.code === "ENOENT") return {};
        throw error;
      }
    };

    this.load = async function ({ projectRoot, overrides = {} }) {
      const env = await readEnvFile(projectRoot);
      const config = buildRuntimeConfig(env, projectRoot, overrides);
      appCfgRuntimeFactory.configure(config);
      return appCfgRuntimeFactory.freeze();
    };
  }
}

export const __deps__ = Object.freeze({
  default: {
    fs: "node:fs/promises",
    path: "node:path",
    appCfgRuntimeFactory: "Alarisa_Back_Config_Runtime__Factory$",
  },
});
