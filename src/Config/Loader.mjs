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
   * @param {Alarisa_Config_Runtime__Factory} deps.appCfgRuntimeFactory
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

    const buildRuntimeConfig = (env, overrides = {}) => ({
      host: overrides.host ?? (env.HOST !== undefined ? parseNonEmpty("HOST", env.HOST) : "127.0.0.1"),
      httpPort: overrides.httpPort ?? (env.PORT !== undefined ? parsePort(env.PORT) : 3000),
      serverType: overrides.serverType ?? (env.SERVER_TYPE !== undefined ? parseServerType(env.SERVER_TYPE) : "http"),
      dataRoot: overrides.dataRoot ?? (env.ALARISA_DATA_ROOT !== undefined ? parseNonEmpty("ALARISA_DATA_ROOT", env.ALARISA_DATA_ROOT) : "var"),
    });

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
      const config = buildRuntimeConfig(env, overrides);
      appCfgRuntimeFactory.configure(config);
      return appCfgRuntimeFactory.freeze();
    };
  }
}

export const __deps__ = Object.freeze({
  default: {
    fs: "node:fs/promises",
    path: "node:path",
    appCfgRuntimeFactory: "Alarisa_Config_Runtime__Factory$",
  },
});
