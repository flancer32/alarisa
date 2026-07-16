declare global {
  type Alarisa_Config_Loader = typeof import("./src/Config/Loader.mjs").default;
  type Alarisa_Config_Loader$ = InstanceType<Alarisa_Config_Loader>;
  type Alarisa_Host_Bootstrap = typeof import("./src/Host/Bootstrap.mjs").default;
  type Alarisa_Host_Bootstrap$ = InstanceType<Alarisa_Host_Bootstrap>;
  type Alarisa_Host_Handler_ReservedRoutes = typeof import("./src/Host/Handler/ReservedRoutes.mjs").default;
  type Alarisa_Host_Handler_ReservedRoutes$ = InstanceType<Alarisa_Host_Handler_ReservedRoutes>;
  type Alarisa_Host_Handler_PrincipalApiAuth = typeof import("./src/Host/Handler/PrincipalApiAuth.mjs").default;
  type Alarisa_Host_Handler_PrincipalApiAuth$ = InstanceType<Alarisa_Host_Handler_PrincipalApiAuth>;
  type Alarisa_Node_Module = typeof import("node:module");
  type Alarisa_Node_Path = typeof import("node:path");
}

export {};
