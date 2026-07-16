// @ts-check

/**
 * @namespace Alarisa_Host_Handler_ReservedRoutes
 * @description Protects host-owned hook, discovery, and operational URL zones from static mounts.
 */

const PREFIXES = Object.freeze(["/hooks/", "/.well-known/", "/_ops/"]);

export default class ReservedRoutes {
  /**
   * @param {object} deps
   * @param {Fl32_Web_Back_Dto_Info__Factory} deps.dtoInfoFactory
   * @param {Fl32_Web_Back_Enum_Stage} deps.STAGE
   */
  constructor({dtoInfoFactory, STAGE}) {
    const info = dtoInfoFactory.create({
      name: "Alarisa_Host_Handler_ReservedRoutes",
      stage: STAGE.PROCESS,
    });

    this.getRegistrationInfo = function () {
      return info;
    };

    this.handle = async function (context) {
      const pathname = new URL(context.request.url ?? "/", "http://localhost").pathname;
      const matched = PREFIXES.find((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix));
      if (!matched) return;

      context.response.writeHead(404, {"Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"});
      context.response.end(JSON.stringify({error: "No route is configured in this reserved host zone"}));
      context.completed = true;
    };
  }
}

export const __deps__ = Object.freeze({
  dtoInfoFactory: "Fl32_Web_Back_Dto_Info__Factory$",
  STAGE: "Fl32_Web_Back_Enum_Stage$",
});
