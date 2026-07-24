// @ts-check

/**
 * @namespace Alarisa_Bootstrap
 * @description Application composition root for Alarisa commands and the self-hosted web server.
 */
export default class Bootstrap {
  /**
   * @param {object} deps
   * @param {Alarisa_Node_Module} deps.module
   * @param {Alarisa_Node_Path} deps.path
   * @param {typeof import("node:fs/promises")} deps.fs
   * @param {typeof import("node:process")} deps.process
   * @param {TeqFw_Log_Provider} deps.logger
   * @param {TeqFw_Cfg_Loader} deps.cfgLoader
   * @param {TeqFw_Cfg_Source_DotenvFile} deps.dotenvSource
   * @param {TeqFw_Cfg_Source_ProcessEnv} deps.processEnvSource
   * @param {Alarisa_Config_Runtime__Factory} deps.runtimeFactory
   * @param {Alarisa_Back_Auth_Service} deps.authService
   * @param {Fl32_Web_Back_Server} deps.server
   * @param {Fl32_Web_Back_PipelineEngine} deps.pipelineEngine
   * @param {Alarisa_Comm_Back_Handler_Authentication} deps.authenticationHandler
   * @param {Alarisa_Host_Handler_PrincipalApiAuth} deps.principalApiAuthHandler
   * @param {Alarisa_Comm_Back_Handler_PrincipalContribution} deps.principalContributionHandler
   * @param {Alarisa_Host_Handler_ReservedRoutes} deps.reservedRoutesHandler
   * @param {Fl32_Web_Back_Handler_Static} deps.staticHandler
   * @param {Fl32_Web_Back_Dto_Source__Factory} deps.sourceFactory
   */
  constructor({module, path, fs, process, logger, cfgLoader, dotenvSource, processEnvSource, runtimeFactory, authService, server, pipelineEngine, authenticationHandler, principalApiAuthHandler, principalContributionHandler, reservedRoutesHandler, staticHandler, sourceFactory}) {
    let started = false;
    let stoppedBeforeRun = false;
    let resolveRun;
    const log = logger.forSource("Alarisa_Bootstrap");
    const require = module.createRequire(import.meta.url);

    /**
     * @param {string[]} args
     * @param {string} name
     * @returns {string|undefined}
     */
    const option = (args, name) => args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);

    /**
     * @param {string[]} args
     * @returns {number|undefined}
     */
    const portOverride = (args) => {
      const value = option(args, "port");
      return value === undefined ? undefined : Number.parseInt(value, 10);
    };

    /**
     * @param {Alarisa_Bootstrap__Static_Source_Definition[]} definitions
     * @returns {Fl32_Web_Back_Dto_Source[]}
     */
    const createStaticSources = (definitions) => {
      const prefixes = new Set();
      for (const definition of definitions) {
        if (prefixes.has(definition.prefix)) throw new Error(`Static route prefix collision: ${definition.prefix}`);
        prefixes.add(definition.prefix);
      }
      return definitions.map((definition) => sourceFactory.create(definition));
    };

    /**
     * @param {string} packageName
     * @returns {string}
     */
    const packageWebRoot = (packageName) => {
      const packageJson = require.resolve(`${packageName}/package.json`);
      return path.join(path.dirname(packageJson), "web");
    };

    /**
     * @param {string} projectRoot
     * @returns {Promise<void>}
     */
    const loadConfigSources = async (projectRoot) => {
      const dotenvPath = path.join(projectRoot, ".env");
      let dotenv;
      try {
        await fs.access(dotenvPath);
        dotenv = dotenvSource.create({path: dotenvPath, id: "project-dotenv"});
      } catch (error) {
        if (!error || error.code !== "ENOENT") throw error;
      }
      await cfgLoader.load([
        ...(dotenv ? [dotenv] : []),
        processEnvSource.create(process.env),
      ]);
    };

    /**
     * @param {string} projectRoot
     * @param {string[]} cliArgs
     * @returns {Promise<Alarisa_Config_Runtime$>}
     */
    const initializeRuntime = async (projectRoot, cliArgs) => {
      await loadConfigSources(projectRoot);
      runtimeFactory.configure({projectRoot, httpPort: portOverride(cliArgs), serverType: option(cliArgs, "type"), dataRoot: option(cliArgs, "data-root")});
      return runtimeFactory.freeze();
    };

    /**
     * @param {Alarisa_Config_Runtime$} config
     * @param {string[]} cliArgs
     * @returns {Promise<number>}
     */
    const runEnrollment = async (config, cliArgs) => {
      const surface = option(cliArgs, "surface") ?? "mob";
      const label = option(cliArgs, "label") ?? `${surface} device`;
      const ttlMinutes = option(cliArgs, "ttl-minutes");
      const enrollment = await authService.issueEnrollment({label, surface, ttlMs: ttlMinutes === undefined ? undefined : Number.parseInt(ttlMinutes, 10) * 60_000});
      const url = new URL(`/${surface}/`, config.authOrigin);
      url.searchParams.set("enrollment", enrollment.token);
      console.log(`Enrollment URL: ${url}`);
      console.log(`Expires at: ${enrollment.expiresAt}`);
      return 0;
    };

    /**
     * @param {Alarisa_Config_Runtime$} config
     * @param {string} projectRoot
     * @param {string[]} cliArgs
     * @returns {Promise<number>}
     */
    const runServer = async (config, projectRoot, cliArgs) => {
      const sources = createStaticSources([
        {root: path.join(projectRoot, "web"), prefix: "/", allow: {".": ["."]}, defaults: ["index.html"]},
        {root: packageWebRoot("@flancer32/alarisa-comm"), prefix: "/_assets/comm/", allow: {".": ["."]}, defaults: []},
        {root: packageWebRoot("@flancer32/alarisa-desk"), prefix: "/desk/", allow: {".": ["."]}, defaults: ["index.html"]},
        {root: packageWebRoot("@flancer32/alarisa-mob"), prefix: "/mob/", allow: {".": ["."]}, defaults: ["index.html"]},
      ]);
      pipelineEngine.addHandler(authenticationHandler);
      pipelineEngine.addHandler(principalApiAuthHandler);
      pipelineEngine.addHandler(principalContributionHandler);
      pipelineEngine.addHandler(reservedRoutesHandler);
      pipelineEngine.addHandler(staticHandler);
      await staticHandler.init({sources});
      await server.start();
      started = true;
      log.info("Application started", {projectRoot, cliArgs, authOrigin: config.authOrigin});
      return new Promise((resolve) => { resolveRun = resolve; });
    };

    /**
     * @param {Alarisa_Bootstrap__Run_Params} params
     * @returns {Promise<number>}
     */
    this.run = async function (params) {
      if (stoppedBeforeRun) return 0;
      const {projectRoot, cliArgs = []} = params;
      const config = await initializeRuntime(projectRoot, cliArgs);
      if (cliArgs[0] === "auth:enroll") return runEnrollment(config, cliArgs);
      return runServer(config, projectRoot, cliArgs);
    };

    /**
     * @returns {Promise<void>}
     */
    this.stop = async function () {
      if (!started) {
        stoppedBeforeRun = true;
        return;
      }
      await server.stop();
      started = false;
      if (resolveRun) {
        const resolve = resolveRun;
        resolveRun = undefined;
        resolve(0);
      }
      log.info("Application stopped");
    };
  }
}

export const __deps__ = Object.freeze({
  default: Object.freeze({
    module: "node:module",
    path: "node:path",
    fs: "node:fs/promises",
    process: "node:process",
    logger: "TeqFw_Log_Provider$",
    cfgLoader: "TeqFw_Cfg_Loader$",
    dotenvSource: "TeqFw_Cfg_Source_DotenvFile$",
    processEnvSource: "TeqFw_Cfg_Source_ProcessEnv$",
    runtimeFactory: "Alarisa_Config_Runtime__Factory$",
    authService: "Alarisa_Back_Auth_Service$",
    server: "Fl32_Web_Back_Server$",
    pipelineEngine: "Fl32_Web_Back_PipelineEngine$",
    authenticationHandler: "Alarisa_Comm_Back_Handler_Authentication$",
    principalApiAuthHandler: "Alarisa_Host_Handler_PrincipalApiAuth$",
    principalContributionHandler: "Alarisa_Comm_Back_Handler_PrincipalContribution$",
    reservedRoutesHandler: "Alarisa_Host_Handler_ReservedRoutes$",
    staticHandler: "Fl32_Web_Back_Handler_Static$",
    sourceFactory: "Fl32_Web_Back_Dto_Source__Factory$",
  }),
});
