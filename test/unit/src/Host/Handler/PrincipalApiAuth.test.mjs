import assert from "node:assert/strict";
import test from "node:test";

import PrincipalApiAuth from "../../../../../src/Host/Handler/PrincipalApiAuth.mjs";

const STAGE = {PROCESS: "PROCESS"};
const dtoInfoFactory = {create: (value) => Object.freeze(value)};
const contract = {
  cookieName: "alarisa_session",
  isAuthenticationRoute: (pathname) => pathname.startsWith("/api/v1/auth/"),
};

function response() {
  return {
    status: undefined,
    body: undefined,
    writeHead(status) { this.status = status; },
    end(body) { this.body = body; },
  };
}

test("requires a valid Principal session for non-auth API operations", async () => {
  const handler = new PrincipalApiAuth({dtoInfoFactory, STAGE, contract, auth: {resolveSession: async () => { throw new Error("invalid"); }}});
  const context = {request: {url: "/api/v1/ingress/human", headers: {}}, response: response(), completed: false};

  await handler.handle(context);

  assert.equal(context.response.status, 401);
  assert.equal(context.completed, true);
});

test("attaches the resolved fixed-Principal session", async () => {
  const session = {principalId: "principal", credentialId: "credential"};
  const handler = new PrincipalApiAuth({dtoInfoFactory, STAGE, contract, auth: {resolveSession: async ({token}) => {
    assert.equal(token, "opaque-token");
    return session;
  }}});
  const context = {request: {url: "/api/v1/ingress/human", headers: {cookie: "other=x; alarisa_session=opaque-token"}}, response: response(), completed: false};

  await handler.handle(context);

  assert.equal(context.completed, false);
  assert.equal(context.principalSession, session);
});

test("leaves static resources and authentication endpoints outside the guard", async () => {
  const handler = new PrincipalApiAuth({dtoInfoFactory, STAGE, contract, auth: {resolveSession: async () => assert.fail("must not resolve")}});
  for (const url of ["/mob/", "/desk/", "/api/v1/auth/session"]) {
    const context = {request: {url, headers: {}}, response: response(), completed: false};
    await handler.handle(context);
    assert.equal(context.completed, false);
  }
});
