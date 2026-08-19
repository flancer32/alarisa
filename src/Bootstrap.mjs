// @ts-check

/**
 * @namespace Alarisa_Bootstrap
 * @description CLI lifecycle plugin that initializes Alarisa runtime configuration and HTTP composition.
 */
export default class Bootstrap {
  /**
   * @param {object} deps
   * @param {Alarisa_Node_Module} deps.module
   * @param {Alarisa_Node_Path} deps.path
   * @param {TeqFw_Log_Provider} deps.logger
   * @param {TeqFw_Cli_Config} deps.cliConfig
   * @param {Alarisa_Config_Runtime__Factory} deps.runtimeFactory
   * @param {Alarisa_Back_Auth_Service} deps.authService
   * @param {Alarisa_State_Database} deps.database
   * @param {TeqFw_Web_Back_PipelineEngine} deps.pipelineEngine
   * @param {Alarisa_Comm_Back_Handler_Authentication} deps.authenticationHandler
   * @param {Alarisa_Host_Handler_PrincipalApiAuth} deps.principalApiAuthHandler
   * @param {Alarisa_Comm_Back_Handler_PrincipalContribution} deps.principalContributionHandler
   * @param {Alarisa_Host_WorldPicture_Handler} deps.worldPictureHandler
   * @param {Alarisa_Host_Handler_ReservedRoutes} deps.reservedRoutesHandler
   * @param {TeqFw_Web_Back_Handler_Static} deps.staticHandler
   * @param {TeqFw_Web_Back_Dto_Source__Factory} deps.sourceFactory
   */
  constructor({module, path, logger, cliConfig, runtimeFactory, authService, database, pipelineEngine, authenticationHandler, principalApiAuthHandler, principalContributionHandler, worldPictureHandler, reservedRoutesHandler, staticHandler, sourceFactory}) {
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
     * @returns {TeqFw_Web_Back_Dto_Source[]}
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
     * @param {string[]} cliArgs
     * @returns {Alarisa_Config_Runtime}
     */
    const initializeRuntime = (projectRoot, cliArgs) => {
      runtimeFactory.configure({projectRoot, httpPort: portOverride(cliArgs), serverType: option(cliArgs, "type"), dataRoot: option(cliArgs, "data-root")});
      return runtimeFactory.freeze();
    };

    /**
     * @param {Alarisa_Cli_Command_Enroll_Options} options
     * @returns {Promise<void>}
     */
    this.enroll = async function (options) {
      const config = runtimeFactory.freeze();
      const surface = options.surface ?? "mob";
      const label = options.label ?? `${surface} device`;
      const ttlMinutes = options["ttl-minutes"];
      const enrollment = await authService.issueEnrollment({label, surface, ttlMs: ttlMinutes === undefined ? undefined : ttlMinutes * 60_000});
      const url = new URL(`/${surface}/`, config.authOrigin);
      url.searchParams.set("enrollment", enrollment.token);
      console.log(`Enrollment URL: ${url}`);
      console.log(`Expires at: ${enrollment.expiresAt}`);
    };

    /** @returns {Promise<void>} */
    this.onStartup = async function () {
      const projectRoot = cliConfig.applicationRoot;
      const config = initializeRuntime(projectRoot, [...cliConfig.argv]);
      await database.start(projectRoot, config.dataRoot);
      const sources = createStaticSources([
        {root: path.join(projectRoot, "web"), prefix: "/", allow: {".": ["."]}, defaults: ["index.html"]},
        {root: packageWebRoot("@flancer32/alarisa-comm"), prefix: "/_assets/comm/", allow: {".": ["."]}, defaults: []},
        {root: packageWebRoot("@flancer32/alarisa-desk"), prefix: "/desk/", allow: {".": ["."]}, defaults: ["index.html"]},
        {root: packageWebRoot("@flancer32/alarisa-mob"), prefix: "/mob/", allow: {".": ["."]}, defaults: ["index.html"]},
      ]);
      pipelineEngine.addHandler(authenticationHandler);
      pipelineEngine.addHandler(principalApiAuthHandler);
      pipelineEngine.addHandler(principalContributionHandler);
      pipelineEngine.addHandler(worldPictureHandler);
      pipelineEngine.addHandler(reservedRoutesHandler);
      pipelineEngine.addHandler(staticHandler);
      await staticHandler.init({sources});
      log.info("Application initialized", {projectRoot, authOrigin: config.authOrigin});
    };

    /**
     * @returns {Promise<void>}
     */
    this.onShutdown = async function () {
      await database.stop();
    };
  }
}

export const __deps__ = Object.freeze({
  default: Object.freeze({
    module: "node:module",
    path: "node:path",
    logger: "TeqFw_Log_Provider$",
    cliConfig: "TeqFw_Cli_Config$",
    runtimeFactory: "Alarisa_Config_Runtime__Factory$",
    authService: "Alarisa_Back_Auth_Service$",
    database: "Alarisa_State_Database$",
    pipelineEngine: "TeqFw_Web_Back_PipelineEngine$",
    authenticationHandler: "Alarisa_Comm_Back_Handler_Authentication$",
    principalApiAuthHandler: "Alarisa_Host_Handler_PrincipalApiAuth$",
    principalContributionHandler: "Alarisa_Comm_Back_Handler_PrincipalContribution$",
    worldPictureHandler: "Alarisa_Comm_Back_Handler_WorldPicture$",
    reservedRoutesHandler: "Alarisa_Host_Handler_ReservedRoutes$",
    staticHandler: "TeqFw_Web_Back_Handler_Static$",
    sourceFactory: "TeqFw_Web_Back_Dto_Source__Factory$",
  }),
});
