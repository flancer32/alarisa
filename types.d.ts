declare global {
  type Alarisa_Config_Runtime = import("./src/Config/Runtime.mjs").Data;
  type Alarisa_Config_Runtime$ = Alarisa_Config_Runtime;
  type Alarisa_Config_Runtime__Factory = import("./src/Config/Runtime.mjs").Factory;
  type Alarisa_Config_Runtime__Params = {projectRoot?: string, host?: string, httpPort?: number, serverType?: string, dataRoot?: string, authOrigin?: string, authRpId?: string, authRpName?: string};
  type Alarisa_Bootstrap = typeof import("./src/Bootstrap.mjs").default;
  type Alarisa_Bootstrap$ = InstanceType<Alarisa_Bootstrap>;
  type Alarisa_Cli_Command_Enroll = typeof import("./src/Cli/Command/Enroll.mjs").default;
  type Alarisa_Cli_Command_Enroll$ = InstanceType<Alarisa_Cli_Command_Enroll>;
  type Alarisa_Cli_Command_Enroll_Context = {options: Alarisa_Cli_Command_Enroll_Options, signal: AbortSignal};
  type Alarisa_Cli_Command_Enroll_Options = {surface?: string, label?: string, "ttl-minutes"?: number, "data-root"?: string};
  type Alarisa_Cli_Command_Start = typeof import("./src/Cli/Command/Start.mjs").default;
  type Alarisa_Cli_Command_Start$ = InstanceType<Alarisa_Cli_Command_Start>;
  type Alarisa_Host_WorldPicture_Handler = Alarisa_Comm_Back_Handler_WorldPicture$;
  type Alarisa_Cli_Command_Start_Context = {options: {port?: number, type?: string, "data-root"?: string}, signal: AbortSignal};
  type Alarisa_Bootstrap__Static_Source_Definition = {root: string, prefix: string, allow: {".": string[]}, defaults: string[]};
  type Alarisa_Host_Handler_ReservedRoutes = typeof import("./src/Host/Handler/ReservedRoutes.mjs").default;
  type Alarisa_Host_Handler_ReservedRoutes$ = InstanceType<Alarisa_Host_Handler_ReservedRoutes>;
  type Alarisa_Host_Handler_PrincipalApiAuth = typeof import("./src/Host/Handler/PrincipalApiAuth.mjs").default;
  type Alarisa_Host_Handler_PrincipalApiAuth$ = InstanceType<Alarisa_Host_Handler_PrincipalApiAuth>;
  type Alarisa_State_Database = typeof import("./src/State/Database.mjs").default;
  type Alarisa_State_Database$ = InstanceType<Alarisa_State_Database>;
  type Alarisa_Node_FsPromises = typeof import("node:fs/promises");
  type Alarisa_Node_Module = typeof import("node:module");
  type Alarisa_Node_Path = typeof import("node:path");
}

export {};
