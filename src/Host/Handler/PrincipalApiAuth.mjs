// @ts-check

/**
 * @namespace Alarisa_Host_Handler_PrincipalApiAuth
 * @description Requires an opaque Principal session for protected API operations.
 */

function cookieValue(request, name) {
  const source = request.headers.cookie ?? "";
  for (const part of source.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    if (part.slice(0, index).trim() === name) return decodeURIComponent(part.slice(index + 1).trim());
  }
  return undefined;
}

export default class PrincipalApiAuth {
  /**
   * @param {object} deps
   * @param {Fl32_Web_Back_Dto_Info__Factory} deps.dtoInfoFactory
   * @param {Fl32_Web_Back_Enum_Stage} deps.STAGE
   * @param {Alarisa_Comm_Contract_Authentication$} deps.contract
   * @param {Alarisa_Back_Auth_Service$} deps.auth
   */
  constructor({dtoInfoFactory, STAGE, contract, auth}) {
    const info = dtoInfoFactory.create({name: "Alarisa_Host_Handler_PrincipalApiAuth", stage: STAGE.PROCESS});

    this.getRegistrationInfo = function () {
      return info;
    };

    this.handle = async function (context) {
      const pathname = new URL(context.request.url ?? "/", "http://localhost").pathname;
      if (contract.isAuthenticationRoute(pathname) || (pathname !== "/api/v1" && !pathname.startsWith("/api/v1/"))) return;

      const token = cookieValue(context.request, contract.cookieName);
      try {
        context.principalSession = await auth.resolveSession({token});
      } catch {
        context.response.writeHead(401, {"Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store"});
        context.response.end(JSON.stringify({error: "Principal authentication is required"}));
        context.completed = true;
      }
    };
  }
}

export const __deps__ = Object.freeze({
  dtoInfoFactory: "Fl32_Web_Back_Dto_Info__Factory$",
  STAGE: "Fl32_Web_Back_Enum_Stage$",
  contract: "Alarisa_Comm_Contract_Authentication$",
  auth: "Alarisa_Back_Auth_Service$",
});
