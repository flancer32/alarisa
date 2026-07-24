declare global {
  type Alarisa_Config_Runtime = import("./src/Config/Runtime.mjs").Data;
  type Alarisa_Config_Runtime$ = Alarisa_Config_Runtime;
  type Alarisa_Config_Runtime__Factory = import("./src/Config/Runtime.mjs").Factory;
  type Alarisa_Config_Runtime__Params = {projectRoot?: string, host?: string, httpPort?: number, serverType?: string, dataRoot?: string, authOrigin?: string, authRpId?: string, authRpName?: string};
  type Alarisa_Bootstrap = typeof import("./src/Bootstrap.mjs").default;
  type Alarisa_Bootstrap$ = InstanceType<Alarisa_Bootstrap>;
  type Alarisa_Bootstrap__Run_Params = {projectRoot: string, cliArgs?: string[]};
  type Alarisa_Bootstrap__Static_Source_Definition = {root: string, prefix: string, allow: {".": string[]}, defaults: string[]};
  type Alarisa_Host_Handler_ReservedRoutes = typeof import("./src/Host/Handler/ReservedRoutes.mjs").default;
  type Alarisa_Host_Handler_ReservedRoutes$ = InstanceType<Alarisa_Host_Handler_ReservedRoutes>;
  type Alarisa_Host_Handler_PrincipalApiAuth = typeof import("./src/Host/Handler/PrincipalApiAuth.mjs").default;
  type Alarisa_Host_Handler_PrincipalApiAuth$ = InstanceType<Alarisa_Host_Handler_PrincipalApiAuth>;
  type Alarisa_Node_Module = typeof import("node:module");
  type Alarisa_Node_Path = typeof import("node:path");
}

export {};
